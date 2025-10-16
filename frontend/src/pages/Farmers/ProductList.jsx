import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  LayoutGrid,
  LayoutList,
  MoreVertical,
  Tag,
  ShoppingCart,
  Info,
  ArrowRight,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userData, setUserData] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // View mode state (list or grid)
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(viewMode === 'grid' ? 9 : 5);
  
  // Filter state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: { min: '', max: '' },
    minQuantity: '',
    sortBy: 'newest', // Options: newest, oldest, price-high, price-low, name
  });

  // Update items per page when view mode changes
  useEffect(() => {
    setItemsPerPage(viewMode === 'grid' ? 9 : 5);
  }, [viewMode]);

  useEffect(() => {
    // Check for both token and user data
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    console.log('Stored User:', storedUser);
    console.log('Auth Token:', token);

    let parsedUser = null;
    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
        console.log('Parsed user data:', parsedUser);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }

    // Handle authentication scenarios
    if (!token) {
      console.log('No authentication token found, redirecting to login');
      navigate('/login');
      return;
    }

    // For Mongoose, user id should be in _id
    if (!parsedUser || !parsedUser.id) {
      console.log('Valid token but invalid user data. Redirecting to login.');
      navigate('/login');
      return;
    }

    // If we have valid user data, set it to state
    setUserData(parsedUser);
  }, [navigate]);

  useEffect(() => {
    if (userData?.id) {
      fetchFarmerProducts();
    }
  }, [userData]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const fetchFarmerProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products for farmer ID:', userData.id);

      const token = localStorage.getItem('token');
      // API endpoint updated to use _id from Mongoose
      const response = await fetch(`${API_BASE_URL}/api/products/farmer/${userData.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      // Handle 404 as a special case for new users
      if (response.status === 404) {
        console.log('No products found - likely a new user');
        setProducts([]);
        setIsNewUser(true);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }

      console.log('API response:', data);

      if (data.products) {
        setProducts(data.products);
        console.log(`Loaded ${data.products.length} products`);

        if (data.products.length === 0) {
          setIsNewUser(true);
        }
      } else {
        console.warn('Unexpected API response format:', data);
        setProducts([]);
        setIsNewUser(true);
      }

    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.message.includes('Not Found') || error.message.includes('404')) {
        setProducts([]);
        setIsNewUser(true);
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Apply all filters to products
  const applyFilters = (products) => {
    let filtered = [...products];
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(product => 
        product.category === filters.category
      );
    }
    
    // Apply price range filter
    if (filters.priceRange.min !== '') {
      filtered = filtered.filter(product => 
        product.price >= Number(filters.priceRange.min)
      );
    }
    
    if (filters.priceRange.max !== '') {
      filtered = filtered.filter(product => 
        product.price <= Number(filters.priceRange.max)
      );
    }
    
    // Apply quantity filter
    if (filters.minQuantity !== '') {
      filtered = filtered.filter(product => 
        product.available_quantity >= Number(filters.minQuantity)
      );
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    
    return filtered;
  };

  // Apply filters to get filtered products
  const filteredProducts = applyFilters(products);
  
  // Get current page of products for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Handle filter change
  const handleFilterChange = (name, value) => {
    if (name.startsWith('priceRange.')) {
      const field = name.split('.')[1];
      setFilters(prev => ({
        ...prev,
        priceRange: {
          ...prev.priceRange,
          [field]: value
        }
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle filter reset
  const resetFilters = () => {
    setFilters({
      category: '',
      priceRange: { min: '', max: '' },
      minQuantity: '',
      sortBy: 'newest',
    });
    setSearchTerm('');
  };

  // Handle delete product
  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const token = localStorage.getItem('token');
        console.log('Deleting product with ID:', productId);
        const response = await fetch(`${API_BASE_URL}/api/products/delete/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete product');
        }

        fetchFarmerProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  // Pagination controls
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Toggle view mode between list and grid
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'grid' : 'list');
  };

  // Options for filters
  const categories = [
    'Vegetables',
    'Fruits',
    'Dairy',
    'Grains',
    'Spices',
    'Herbs',
    'Other'
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-high', label: 'Price (High to Low)' },
    { value: 'price-low', label: 'Price (Low to High)' },
    { value: 'name', label: 'Name (A-Z)' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
        <Navbar />
        <div className="pt-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isNewUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
        <Navbar />
        <div className="pt-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center text-red-500">
              <p>Error: {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // New user: redirect to add product
  if (isNewUser || products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
        <Navbar />
        <div className="pt-24 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-block p-3 rounded-full bg-teal-500/10 mb-6"
              >
                <Package className="w-10 h-10 text-green-600 dark:text-teal-400" />
              </motion.div>
              <h1 className="font-serif text-4xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-4">
                Welcome to Your Product Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                It looks like you don't have any products yet. Let's add your first product to get started!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/farmer/add-product')}
                className="bg-green-600 dark:bg-teal-500 text-white px-8 py-3 rounded-lg flex items-center space-x-2 hover:bg-green-700 dark:hover:bg-teal-600 transition-colors mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Product</span>
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-green-200/20 dark:border-teal-800/20 p-6"
            >
              <h2 className="text-xl font-semibold text-green-900 dark:text-teal-50 mb-4">Getting Started Tips:</h2>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Add details about your products including images, prices, and availability.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Include information about organic farming, sustainability practices, and product origins.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Update your inventory regularly to reflect current stock levels.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Set competitive prices based on market trends and product quality.</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Regular user with products
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
      <Navbar />
      <div className="pt-24 px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-white mb-2"
            >
              Manage Products
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400"
            >
              Add, edit, and manage your farm products for the marketplace
            </motion.p>
          </div>
          
          {/* Top controls - Search and Add */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#2d4f47] text-white pl-10 pr-4 py-2.5 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              {/* View toggle buttons */}
              <div className="flex bg-[#2d4f47] rounded-lg overflow-hidden border border-teal-500/20">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 flex items-center gap-1 ${
                    viewMode === 'list' 
                      ? 'bg-teal-500 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-teal-500/20'
                  } transition-colors`}
                  title="List View"
                >
                  <LayoutList className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 flex items-center gap-1 ${
                    viewMode === 'grid' 
                      ? 'bg-teal-500 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-teal-500/20'
                  } transition-colors`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>
            
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="bg-[#2d4f47] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 border border-teal-500/20 hover:border-teal-500/50 transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/farmer/add-product')}
                className="bg-teal-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-teal-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Product</span>
              </motion.button>
            </div>
          </div>
          
          {/* Filters panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-[#2d4f47] rounded-xl p-5 border border-teal-500/20">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-medium">Filter Products</h3>
                    <button 
                      onClick={resetFilters}
                      className="text-teal-400 text-sm hover:text-teal-300 transition-colors flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Reset All
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Category filter */}
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Category</label>
                      <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="w-full bg-[#1a332e] text-white px-3 py-2 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500 text-sm"
                      >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Price range */}
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Price Range (₹)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.priceRange.min}
                          onChange={(e) => handleFilterChange('priceRange.min', e.target.value)}
                          className="w-1/2 bg-[#1a332e] text-white px-3 py-2 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500 text-sm"
                          min="0"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.priceRange.max}
                          onChange={(e) => handleFilterChange('priceRange.max', e.target.value)}
                          className="w-1/2 bg-[#1a332e] text-white px-3 py-2 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500 text-sm"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    {/* Quantity filter */}
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Min Quantity</label>
                      <input
                        type="number"
                        placeholder="Min. quantity"
                        value={filters.minQuantity}
                        onChange={(e) => handleFilterChange('minQuantity', e.target.value)}
                        className="w-full bg-[#1a332e] text-white px-3 py-2 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500 text-sm"
                        min="0"
                      />
                    </div>
                    
                    {/* Sort filter */}
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Sort By</label>
                      <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="w-full bg-[#1a332e] text-white px-3 py-2 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500 text-sm"
                      >
                        {sortOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Filter summary */}
          {(filters.category || filters.priceRange.min || filters.priceRange.max || filters.minQuantity) && (
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-400">Active filters:</span>
              
              {filters.category && (
                <span className="text-xs bg-teal-800/50 text-teal-300 px-2 py-1 rounded-full flex items-center gap-1">
                  Category: {filters.category}
                  <button onClick={() => handleFilterChange('category', '')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {(filters.priceRange.min || filters.priceRange.max) && (
                <span className="text-xs bg-teal-800/50 text-teal-300 px-2 py-1 rounded-full flex items-center gap-1">
                  Price: 
                  {filters.priceRange.min ? `₹${filters.priceRange.min}` : '₹0'} 
                  - 
                  {filters.priceRange.max ? `₹${filters.priceRange.max}` : '∞'}
                  <button onClick={() => setFilters(prev => ({...prev, priceRange: {min: '', max: ''}}))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {filters.minQuantity && (
                <span className="text-xs bg-teal-800/50 text-teal-300 px-2 py-1 rounded-full flex items-center gap-1">
                  Min Qty: {filters.minQuantity}
                  <button onClick={() => handleFilterChange('minQuantity', '')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              <button 
                onClick={resetFilters}
                className="text-xs text-red-400 hover:text-red-300 transition-colors underline"
              >
                Clear all
              </button>
            </div>
          )}
          
          {/* Results summary */}
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-400">
              Showing {currentProducts.length} of {filteredProducts.length} products
              {products.length !== filteredProducts.length && ` (filtered from ${products.length} total)`}
            </p>
            
            <p className="text-sm text-gray-400">
              View: 
              <span className="ml-1 text-teal-400 font-medium">
                {viewMode === 'list' ? 'List' : 'Grid'}
              </span>
            </p>
          </div>
          
          {/* Products display - List or Grid */}
          <motion.div
            key={viewMode} // Force re-render animation when view changes
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-teal-800/20 overflow-hidden"
          >
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">No products found matching your criteria</p>
                <button 
                  onClick={resetFilters}
                  className="text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : viewMode === 'list' ? (
              // List View (Table)
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-teal-800/20">
                      <th className="text-left py-3 px-4 text-gray-300">Product</th>
                      <th className="text-left py-3 px-4 text-gray-300">Category</th>
                      <th className="text-left py-3 px-4 text-gray-300">Price</th>
                      <th className="text-left py-3 px-4 text-gray-300">Quantity</th>
                      <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-teal-800/20 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            {product.image_url && (
                              <img
                                src={`${API_BASE_URL}${product.image_url.startsWith('/') ? '' : '/'}${product.image_url}`}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/40?text=No+Image';
                                }}
                              />
                            )}
                            <div>
                              <div className="text-teal-50 font-medium">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-400 truncate max-w-xs">
                                {product.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-900/30 text-teal-300">
                            {product.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-teal-50">
                          ₹{product.price}
                          {product.discount > 0 && (
                            <span className="ml-2 text-xs text-red-400">
                              -{product.discount}%
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-teal-50">
                          {product.available_quantity} {product.unit}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => navigate(`/farmer/update/${product.id}`)}
                              className="p-2 text-blue-400 hover:text-blue-300"
                              title="Edit Product"
                            >
                              <Edit className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-red-400 hover:text-red-300"
                              title="Delete Product"
                            >
                              <Trash2 className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Grid View (Cards)
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -5 }}
                      className="bg-[#2d4f47] rounded-xl overflow-hidden border border-teal-500/20 transition-all hover:border-teal-500/40 h-full flex flex-col"
                    >
                      {/* Product Image */}
                      <div className="h-48 bg-[#1a332e] relative overflow-hidden">
                        <img
                          src={`${API_BASE_URL}${product.image_url.startsWith('/') ? '' : '/'}${product.image_url}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                          }}
                        />
                        
                        {/* Category Label */}
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-900/60 text-teal-300 backdrop-blur-sm">
                            {product.category}
                          </span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="absolute top-3 right-3 flex space-x-1">
                          <button
                            onClick={() => navigate(`/farmer/update/${product.id}`)}
                            className="p-2 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-teal-600/80 transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-red-600/80 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Discount Label */}
                        {product.discount > 0 && (
                          <div className="absolute bottom-3 right-3">
                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-500 text-white">
                              {product.discount}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Product Details */}
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-lg font-medium text-white mb-1 line-clamp-1">{product.name}</h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                        
                        <div className="mt-auto space-y-3">
                          {/* Price */}
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-teal-400" />
                              <span className="text-gray-300 text-sm">Price:</span>
                            </div>
                            <div className="text-white font-medium">
                              ₹{product.price}
                              {product.discount > 0 && (
                                <span className="text-xs text-gray-400 ml-1 line-through">
                                  ₹{Math.round(product.price * (1 + product.discount/100))}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Inventory */}
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="w-4 h-4 text-teal-400" />
                              <span className="text-gray-300 text-sm">Stock:</span>
                            </div>
                            <div className={`font-medium ${product.available_quantity > 10 ? 'text-green-400' : 'text-orange-400'}`}>
                              {product.available_quantity} {product.unit}
                            </div>
                          </div>
                          
                          {/* Traceability (if available) */}
                          {product.traceability && product.traceability.harvest_method && (
                            <div className="flex items-baseline justify-between">
                              <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-teal-400" />
                                <span className="text-gray-300 text-sm">Farming:</span>
                              </div>
                              <div className="text-teal-300 text-sm">
                                {product.traceability.harvest_method}
                              </div>
                            </div>
                          )}
                          
                          {/* View Details Button */}
                          <button
                            onClick={() => navigate(`/farmer/update/${product.id}`)}
                            className="w-full mt-3 bg-teal-800/50 hover:bg-teal-700 text-teal-300 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Pagination controls */}
            {filteredProducts.length > 0 && (
              <div className="p-4 border-t border-teal-800/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                
                <div className="flex items-center space-x-1">
                  {/* Items per page selector */}
                  <div className="mr-4 flex items-center gap-2">
                    <span className="text-sm text-gray-400">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="bg-[#1a332e] text-white px-2 py-1 rounded border border-teal-500/20 focus:outline-none focus:border-teal-500 text-sm"
                    >
                      {viewMode === 'grid' 
                        ? [6, 9, 12, 15].map(number => (
                            <option key={number} value={number}>{number}</option>
                          ))
                        : [5, 10, 25, 50].map(number => (
                            <option key={number} value={number}>{number}</option>
                          ))
                      }
                    </select>
                  </div>
                  
                  {/* Pagination buttons */}
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md bg-teal-800/30 text-teal-300 hover:bg-teal-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Calculate page numbers to show (5 at most)
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      if (pageNum > 0 && pageNum <= totalPages) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => paginate(pageNum)}
                            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                              currentPage === pageNum 
                                ? 'bg-teal-500 text-white' 
                                : 'bg-teal-800/30 text-teal-300 hover:bg-teal-800/50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md bg-teal-800/30 text-teal-300 hover:bg-teal-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ProductList;