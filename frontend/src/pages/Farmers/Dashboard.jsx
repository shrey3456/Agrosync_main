import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Navbar from "../../components/Navbar";
import NotificationSystem from "../../components/NotificationSystem";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function FarmerDashboard() {
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/orders/recent', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setRecentOrders(response.data.orders);
        }
      } catch (error) {
        console.error('Error fetching recent orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] pb-20">
      <Navbar />
      <NotificationSystem role="farmer" />
      <div className="pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="font-serif text-4xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-4">
              Farmer Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Welcome back! Here's an overview of your farm's performance.
            </p>
          </motion.div>

          {/* Quick Actions Row */}
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/farmer/products")}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-5 h-5 text-green-600 dark:text-teal-400" />
                  <span className="text-gray-600 dark:text-gray-300">Manage Products</span>
                </div>
                <p className="text-green-900 dark:text-teal-50 font-medium">
                  View and manage your products
                </p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/farmer/orders")}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingCart className="w-5 h-5 text-green-600 dark:text-teal-400" />
                  <span className="text-gray-600 dark:text-gray-300">View Orders</span>
                </div>
                <p className="text-green-900 dark:text-teal-50 font-medium">
                  Manage orders
                </p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/farmer/analytics")}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-teal-400" />
                  <span className="text-gray-600 dark:text-gray-300">Analytics</span>
                </div>
                <p className="text-green-900 dark:text-teal-50 font-medium">
                  View insights
                </p>
              </motion.button>
            </div>
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
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-t-2 border-teal-500 rounded-full animate-spin"></div>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No recent orders found</p>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <div
                      key={order._id}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-green-200/10 dark:border-teal-800/10"
                    >
                      <div>
                        <p className="font-medium text-green-900 dark:text-teal-50">
                          {order.items[0].name}
                          {order.items.length > 1 && ` +${order.items.length - 1} more`}
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
                          <Clock className="w-4 h-4" />
                          <span className="text-gray-600 dark:text-gray-300">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate("/farmer/orders")}
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
        </div>
      </div>
    </div>
  );
}

export default FarmerDashboard;