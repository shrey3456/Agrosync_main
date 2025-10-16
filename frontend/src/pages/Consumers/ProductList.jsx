
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, ShoppingCart, Search, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/products/consumer/allproducts`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      // Group products by name to show unique products only
      const productMap = new Map();
      data.products.forEach((product) => {
        const productName = product.name.toLowerCase().trim();
        if (!productMap.has(productName)) {
          productMap.set(productName, {
            ...product,
            farmerCount: 1,
            minPrice: product.price,
            maxPrice: product.price
          });
        } else {
          const existing = productMap.get(productName);
          existing.farmerCount += 1;
          existing.minPrice = Math.min(existing.minPrice, product.price);
          existing.maxPrice = Math.max(existing.maxPrice, product.price);
          if (product.price < existing.price) {
            productMap.set(productName, {
              ...product,
              farmerCount: existing.farmerCount,
              minPrice: existing.minPrice,
              maxPrice: existing.maxPrice
            });
          }
        }
      });
      setProducts(Array.from(productMap.values()));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyProduct = (product) => {
    if (!product.name || product.name.trim() === '') return;
    const encodedProductName = encodeURIComponent(product.name.trim());
    navigate(`/consumer/product/${encodedProductName}/farmers`, {
      state: {
        productName: product.name,
        category: product.category,
        minPrice: product.minPrice,
        maxPrice: product.maxPrice,
        farmerCount: product.farmerCount
      }
    });
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] flex items-center justify-center">
        <div className="text-center text-red-500">
          <h2 className="text-2xl font-bold mb-4">Error Loading Products</h2>
          <p>{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] w-full">
      {/* Top Bar */}
      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 py-4 bg-transparent">
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/consumer')}
          className="flex items-center gap-2 text-gray-400 hover:text-green-400 font-medium text-base"
        >
          <Home className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/consumer/cart')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600/80 text-white rounded-lg shadow hover:bg-green-700"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>View Cart</span>
        </motion.button>
      </div>

      {/* Search and Title */}
      <div className="w-full flex flex-col items-center justify-center gap-4 px-2 md:px-0 mt-2 mb-4">
        <div className="w-full max-w-2xl relative">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3 bg-white/10 border border-green-700/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent shadow"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5" />
        </div>
        <div className="flex flex-col items-center mt-2">
          <div className="inline-block p-3 rounded-full bg-teal-500/10 mb-2">
            <Package className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-green-200 mb-2 tracking-tight">Fresh Products</h1>
          <p className="text-gray-200 text-lg max-w-2xl text-center">
            Discover fresh, locally sourced products directly from farmers near you
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="w-full px-2 md:px-8 pb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 text-lg">No products found</p>
            </div>
          ) : (
            filteredProducts.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.07 }}
                whileHover={{ scale: 1.03, boxShadow: "0 8px 32px 0 rgba(34,197,94,0.15)" }}
                className="bg-[#16231a]/80 rounded-2xl border border-green-700/30 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                {/* Product Image */}
                <div className="relative w-full h-48 bg-gray-900 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={`${API_BASE_URL}${product.image_url}`}
                      alt={product.name}
                      className="w-full h-48 object-cover object-center"
                      onError={(e) => {
                        e.target.src = "/placeholder-product.jpg";
                      }}
                    />
                  ) : (
                    <Package className="w-16 h-16 text-gray-500" />
                  )}
                  {product.farmerCount > 1 && (
                    <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                      {product.farmerCount} farmers
                    </div>
                  )}
                </div>
                {/* Product Details */}
                <div className="flex-1 flex flex-col p-5">
                  <h3 className="text-xl font-semibold text-green-200 mb-1 truncate">{product.name}</h3>
                  <p className="text-gray-300 text-sm mb-2 line-clamp-2 flex-1">{product.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-900/40 text-green-300">
                      {product.category}
                    </span>
                    <span className="text-xs text-gray-400">Available: {product.available_quantity} {product.unit}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-green-400">
                      {product.farmerCount > 1 && product.minPrice !== product.maxPrice
                        ? `₹${product.minPrice} - ₹${product.maxPrice}`
                        : `₹${product.price}`}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleBuyProduct(product)}
                    className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-auto"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{product.farmerCount > 1 ? `View ${product.farmerCount} Farmers` : 'Buy Now'}</span>
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
        {/* Products Count */}
        <div className="text-center mt-8">
          <p className="text-gray-400">Showing {filteredProducts.length} of {products.length} products</p>
        </div>
      </div>
    </div>
  );
}

export default ProductList;
