import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function EditProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // State for product data matching the schema
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    discount: 0,
    available_quantity: '',
    unit: 'kg',
    farmer_id: '',
    traceability: {
      harvest_method: 'Organic',
      harvest_date: ''
    }
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch product details when component mounts
  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    } else {
      toast.error("Product ID is missing");
      setLoading(false);
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get token
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      console.log('Fetching product details for ID:', productId);
      
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch product details: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Product data received:', data);
      
      // The response could have different structures, handle them all
      const product = data.product || data || {};
      
      if (!product._id && !product.name) {
        console.error('Invalid product data received:', product);
        throw new Error('Product details not found or in incorrect format');
      }
      
      // Set form data with proper structure
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price || '',
        discount: product.discount || 0,
        available_quantity: product.available_quantity || '',
        unit: product.unit || 'kg',
        farmer_id: product.farmer_id || '',
        traceability: {
          harvest_method: product.traceability?.harvest_method || 'Organic',
          harvest_date: product.traceability?.harvest_date ? 
            new Date(product.traceability.harvest_date).toISOString().split('T')[0] : ''
        }
      });
  
      // Set image preview
      if (product.image_url) {
        // Handle different image URL formats
        let imageUrl = product.image_url;
        
        if (!imageUrl.startsWith('http')) {
          imageUrl = `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
        
        console.log('Setting image preview URL:', imageUrl);
        setImagePreview(imageUrl);
      }
      
    } catch (error) {
      console.error('Error fetching product:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('traceability.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        traceability: {
          ...prev.traceability,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
  
    try {
      // Validate required fields
      if (!formData.name || !formData.category || !formData.description || 
          !formData.price || !formData.available_quantity) {
        throw new Error('Please fill all required fields');
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const submitFormData = new FormData();
      
      // Append all basic form fields
      submitFormData.append('name', formData.name);
      submitFormData.append('category', formData.category);
      submitFormData.append('description', formData.description);
      submitFormData.append('price', formData.price);
      submitFormData.append('discount', formData.discount);
      submitFormData.append('available_quantity', formData.available_quantity);
      submitFormData.append('unit', formData.unit);
      submitFormData.append('farmer_id', formData.farmer_id);
  
      // Append traceability as JSON string
      submitFormData.append('traceability', JSON.stringify({
        harvest_method: formData.traceability.harvest_method || 'Organic',
        harvest_date: formData.traceability.harvest_date || ''
      }));
  
      // Append image if selected
      if (imageFile) {
        submitFormData.append('image', imageFile);
      }
  
      console.log('Submitting update for product ID:', productId);
      
      const response = await fetch(`${API_BASE_URL}/api/products/update/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitFormData
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        let errorMessage = 'Failed to update product';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Failed to update product: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
  
      const data = await response.json();
      console.log('Update successful:', data);
      
      toast.success('Product updated successfully!');
      navigate('/farmer/products');
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Option arrays
  const categories = [
    'Vegetables',
    'Fruits',
    'Dairy',
    'Grains',
    'Spices',
    'Herbs',
    'Other'
  ];
  
  const harvestMethods = [
    'Organic',
    'Conventional',
    'Hydroponic',
    'Aquaponic',
    'Other'
  ];

  const units = [
    'kg',
    'g',
    'lb',
    'pieces',
    'bunches',
    'liters',
    'ml',
    'units'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a332e]">
        <Navbar />
        <div className="pt-24 px-6 text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a332e]">
        <Navbar />
        <div className="pt-24 px-6 text-center">
          <div className="max-w-md mx-auto bg-red-500/10 rounded-lg p-6">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => navigate('/farmer/products')}
              className="mt-4 text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a332e]">
      <Navbar />
      <div className="pt-24 px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link 
            to="/farmer/products"
            className="inline-flex items-center text-teal-400 hover:text-teal-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
          </Link>

          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">Edit Product</h1>
            <p className="text-gray-400">Product ID: {productId}</p>
          </motion.div>

          {/* Form */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* Product Information Section */}
            <div className="bg-[#2d4f47] rounded-xl p-6 border border-teal-500/20">
              <h2 className="text-xl font-bold text-white mb-6">Product Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2">Product Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    className="w-full bg-[#1a332e] text-white px-4 py-2.5 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Category*</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-[#1a332e] text-white px-4 py-2.5 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Price, discount and unit on same row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label className="block text-gray-300 mb-2">Price (₹)*</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full bg-[#1a332e] text-white pl-8 pr-4 py-2.5 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Discount (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      max="100"
                      className="w-full bg-[#1a332e] text-white px-4 py-2.5 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                  {formData.discount > 0 && formData.price && (
                    <p className="text-xs text-teal-400 mt-1">
                      Final price: ₹{(formData.price * (1 - formData.discount/100)).toFixed(2)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Unit*</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full bg-[#1a332e] text-white px-4 py-2.5 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500"
                    required
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>
                        {unit === 'kg' ? 'Kilogram (kg)' : 
                         unit === 'g' ? 'Gram (g)' : 
                         unit === 'lb' ? 'Pound (lb)' : 
                         unit === 'ml' ? 'Milliliter (ml)' : 
                         unit.charAt(0).toUpperCase() + unit.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity field */}
              <div className="mt-6">
                <label className="block text-gray-300 mb-2">Available Quantity*</label>
                <input
                  type="number"
                  name="available_quantity"
                  value={formData.available_quantity}
                  onChange={handleInputChange}
                  placeholder="Enter available quantity"
                  min="0"
                  className="w-full bg-[#1a332e] text-white px-4 py-2.5 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter the total quantity available for sale, in the selected unit.
                </p>
              </div>
            </div>

            {/* Product Description Section */}
            <div className="bg-[#2d4f47] rounded-xl p-6 border border-teal-500/20">
              <h2 className="text-xl font-bold text-white mb-6">Product Description*</h2>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your product..."
                rows="4"
                className="w-full bg-[#1a332e] text-white px-4 py-2.5 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            
            {/* Traceability Section */}
            <div className="bg-[#2d4f47] rounded-xl p-6 border border-teal-500/20">
              <h2 className="text-xl font-bold text-white mb-6">Product Traceability</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2">Harvest Method</label>
                  <select
                    name="traceability.harvest_method"
                    value={formData.traceability.harvest_method}
                    onChange={handleInputChange}
                    className="w-full bg-[#1a332e] text-white px-4 py-2.5 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500"
                  >
                    {harvestMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Harvest Date</label>
                  <input
                    type="date"
                    name="traceability.harvest_date"
                    value={formData.traceability.harvest_date}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-[#1a332e] text-white px-4 py-2.5 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Product Image Section */}
            <div className="bg-[#2d4f47] rounded-xl p-6 border border-teal-500/20">
              <h2 className="text-xl font-bold text-white mb-6">Product Image</h2>
              <div className="border-2 border-dashed border-teal-500/20 rounded-xl p-8">
                <div className="text-center">
                  {imagePreview ? (
                    <div className="mb-4">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="mx-auto max-h-64 rounded-lg"
                        onError={(e) => {
                          console.log('Image failed to load:', e.target.src);
                          e.target.onerror = null; 
                          e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                        }}
                      />
                    </div>
                  ) : (
                    <Upload className="w-12 h-12 text-teal-400 mx-auto mb-4" />
                  )}
                  <p className="text-white mb-2">Update product image</p>
                  <p className="text-gray-400 text-sm mb-4">Drag and drop or click to upload (max 5MB)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block bg-teal-500/20 text-teal-400 px-4 py-2 rounded-lg cursor-pointer hover:bg-teal-500/30 transition-colors"
                  >
                    Select New Image
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link
                to="/farmer/products"
                className="px-6 py-2.5 rounded-lg bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-colors"
              >
                Cancel
              </Link>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="bg-teal-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-teal-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Product'
                )}
              </motion.button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}

export default EditProduct;