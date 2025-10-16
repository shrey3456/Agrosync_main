import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiShoppingBag, FiTruck, FiBarChart2, FiDollarSign, FiPackage, 
         FiActivity, FiCheckCircle, FiArrowRight, FiFileText, FiShield } from 'react-icons/fi';
import { FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar'; // Add this import

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalFarmers: 0,
        totalConsumers: 0,
        activeOrders: 0,
        completedOrders: 0,
        totalProducts: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkAdminAuth = () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user || user.role !== 'admin') {
            navigate('/login');
            return false;
        }
        return true;
    };

    useEffect(() => {
        checkAdminAuth();
    }, [navigate]);

    const fetchStats = async () => {
        try {
            console.log('🔍 Fetching admin stats...');
            
            const token = localStorage.getItem('token');
            console.log('Token exists:', !!token);
            
            if (!token) {
                console.error('No token found');
                setError('Authentication required. Please login again.');
                return;
            }

            const url = `${API_BASE_URL}/api/admin/stats`;
            console.log('Making request to:', url);
            console.log('With token:', token.substring(0, 20) + '...');

            const response = await axios.get(url, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Response received:', response.data);

            if (response.data.success) {
                setStats(response.data.stats);
                console.log('📊 Stats set:', response.data.stats);
            } else {
                console.error('❌ Response not successful:', response.data);
                setError('Failed to fetch statistics');
            }
            setLoading(false);
        } catch (error) {
            console.error('❌ Error fetching stats:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            setError(error.response?.data?.message || 'Failed to fetch statistics');
            setLoading(false);
            
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log('🚪 Redirecting to login due to auth error');
                navigate('/login');
            }
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const StatsCard = ({ title, value, icon, onClick }) => (
        <div 
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-300">{title}</h3>
                {icon}
            </div>
            <p className="text-3xl font-bold text-teal-50">{value}</p>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] flex items-center justify-center">
                <div className="text-red-400 text-xl">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 py-8 pt-20">
                <div className="flex flex-col items-center justify-center mb-12 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold text-teal-50 mb-2"
                    >
                        Admin Dashboard
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-1 w-24 bg-teal-800/50 rounded-full mb-4"
                    />
                    <p className="text-gray-300">Platform Performance Overview</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        title="Total Orders"
                        value={stats.totalOrders}
                        icon={<FiShoppingBag className="text-teal-500" size={24} />}
                    />
                    <StatsCard
                        title="Total Farmers"
                        value={stats.totalFarmers}
                        icon={<FaUsers className="text-teal-500" size={24} />}
                        onClick={() => navigate('/admin/farmers')}
                    />
                    <StatsCard
                        title="Total Consumers"
                        value={stats.totalConsumers}
                        icon={<FiUsers className="text-teal-500" size={24} />}
                    />
                    <StatsCard
                        title="Total Products"
                        value={stats.totalProducts}
                        icon={<FiPackage className="text-teal-500" size={24} />}
                    />
                </div>

                {/* Quick Actions Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-teal-50 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => navigate('/admin/orders')}
                            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors group"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="p-3 bg-teal-500/20 rounded-full mb-3 group-hover:bg-teal-500/30 transition-colors">
                                    <FiShoppingBag className="w-6 h-6 text-teal-400" />
                                </div>
                                <span className="text-lg font-semibold text-white mb-1">Manage Orders</span>
                                <span className="text-sm text-gray-400">View and process all orders</span>
                            </div>
                        </motion.button>

                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => navigate('/admin/document-verification')}
                            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors group"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="p-3 bg-blue-500/20 rounded-full mb-3 group-hover:bg-blue-500/30 transition-colors">
                                    <FiFileText className="w-6 h-6 text-blue-400" />
                                </div>
                                <span className="text-lg font-semibold text-white mb-1">Document Verification</span>
                                <span className="text-sm text-gray-400">Verify farmer documents</span>
                            </div>
                        </motion.button>

                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => navigate('/admin/certificates')}
                            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors group"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="p-3 bg-green-500/20 rounded-full mb-3 group-hover:bg-green-500/30 transition-colors">
                                    <FiShield className="w-6 h-6 text-green-400" />
                                </div>
                                <span className="text-lg font-semibold text-white mb-1">Certificates</span>
                                <span className="text-sm text-gray-400">Manage blockchain certificates</span>
                            </div>
                        </motion.button>

                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => navigate('/admin/analytics')}
                            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20 hover:border-green-300/30 dark:hover:border-teal-700/30 transition-colors group"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="p-3 bg-purple-500/20 rounded-full mb-3 group-hover:bg-purple-500/30 transition-colors">
                                    <FiBarChart2 className="w-6 h-6 text-purple-400" />
                                </div>
                                <span className="text-lg font-semibold text-white mb-1">Analytics</span>
                                <span className="text-sm text-gray-400">View detailed metrics</span>
                            </div>
                        </motion.button>
                    </div>
                </div>

                {/* Order Statistics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20"
                    >
                        <h2 className="text-xl font-semibold text-teal-50 mb-6">Order Statistics</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-green-200/10 dark:border-teal-800/10">
                                <div className="flex items-center gap-3">
                                    <FiTruck className="text-yellow-500" size={20} />
                                    <div>
                                        <p className="text-white">Active Orders</p>
                                        <p className="text-sm text-gray-400">Currently processing</p>
                                    </div>
                                </div>
                                <span className="text-xl font-semibold text-white">{stats.activeOrders}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-green-200/10 dark:border-teal-800/10">
                                <div className="flex items-center gap-3">
                                    <FiCheckCircle className="text-green-500" size={20} />
                                    <div>
                                        <p className="text-white">Completed Orders</p>
                                        <p className="text-sm text-gray-400">Successfully delivered</p>
                                    </div>
                                </div>
                                <span className="text-xl font-semibold text-white">{stats.completedOrders}</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-green-200/20 dark:border-teal-800/20"
                    >
                        <h2 className="text-xl font-semibold text-teal-50 mb-6">Order Analytics</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-green-200/10 dark:border-teal-800/10">
                                <div className="flex items-center gap-3">
                                    <FiDollarSign className="text-teal-500" size={20} />
                                    <div>
                                        <p className="text-white">Total Revenue</p>
                                        <p className="text-sm text-gray-400">All time earnings</p>
                                    </div>
                                </div>
                                <span className="text-xl font-semibold text-white">₹{stats.totalRevenue || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-green-200/10 dark:border-teal-800/10">
                                <div className="flex items-center gap-3">
                                    <FiActivity className="text-purple-500" size={20} />
                                    <div>
                                        <p className="text-white">Success Rate</p>
                                        <p className="text-sm text-gray-400">Order completion rate</p>
                                    </div>
                                </div>
                                <span className="text-xl font-semibold text-white">
                                    {Math.round((stats.completedOrders / stats.totalOrders) * 100 || 0)}%
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;