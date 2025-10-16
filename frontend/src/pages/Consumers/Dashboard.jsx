import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar"; // Import the main Navbar
import NotificationSystem from "../../components/NotificationSystem";
import {
  FiUser,
  FiShoppingCart,
  FiHeart,
  FiDollarSign,
  FiHome,
  FiShoppingBag,
  FiBell,
  FiPackage,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiBox,
  FiBarChart2,
  FiArrowRight,
} from "react-icons/fi";

const ConsumerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Dynamic username fetching
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  // Set axios configuration
  useEffect(() => {
    axios.defaults.baseURL =  import.meta.env.VITE_API_URL ||  "http://localhost:5000";
    // Add auth token if available
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  // Fetch username when component mounts
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        setLoading(true);
        // Use correct endpoint path
        const response = await axios.get("/api/auth/me");
        console.log("Response:", response.data.user.email);
        if (response.data && response.data.user) {
          setUsername(
            response.data.user.name || response.data.user.email || "User"
          );

          // Ensure user role is set in localStorage for Navbar component
          const userData = {
            ...response.data.user,
            role: "consumer", // Ensure role is set for navbar display
          };
          localStorage.setItem("user", JSON.stringify(userData));
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching username:", err);
        // Fallback for development
        setUsername("Guest");
        setLoading(false);
      }
    };

    fetchUsername();
  }, []);

  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const response = await axios.get("/api/orders/recent");
        if (response.data.success) {
          setRecentOrders(response.data.orders);
        }
      } catch (error) {
        console.error("Error fetching recent orders:", error);
      }
    };

    fetchRecentOrders();
  }, []);
  // Dynamic cart initialization from localStorage
  const [cart, setCart] = useState(() => {
    try {
      // Try to get cart from localStorage
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      return [];
    }
  });

  // Calculate cart item count dynamically
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Save cart to localStorage for the main Navbar to access
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));

    // Store cart page path for the Navbar component
    localStorage.setItem("cartPath", "/consumer/cart");
  }, [cart]);

  // Fetch cart data from API (for real implementation)
  useEffect(() => {
    const fetchCartFromAPI = async () => {
      try {
        const response = await axios.get("/api/cart");
        if (response.data && response.data.items) {
          setCart(response.data.items);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    };

    fetchCartFromAPI();
  }, []);

  // Function to add item to cart
  const addToCart = (product) => {
    setCart((prevCart) => {
      // Check if product already exists in cart
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        // Increase quantity if product already in cart
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new product to cart with quantity 1
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Function to remove item from cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // Function to update item quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] pb-20">
      {/* Main Navbar */}
      <Navbar />

      {/* Notification System */}
      <NotificationSystem role="consumer" />

      {/* Main content - adjusted padding for single navbar */}
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          {location.pathname === "/consumer" ? (
            <>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
              >
                <h1 className="font-serif text-4xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-4">
                  Consumer Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Welcome back, {username}! Here's an overview of your purchases
                  and favorite products.
                </p>
              </motion.div>

              {/* Quick Actions Row */}
              <div className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/consumer/shop")}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FiShoppingBag className="w-5 h-5 text-green-600 dark:text-teal-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        Browse Marketplace
                      </span>
                    </div>
                    <p className="text-green-900 dark:text-teal-50 font-medium">
                      Discover fresh local produce
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/consumer/track-orders")} // Updated path
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FiPackage className="w-5 h-5 text-green-600 dark:text-teal-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        Track Orders
                      </span>
                    </div>
                    <p className="text-green-900 dark:text-teal-50 font-medium">
                      View and track your orders
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/consumer/cart")}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FiShoppingCart className="w-5 h-5 text-green-600 dark:text-teal-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        My Cart
                      </span>
                      {cartItemCount > 0 && (
                        <span className="bg-teal-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cartItemCount}
                        </span>
                      )}
                    </div>
                    <p className="text-green-900 dark:text-teal-50 font-medium">
                      View your cart and checkout
                    </p>
                  </motion.button>
                </div>
              </div>

              {/* Replace stats grid with analytics button */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/consumer/analytics")}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors text-left cursor-pointer col-span-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiBarChart2 className="w-5 h-5 text-green-600 dark:text-teal-400" />
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">
                          Analytics Dashboard
                        </span>
                        <p className="text-green-900 dark:text-teal-50 font-medium">
                          Track your orders and spending patterns
                        </p>
                      </div>
                    </div>
                    <FiArrowRight className="w-5 h-5 text-green-600 dark:text-teal-400" />
                  </div>
                </motion.button>
              </div>

              {/* Recent Orders */}
              <div className="mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20"
                >
                  <h2 className="font-serif text-2xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-6">
                    Recent Orders
                  </h2>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order._id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-green-200/10 dark:border-teal-800/10"
                      >
                        <div>
                          <p className="font-medium text-green-900 dark:text-teal-50">
                            {order.items[0].name}
                            {order.items.length > 1 &&
                              ` +${order.items.length - 1} more`}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Order #{order.orderNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-900 dark:text-teal-50">
                            ₹{order.totalAmount.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <FiClock className="w-4 h-4" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => navigate("/consumer/track-orders")}
                      className="inline-flex items-center px-4 py-2 border border-green-200/20 dark:border-teal-800/20 rounded-md text-sm font-medium text-green-900 dark:text-teal-50 hover:bg-white/10 transition-colors"
                    >
                      View All Orders
                      <svg
                        className="ml-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsumerDashboard;
