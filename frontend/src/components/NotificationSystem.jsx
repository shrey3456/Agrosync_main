import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiCheck, FiTruck, FiPackage, FiShoppingBag, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';

const NotificationSystem = ({ role }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const fetchNotifications = async (forceRefresh = false) => {
    try {
      const token = localStorage.getItem('token');

      
      
      // Remove the If-Modified-Since header for now to simplify the implementation
      const response = await axios.get(
        `${API_URL}/api/notifications/${role}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.notifications.filter(n => !n.read).length);
        setLastFetchTime(Date.now());
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't update lastFetchTime on error to allow retry
    }
  };

  // Initial fetch on mount and role change
  useEffect(() => {
    fetchNotifications(true);
  }, [role]);

  // Add event listener for page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const getNotificationContent = (notification) => {
    switch (role) {
      case 'consumer':
        return {
          icon: getConsumerIcon(notification.type),
          message: notification.message
        };
      case 'farmer':
        return {
          icon: getFarmerIcon(notification.type),
          message: notification.message
        };
      default:
        return {
          icon: <FiAlertCircle className="w-4 h-4 text-gray-400" />,
          message: notification.message
        };
    }
  };

  const getConsumerIcon = (type) => {
    switch (type) {
      case 'order_processing':
        return <FiPackage className="w-4 h-4 text-yellow-400" />;
      case 'order_shipped':
        return <FiTruck className="w-4 h-4 text-blue-400" />;
      case 'order_delivered':
        return <FiCheck className="w-4 h-4 text-green-400" />;
      default:
        return <FiAlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFarmerIcon = (type) => {
    switch (type) {
      case 'new_order':
        return <FiShoppingBag className="w-4 h-4 text-teal-400" />;
      case 'order_cancelled':
        return <FiAlertCircle className="w-4 h-4 text-red-400" />;
      case 'order_completed':
        return <FiCheck className="w-4 h-4 text-green-400" />;
      default:
        return <FiAlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      
      
      await axios.post(
        `${API_URL}/api/notifications/mark-read`,
        { role },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Delete all notifications locally
      setNotifications([]);
      setUnreadCount(0);
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-300 hover:text-teal-400 hover:bg-teal-500/20"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50"
            >
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">
                    {role.charAt(0).toUpperCase() + role.slice(1)} Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-teal-400 hover:text-teal-300"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(notification => {
                    const { icon, message } = getNotificationContent(notification);
                    return (
                      <div
                        key={notification._id}
                        className={`p-4 border-b border-gray-700 last:border-0 ${
                          !notification.read ? 'bg-gray-800/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gray-800 rounded-full">
                            {icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-200">{message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;