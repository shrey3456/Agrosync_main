import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  ShoppingCart,
  Users,
  ArrowLeft,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Add improved debugging to the formatDate function
const formatDate = (dateString) => {
  console.log("Formatting date:", dateString, typeof dateString);

  if (!dateString) {
    console.log("Date string is empty/null/undefined");
    return "Not specified";
  }

  try {
    // Try to parse the date string
    const date = new Date(dateString);
    console.log("Parsed date object:", date, "isValid:", !isNaN(date.getTime()));

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.log("Invalid date detected:", dateString);
      return "Invalid date";
    }

    // Format the date using Intl for better localization
    const formatted = new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);

    console.log("Formatted date result:", formatted);
    return formatted;
  } catch (error) {
    console.error("Error formatting date:", error, dateString);
    return "Date format error";
  }
};

function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userData, setUserData] = useState(null);

  // State variables for product-farmer functionality
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);

  // Cart state variables
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);
  const [processingFarmerId, setProcessingFarmerId] = useState(null); // Track which farmer's add button is loading

  // Add error clearing function
  const clearError = () => {
    setError(null);
    setCartMessage(null);
  };

  // New: Handle Price Prediction button click
  const handlePricePrediction = async (product, e) => {
    if (e) e.stopPropagation();
    try {
      // Navigate to PricePredictionTester page with product name as state
      navigate('/consumer/price-prediction', {
        state: { productName: product.name }
      });
    } catch (err) {
      console.error('Error in price prediction:', err);
      setCartMessage({
        type: 'info',
        text: 'Unable to access price prediction at this time'
      });
    }
  };

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUserData(JSON.parse(storedUser));
  }, [navigate]);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/products/consumer/allproducts"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();

      // Create a map to group products by name
      const productMap = new Map();
      data.products.forEach((product) => {
        if (!productMap.has(product.name)) {
          productMap.set(product.name, {
            ...product,
            count: 1,
          });
        } else {
          productMap.get(product.name).count += 1;
        }
      });

      // Convert map to array of unique products
      const uniqueProducts = Array.from(productMap.values());
      setProducts(uniqueProducts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Fetch farmers for a specific product
  const fetchFarmersForProduct = async (productName) => {
    try {
      setLoadingFarmers(true);
      clearError(); // Clear any existing errors

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Please log in to continue");
      }

      const user = JSON.parse(localStorage.getItem("user"));
      const pincode = user.pincode || (user.address && user.address.pincode);

      if (!pincode) {
        setCartMessage({
          type: "info", // Changed from error to info
          text: "Please update your profile with a pincode to find nearby farmers",
        });
        return; // Return early instead of throwing error
      }

      const response = await fetch(
        `http://localhost:5000/api/products/farmers/${encodeURIComponent(productName)}?pincode=${pincode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch farmers");
      }

      setSelectedProduct(data.product || { name: productName });
      setFarmers(data.farmers || []);

      if (data.farmers?.length === 0) {
        setCartMessage({
          type: "info",
          text: "No farmers found offering this product in your area",
        });
      }
    } catch (error) {
      setCartMessage({
        type: "info", // Changed from error to info for better UX
        text: error.message || "Unable to fetch farmers at this time",
      });
    } finally {
      setLoadingFarmers(false);
    }
  };

  // Handle product click
  const handleProductClick = (product) => {
    fetchFarmersForProduct(product.name);
  };

  // Handle back button click
  const handleBackToProducts = () => {
    setSelectedProduct(null);
    setFarmers([]);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Enhanced Add to Cart function
  const handleAddToCartFromFarmer = async (farmer, e) => {
    if (e) e.stopPropagation();

    try {
      setProcessingFarmerId(farmer.farmer_id);
      setIsAddingToCart(true);
      clearError(); // Clear any existing errors

      // Get existing cart items from localStorage
      const existingCart = localStorage.getItem("cart");
      const cartItems = existingCart ? JSON.parse(existingCart) : [];

      // Create cart product object
      const cartProduct = {
        _id: farmer.product_id,
        name: selectedProduct.name,
        description: selectedProduct.description,
        category: selectedProduct.category,
        image_url: selectedProduct.image_url,
        price: farmer.price,
        available_quantity: farmer.available_quantity,

        // Enhanced farmer details
        farmer_id: farmer.farmer_id,
        farmer_mobile: farmer.farmer_mobile,
        farmer_location: farmer.farmer_location,
        farmer_details: {
          location: farmer.farmer_location,
          contact: farmer.farmer_mobile,
          rating: farmer.rating || 4.5,
        },

        // Add traceability information if available
        traceability: farmer.traceability || {
          farm_location: farmer.farmer_location,
          harvest_date: farmer.harvest_date || new Date().toISOString(),
          harvest_method: farmer.harvest_method || "Traditional",
          certified_by: farmer.certified_by || "AgroSync",
        },

        // Set initial quantity
        quantity: 1,

        // Add timestamp for order tracking
        added_at: new Date().toISOString(),
      };

      // Check if product from this specific farmer already exists in cart
      const existingItemIndex = cartItems.findIndex(
        (item) =>
          item._id === farmer.product_id && item.farmer_id === farmer.farmer_id
      );

      let updatedCart;

      if (existingItemIndex > -1) {
        // If product exists, update quantity
        updatedCart = cartItems.map((item) => {
          if (
            item._id === farmer.product_id &&
            item.farmer_id === farmer.farmer_id
          ) {
            const newQuantity = item.quantity + 1;
            if (newQuantity > farmer.available_quantity) {
              // Handle quantity limit
              setCartMessage({
                type: "info", // Changed from error to info
                text: `Only ${farmer.available_quantity} units available from this farmer`,
              });
              return item;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
      } else {
        // If product doesn't exist, add it with quantity 1
        updatedCart = [...cartItems, cartProduct];
      }

      // Save to localStorage
      localStorage.setItem("cart", JSON.stringify(updatedCart));

      // Show success message
      setCartMessage({
        type: "success",
        text: `${selectedProduct.name} added to cart successfully!`,
      });

      // Reduced timeout for better UX
      setTimeout(() => {
        navigate("/consumer/cart");
      }, 1000);
    } catch (error) {
      setCartMessage({
        type: "info", // Changed from error to info
        text: "Unable to add to cart. Please try again.",
      });
    } finally {
      setIsAddingToCart(false);
      setProcessingFarmerId(null);
    }
  };

  // Quick add to cart for product list view
  const handleQuickAddToCart = async (product, e) => {
    e.stopPropagation(); // Prevent navigation to product detail
    handleProductClick(product); // Instead, fetch and show farmers
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
        <div className="pt-6 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !cartMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
        <div className="pt-6 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center text-red-500">
              <p>Error: {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display farmers for selected product
  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
        {/* Toast Notification */}
        <AnimatePresence>
          {cartMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 ${cartMessage.type === "success"
                  ? "bg-green-600/90 backdrop-blur-sm"
                  : cartMessage.type === "info"
                    ? "bg-blue-600/90 backdrop-blur-sm"
                    : "bg-yellow-600/90 backdrop-blur-sm"
                }`}
            >
              {cartMessage.type === "success" ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <AlertCircle className="w-5 h-5 text-white" />
              )}
              <span className="text-white">{cartMessage.text}</span>
              <button
                onClick={() => setCartMessage(null)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="pt-6 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleBackToProducts}
              className="mb-8 flex items-center space-x-2 text-teal-400 hover:text-teal-300"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Products</span>
            </motion.button>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="flex flex-col md:flex-row gap-8">
                {/* Product Image */}
                <div className="md:w-1/3">
                  {selectedProduct.image_url && (
                    <img
                      src={`http://localhost:5000${selectedProduct.image_url}`}
                      alt={selectedProduct.name}
                      className="w-full h-auto rounded-xl"
                    />
                  )}
                </div>

                {/* Product Info */}
                <div className="md:w-2/3">
                  <h1 className="font-serif text-3xl font-bold text-green-900 dark:text-teal-50 mb-3">
                    {selectedProduct.name}
                  </h1>
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 dark:bg-teal-900/30 dark:text-teal-300 mb-4 inline-block">
                    {selectedProduct.category}
                  </span>
                  <p className="text-gray-600 dark:text-gray-300 mt-4">
                    {selectedProduct.description}
                  </p>
                  <div className="mt-6 flex items-center space-x-2">
                    <Users className="w-5 h-5 text-teal-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {farmers.length}{" "}
                      {farmers.length === 1 ? "Farmer" : "Farmers"} selling this
                      product
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Farmers Section */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-green-900 dark:text-teal-50 mb-6">
                Choose a Farmer
              </h2>

              {loadingFarmers ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {farmers.map((farmer, index) => {
                    // Debug log for traceability
                    console.log(`Farmer ${index} traceability:`, farmer.traceability,
                      farmer.traceability ? typeof farmer.traceability.harvest_date : 'no traceability');

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 backdrop-blur-sm rounded-xl border border-green-200/20 dark:border-teal-800/20 overflow-hidden p-6"
                      >
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Farmer Details */}
                          <div className="md:w-1/2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-teal-50 mb-3">
                              Farmer from{" "}
                              <span className="text-green-600 dark:text-teal-400">
                                {typeof farmer.farmer_location === "object"
                                  ? `${farmer.farmer_location.city || ""}, ${farmer.farmer_location.state || ""
                                  }`
                                  : farmer.farmer_location || ""}
                              </span>
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-3">
                              Contact: {farmer.farmer_mobile}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">
                              <span className="text-lg font-semibold text-green-600 dark:text-teal-400">
                                ₹{farmer.price}/unit
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Available: {farmer.available_quantity} units
                              </span>
                            </div>
                          </div>

                          {/* Traceability Info */}
                          <div className="md:w-1/2 bg-white/5 p-4 rounded-lg">
                            <h4 className="text-lg font-semibold text-green-600 dark:text-teal-400 mb-3">
                              Traceability Information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-600 dark:text-gray-300 flex justify-between">
                                <span>Harvest Date:</span>
                                <span>
                                  {(() => {
                                    // Self-executing function for better debugging and handling
                                    console.log("Rendering traceability for farmer:", farmer.farmer_id);

                                    if (!farmer.traceability) {
                                      console.log("No traceability data available");
                                      return "Not specified";
                                    }

                                    console.log("Harvest date from data:", farmer.traceability.harvest_date);

                                    if (!farmer.traceability.harvest_date) {
                                      return "Not specified";
                                    }

                                    return formatDate(farmer.traceability.harvest_date);
                                  })()}
                                </span>
                              </p>
                              <p className="text-gray-600 dark:text-gray-300 flex justify-between">
                                <span>Harvest Method:</span>
                                <span>
                                  {farmer.traceability && farmer.traceability.harvest_method
                                    ? farmer.traceability.harvest_method
                                    : "Not specified"}
                                </span>
                              </p>
                              <p className="text-gray-600 dark:text-gray-300 flex justify-between">
                                <span>Certified By:</span>
                                <span>
                                  {farmer.traceability && farmer.traceability.certified_by
                                    ? farmer.traceability.certified_by
                                    : "Not specified"}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-4 flex justify-end space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddToCartFromFarmer(farmer)}
                            disabled={
                              isAddingToCart &&
                              processingFarmerId === farmer.farmer_id
                            }
                            className={`bg-green-600 dark:bg-teal-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 dark:hover:bg-teal-600 transition-colors ${isAddingToCart &&
                                processingFarmerId === farmer.farmer_id
                                ? "opacity-70 cursor-wait"
                                : ""
                              }`}
                          >
                            {isAddingToCart &&
                              processingFarmerId === farmer.farmer_id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span>Adding...</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-5 h-5" />
                                <span>Add to Cart</span>
                              </>
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); handlePricePrediction(selectedProduct, e); }}
                            className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                          >
                            Price Prediction
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Product listing view
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
      {/* Toast Notification */}
      <AnimatePresence>
        {cartMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 ${cartMessage.type === "success"
                ? "bg-green-600/90 backdrop-blur-sm"
                : cartMessage.type === "info"
                  ? "bg-blue-600/90 backdrop-blur-sm"
                  : "bg-yellow-600/90 backdrop-blur-sm"
              }`}
          >
            {cartMessage.type === "success" ? (
              <Check className="w-5 h-5 text-white" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white" />
            )}
            <span className="text-white">{cartMessage.text}</span>
            <button
              onClick={() => setCartMessage(null)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="pt-6 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block p-3 rounded-full bg-teal-500/10 mb-6"
            >
              <Package className="w-8 h-8 text-green-600 dark:text-teal-400" />
            </motion.div>
            <h1 className="font-serif text-4xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-4">
              Available Products
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Browse and shop from our collection of fresh farm products
            </p>
          </motion.div>

          {/* Search Bar */}
          <div className="flex justify-center mb-8">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-green-200/20 dark:border-teal-800/20 text-gray-900 dark:text-teal-50 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 dark:text-gray-300">
                  No products found
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-green-200/20 dark:border-teal-800/20 overflow-hidden cursor-pointer relative group"
                  onClick={() => handleProductClick(product)}
                >
                  {/* Quick Buy Button - Shows on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleQuickAddToCart(product, e)}
                      className="bg-teal-500 text-white px-6 py-3 rounded-lg font-medium shadow-lg flex items-center space-x-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>View Options</span>
                    </motion.button>
                  </div>

                  <div className="relative">
                    {product.image_url && (
                      <img
                        src={`http://localhost:5000${product.image_url}`}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    {product.count > 1 && (
                      <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full z-20">
                        {product.count} farmers
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-teal-50 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      {product.description && product.description.length > 100
                        ? `${product.description.substring(0, 100)}...`
                        : product.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 dark:bg-teal-900/30 dark:text-teal-300">
                        {product.category}
                      </span>
                      <span className="text-lg font-semibold text-green-600 dark:text-teal-400">
                        ₹{product.price}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-teal-400">
                        {product.count > 1
                          ? "Multiple farmers"
                          : "View details"}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the parent onClick
                          handleProductClick(product);
                        }}
                        className="bg-green-600 dark:bg-teal-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 dark:hover:bg-teal-600 transition-colors"
                      >
                        View Farmers
                      </motion.button>
                    </div>
                    {/* New Price Prediction Button */}
                    <div className="flex justify-end mt-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePricePrediction(product, e);
                        }}
                        className="bg-blue-600 dark:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                      >
                        Price Prediction
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default ProductList;
