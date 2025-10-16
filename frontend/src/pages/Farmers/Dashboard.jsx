import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Navbar from "../../components/Navbar";
import NotificationSystem from "../../components/NotificationSystem";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  FileText,
  Shield,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  X,
  ExternalLink,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Get API base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function FarmerDashboard() {
  // State for pincode check modal
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  // Check pincode on mount
  useEffect(() => {
    const checkPincode = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.data.success) {
          const user = response.data.user;
          if (!user.pincode || user.pincode === '' || user.pincode === null) {
            setShowPincodeModal(true);
          }
        }
      } catch (err) {
        // fallback: do nothing
      }
    };
    checkPincode();
  }, []);
  // State for farmer stats from backend
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    verificationStatus: 'not_uploaded'
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  const navigate = useNavigate();

  // Fetch farmer statistics from backend
  const fetchFarmerStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        navigate('/login');
        return;
      }

      console.log('🔍 Fetching farmer stats...');
      
      // FIX: Change from farmer1 to farmer
      const response = await axios.get(`${API_BASE_URL}/api/farmer/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Farmer stats response:', response.data);

      if (response.data.success) {
        const statsData = response.data.stats;
        setStats(statsData);
        
        // Show verification alert if not verified/complete
        if (statsData.verificationStatus === 'not_uploaded' || 
            statsData.verificationStatus === 'pending' || 
            statsData.verificationStatus === 'rejected') {
          setShowVerificationAlert(true);
        }
      } else {
        setError('Failed to fetch statistics');
      }
    } catch (error) {
      console.error('❌ Error fetching farmer stats:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('🚪 Redirecting to login due to auth error');
        navigate('/login');
      } else {
        setError(error.response?.data?.message || 'Failed to fetch statistics');
      }
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch recent pending orders from backend (only if verified)
  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Only fetch orders if user is verified
      if (!isVerified()) {
        setRecentOrders([]);
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching recent pending orders...');

      const response = await axios.get(`${API_BASE_URL}/api/farmer/orders/pending?limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Recent orders response:', response.data);

      if (response.data.success) {
        setRecentOrders(response.data.orders);
      }
    } catch (error) {
      console.error('❌ Error fetching recent orders:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('🚪 Auth error for orders, but not redirecting');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      console.log('No authentication found, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (userData.role !== 'farmer') {
        console.log('User is not a farmer, redirecting');
        navigate('/login');
        return;
      }
    } catch (parseError) {
      console.error('Error parsing user data:', parseError);
      navigate('/login');
      return;
    }

    // Fetch stats first, then orders based on verification status
    fetchFarmerStats();
  }, [navigate]);

  // Fetch orders when verification status changes
  useEffect(() => {
    if (!statsLoading) {
      fetchRecentOrders();
    }
  }, [stats.verificationStatus, statsLoading]);

  // Get verification status display based on backend response
  const getVerificationStatusDisplay = (status) => {
    switch (status) {
      case 'verified':
      case 'complete':
      case 'certified':
        return { 
          text: 'Verified', 
          color: 'text-green-400', 
          icon: CheckCircle,
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20'
        };
      case 'pending':
      case 'partial':
        return { 
          text: 'Pending Review', 
          color: 'text-yellow-400', 
          icon: Clock,
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20'
        };
      case 'rejected':
        return { 
          text: 'Rejected', 
          color: 'text-red-400', 
          icon: AlertTriangle,
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20'
        };
      case 'not_uploaded':
      default:
        return { 
          text: 'Not Uploaded', 
          color: 'text-gray-400', 
          icon: FileText,
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20'
        };
    }
  };

  // Check if farmer is verified
  const isVerified = () => {
    return stats.verificationStatus === 'verified' || 
           stats.verificationStatus === 'complete' || 
           stats.verificationStatus === 'certified';
  };

  // Check if farmer needs to upload documents
  const needsDocumentUpload = () => {
    return stats.verificationStatus === 'not_uploaded';
  };

  // Handle locked action clicks
  const handleLockedAction = (actionName) => {
    setShowVerificationAlert(true);
    console.log(`🔒 Access denied to ${actionName} - verification required`);
  };

  const verificationStatus = getVerificationStatusDisplay(stats.verificationStatus);
  const VerificationIcon = verificationStatus.icon;

  // Navigate to certificate route (only if verified)
  const navigateToCertificate = async () => {
    if (!isVerified()) {
      handleLockedAction('Certificate');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Get farmer's profile to find certificate ID
      const response = await axios.get(`${API_BASE_URL}/api/farmer/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.farmer.certificateId) {
        // Navigate with certificate ID
        navigate(`/farmer/certificate/${response.data.farmer.certificateId}`);
      } else {
        // No certificate available
        navigate('/farmer/documents');
      }
    } catch (error) {
      console.error('Error getting certificate ID:', error);
      navigate('/farmer/documents');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] pb-20">
      {/* Pincode Required Modal */}
      {showPincodeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a332e] rounded-xl p-8 border border-yellow-500/20 max-w-lg w-full shadow-2xl"
          >
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 text-yellow-400 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                🚫 Action Restricted
              </h3>
              <p className="text-gray-300 mb-6 text-lg">
                You must enter your pincode in your profile before accessing dashboard features.
              </p>
              <div className="space-y-4 mb-8 text-left">
                <div className="p-4 bg-gray-500/10 rounded-lg border border-gray-500/20">
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Current Status:</strong> <span className="text-yellow-400">Pincode Required</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Please update your pincode in your profile to continue.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowPincodeModal(false);
                    navigate('/farmer/profile');
                  }}
                  className="flex-1 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-semibold"
                >
                  Go to Profile
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
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
              {isVerified() 
                ? "Welcome back! Here's an overview of your farm's performance."
                : "Complete verification to unlock your farming dashboard features."
              }
            </p>
            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 max-w-md mx-auto">
                {error}
              </div>
            )}
          </motion.div>

          {/* Verification Status Alert Banner - Show if not verified */}
          {!isVerified() && !statsLoading && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-8 p-6 rounded-xl border ${verificationStatus.bgColor} ${verificationStatus.borderColor} shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <Lock className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      🚨 Account Locked - Verification Required
                    </h3>
                    <p className="text-sm text-gray-300 mb-2">
                      {needsDocumentUpload() 
                        ? 'Upload your identity documents to unlock all farming features.' 
                        : stats.verificationStatus === 'pending' 
                          ? 'Your documents are under review. All features will unlock once verified.'
                          : 'Re-upload your documents to regain access to farming features.'
                      }
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>Status: </span>
                      <span className={verificationStatus.color}>{verificationStatus.text}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/farmer/documents")}
                  className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold"
                >
                  <FileText className="w-5 h-5" />
                  {needsDocumentUpload() ? 'Upload Documents' : 'View Status'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Success Banner for Verified Users */}
          {isVerified() && !statsLoading && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-xl border bg-green-500/10 border-green-500/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <h3 className="font-semibold text-white">
                      ✅ Verification Complete!
                    </h3>
                    <p className="text-sm text-gray-300">
                      Your identity has been verified. You can now sell products and receive orders.
                    </p>
                  </div>
                </div>
                <button
                  onClick={navigateToCertificate}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  View Certificate
                </button>
              </div>
            </motion.div>
          )}

          {/* Quick Actions Row - LOCKED/UNLOCKED based on verification */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-teal-50 mb-6">
              {isVerified() ? 'Quick Actions' : 'Locked Features (Verification Required)'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              
              {/* Manage Products - LOCKED if not verified */}
              <motion.div
                whileHover={isVerified() ? { scale: 1.02 } : {}}
                whileTap={isVerified() ? { scale: 0.98 } : {}}
                onClick={() => {
                  if (!isVerified()) {
                    handleLockedAction('Products');
                  } else {
                    navigate("/farmer/products");
                  }
                }}
                className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 text-left cursor-pointer group relative ${
                  !isVerified() 
                    ? 'opacity-40 border-red-500/20 hover:border-red-500/30' 
                    : 'border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30'
                }`}
              >
                {!isVerified() && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-5 h-5 text-red-400" />
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <div className={`p-3 rounded-full mb-3 transition-colors ${
                    !isVerified() 
                      ? 'bg-gray-500/20' 
                      : 'bg-teal-500/20 group-hover:bg-teal-500/30'
                  }`}>
                    <Package className={`w-6 h-6 ${!isVerified() ? 'text-gray-500' : 'text-teal-400'}`} />
                  </div>
                  <span className={`text-lg font-semibold mb-1 ${!isVerified() ? 'text-gray-500' : 'text-white'}`}>
                    Manage Products
                  </span>
                </div>
              </motion.div>

              {/* View Orders - LOCKED if not verified */}
              <motion.div
                whileHover={isVerified() ? { scale: 1.02 } : {}}
                whileTap={isVerified() ? { scale: 0.98 } : {}}
                onClick={() => {
                  if (!isVerified()) {
                    handleLockedAction('Orders');
                  } else {
                    navigate("/farmer/orders");
                  }
                }}
                className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 text-left cursor-pointer group relative ${
                  !isVerified() 
                    ? 'opacity-40 border-red-500/20 hover:border-red-500/30' 
                    : 'border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30'
                }`}
              >
                {!isVerified() && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-5 h-5 text-red-400" />
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <div className={`p-3 rounded-full mb-3 transition-colors ${
                    !isVerified() 
                      ? 'bg-gray-500/20' 
                      : 'bg-blue-500/20 group-hover:bg-blue-500/30'
                  }`}>
                    <ShoppingCart className={`w-6 h-6 ${!isVerified() ? 'text-gray-500' : 'text-blue-400'}`} />
                  </div>
                  <span className={`text-lg font-semibold mb-1 ${!isVerified() ? 'text-gray-500' : 'text-white'}`}>
                    View Orders
                  </span>
                </div>
              </motion.div>

              {/* Upload Documents - ALWAYS ACCESSIBLE */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/farmer/documents")}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors text-left cursor-pointer group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-orange-500/20 rounded-full mb-3 group-hover:bg-orange-500/30 transition-colors">
                    <FileText className="w-6 h-6 text-orange-400" />
                  </div>
                  <span className="text-lg font-semibold text-white mb-1">Upload Documents</span>
                  <span className={`text-sm ${verificationStatus.color}`}>
                    {statsLoading ? 'Loading...' : verificationStatus.text}
                  </span>
                </div>
              </motion.button>

              {/* Analytics - LOCKED if not verified */}
              <motion.div
                whileHover={isVerified() ? { scale: 1.02 } : {}}
                whileTap={isVerified() ? { scale: 0.98 } : {}}
                onClick={() => {
                  if (!isVerified()) {
                    handleLockedAction('Analytics');
                  } else {
                    navigate("/farmer/analytics");
                  }
                }}
                className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 text-left cursor-pointer group relative ${
                  !isVerified() 
                    ? 'opacity-40 border-red-500/20 hover:border-red-500/30' 
                    : 'border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30'
                }`}
              >
                {!isVerified() && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-5 h-5 text-red-400" />
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <div className={`p-3 rounded-full mb-3 transition-colors ${
                    !isVerified() 
                      ? 'bg-gray-500/20' 
                      : 'bg-purple-500/20 group-hover:bg-purple-500/30'
                  }`}>
                    <TrendingUp className={`w-6 h-6 ${!isVerified() ? 'text-gray-500' : 'text-purple-400'}`} />
                  </div>
                  <span className={`text-lg font-semibold mb-1 ${!isVerified() ? 'text-gray-500' : 'text-white'}`}>
                    Analytics
                  </span>
                
                </div>
              </motion.div>

              {/* My Certificate - LOCKED if not verified */}
              <motion.div
                whileHover={isVerified() ? { scale: 1.02 } : {}}
                whileTap={isVerified() ? { scale: 0.98 } : {}}
                onClick={navigateToCertificate}
                className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 text-left cursor-pointer group relative ${
                  !isVerified() 
                    ? 'opacity-40 border-red-500/20 hover:border-red-500/30' 
                    : 'border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30'
                }`}
              >
                {!isVerified() && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-5 h-5 text-red-400" />
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <div className={`p-3 rounded-full mb-3 transition-colors ${
                    !isVerified() 
                      ? 'bg-gray-500/20' 
                      : 'bg-green-500/20 group-hover:bg-green-500/30'
                  }`}>
                    <Shield className={`w-6 h-6 ${!isVerified() ? 'text-gray-500' : 'text-green-400'}`} />
                  </div>
                  <span className={`text-lg font-semibold mb-1 ${!isVerified() ? 'text-gray-500' : 'text-white'}`}>
                    My Certificate
                  </span>
                  <span className="text-sm text-gray-400">
                    {!isVerified() ? '🔒 Locked' : 'Blockchain verified'}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Stats Row - Show ZERO or locked values if not verified */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`backdrop-blur-sm rounded-xl p-6 border ${
                !isVerified() ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-green-200/20 dark:border-teal-800/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Package className={`w-5 h-5 ${!isVerified() ? 'text-gray-500' : 'text-green-600 dark:text-teal-400'}`} />
                <span className="text-gray-600 dark:text-gray-300">Total Products</span>
                {!isVerified() && <Lock className="w-4 h-4 text-red-400" />}
              </div>
              <p className={`text-2xl font-bold ${!isVerified() ? 'text-gray-500' : 'text-green-900 dark:text-teal-50'}`}>
                {statsLoading ? (
                  <div className="w-8 h-8 border-t-2 border-teal-500 rounded-full animate-spin"></div>
                ) : !isVerified() ? (
                  '🔒'
                ) : (
                  stats.totalProducts
                )}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`backdrop-blur-sm rounded-xl p-6 border ${
                !isVerified() ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-green-200/20 dark:border-teal-800/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCart className={`w-5 h-5 ${!isVerified() ? 'text-gray-500' : 'text-blue-600 dark:text-blue-400'}`} />
                <span className="text-gray-600 dark:text-gray-300">Pending Orders</span>
                {!isVerified() && <Lock className="w-4 h-4 text-red-400" />}
              </div>
              <p className={`text-2xl font-bold ${!isVerified() ? 'text-gray-500' : 'text-green-900 dark:text-teal-50'}`}>
                {statsLoading ? (
                  <div className="w-8 h-8 border-t-2 border-teal-500 rounded-full animate-spin"></div>
                ) : !isVerified() ? (
                  '🔒'
                ) : (
                  stats.pendingOrders
                )}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`backdrop-blur-sm rounded-xl p-6 border ${
                !isVerified() ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-green-200/20 dark:border-teal-800/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className={`w-5 h-5 ${!isVerified() ? 'text-gray-500' : 'text-green-600 dark:text-green-400'}`} />
                <span className="text-gray-600 dark:text-gray-300">Completed Orders</span>
                {!isVerified() && <Lock className="w-4 h-4 text-red-400" />}
              </div>
              <p className={`text-2xl font-bold ${!isVerified() ? 'text-gray-500' : 'text-green-900 dark:text-teal-50'}`}>
                {statsLoading ? (
                  <div className="w-8 h-8 border-t-2 border-teal-500 rounded-full animate-spin"></div>
                ) : !isVerified() ? (
                  '🔒'
                ) : (
                  stats.completedOrders
                )}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`backdrop-blur-sm rounded-xl p-6 border ${
                !isVerified() ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-green-200/20 dark:border-teal-800/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className={`w-5 h-5 ${!isVerified() ? 'text-gray-500' : 'text-purple-600 dark:text-purple-400'}`} />
                <span className="text-gray-600 dark:text-gray-300">Total Revenue</span>
                {!isVerified() && <Lock className="w-4 h-4 text-red-400" />}
              </div>
              <p className={`text-2xl font-bold ${!isVerified() ? 'text-gray-500' : 'text-green-900 dark:text-teal-50'}`}>
                {statsLoading ? (
                  <div className="w-8 h-8 border-t-2 border-teal-500 rounded-full animate-spin"></div>
                ) : !isVerified() ? (
                  '🔒'
                ) : (
                  `₹${stats.totalRevenue.toLocaleString()}`
                )}
              </p>
            </motion.div>
          </div>

          {/* Verification Status Card - Enhanced */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`backdrop-blur-sm rounded-xl p-6 border mb-8 ${verificationStatus.bgColor} ${verificationStatus.borderColor}`}
          > */}
            {/* <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <VerificationIcon className={`w-6 h-6 ${verificationStatus.color}`} />
                <div>
                  <h3 className="text-lg font-semibold text-white">Identity Verification Status</h3>
                  <p className={`text-sm ${verificationStatus.color}`}>
                    {statsLoading ? 'Loading...' : verificationStatus.text}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isVerified() 
                      ? '✅ All farming features are unlocked'
                      : '⚠️ Complete verification to unlock all features'
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/farmer/documents")}
                  className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 rounded-lg text-teal-400 transition-colors"
                >
                  {needsDocumentUpload() ? 'Upload Documents' : 'View Status'}
                </button>
                {isVerified() && (
                  <button
                    onClick={navigateToCertificate}
                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Certificate
                  </button>
                )}
              </div>
            </div> */}
          {/* </motion.div> */}

          {/* Recent Orders - COMPLETELY LOCKED if not verified */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20"
            >
              <h2 className="font-serif text-2xl font-bold tracking-tighter text-green-900 dark:text-teal-50 mb-6">
                Recent Pending Orders
              </h2>
              
              {!isVerified() ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Orders Section Locked</h3>
                  <p className="text-gray-400 mb-4">Complete identity verification to start receiving and managing orders</p>
                  <div className="bg-gray-500/10 rounded-lg p-4 mb-4 max-w-md mx-auto">
                    <p className="text-sm text-gray-300 mb-2">
                      <strong>Current Status:</strong> <span className={verificationStatus.color}>{verificationStatus.text}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {needsDocumentUpload() 
                        ? 'Upload Aadhaar and farming certificate to verify your identity'
                        : 'Check your document upload page for more details'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/farmer/documents")}
                    className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    Upload Documents to Unlock
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-t-2 border-teal-500 rounded-full animate-spin"></div>
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No pending orders found</p>
                    </div>
                  ) : (
                    recentOrders.map((order) => (
                      <div
                        key={order._id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-green-200/10 dark:border-teal-800/10"
                      >
                        <div>
                          <p className="font-medium text-green-900 dark:text-teal-50">
                            {order.items[0]?.productId?.name || 'Product'}
                            {order.items.length > 1 && ` +${order.items.length - 1} more`}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Customer: {order.consumerId?.name || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-900 dark:text-teal-50">
                            ₹{(order.farmerTotal || order.totalAmount || 0).toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'pending' 
                              ? 'bg-yellow-500/20 text-yellow-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {isVerified() && (
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
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enhanced Verification Alert Modal */}
      {showVerificationAlert && !isVerified() && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a332e] rounded-xl p-8 border border-red-500/20 max-w-lg w-full shadow-2xl"
          >
            <div className="text-center">
              <div className="mb-4">
                <Lock className="w-16 h-16 text-red-400 mx-auto mb-2" />
                <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                🚫 Access Restricted
              </h3>
              <p className="text-gray-300 mb-6 text-lg">
                {needsDocumentUpload() 
                  ? 'You must complete identity verification before accessing farming features. Upload your documents to get started.'
                  : stats.verificationStatus === 'pending' 
                    ? 'Your verification is in progress. All features will unlock once your documents are approved.'
                    : 'Your verification failed. Please re-upload your documents to regain access to all features.'
                }
              </p>
              
              <div className="space-y-4 mb-8 text-left">
                <div className="p-4 bg-gray-500/10 rounded-lg border border-gray-500/20">
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Current Status:</strong> <span className={verificationStatus.color}>{verificationStatus.text}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {needsDocumentUpload() 
                      ? 'Upload Aadhaar and farming certificate to verify your identity'
                      : 'Check your document upload page for more details'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowVerificationAlert(false)}
                  className="flex-1 px-6 py-3 border border-gray-500/30 rounded-lg text-gray-300 hover:bg-gray-500/10 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowVerificationAlert(false);
                    navigate("/farmer/documents");
                  }}
                  className="flex-1 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors font-semibold"
                >
                  {needsDocumentUpload() ? 'Upload Documents' : 'Check Status'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default FarmerDashboard;