import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaFilter, FaArrowLeft, FaTruck, FaCheck, FaBoxOpen } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const OrderManagement = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        paymentStatus: '',
        paymentMethod: '',
        dateRange: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalOrders: 0
    });
    const [socket, setSocket] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchOrders(1);
        }, 300); // 300ms delay to prevent too many requests

        return () => clearTimeout(debounceTimer);
    }, [filters]); // This will trigger whenever filters change

    useEffect(() => {
        const newSocket = io(API_BASE_URL, {
            transports: ['websocket'],
            reconnection: true
        });
        setSocket(newSocket);

        // Enhanced socket event listener with logging
        newSocket.on('orderStatusUpdate', (data) => {
            console.log('Received order status update:', data);
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === data.orderId
                        ? {
                            ...order,
                            orderStatus: data.newStatus,
                            updatedAt: data.updatedAt || new Date().toISOString()
                        }
                        : order
                )
            );
        });

        // Add connection status handlers
        newSocket.on('connect', () => {
            console.log('Socket connected successfully');
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return () => {
            if (newSocket) {
                console.log('Cleaning up socket connection...');
                newSocket.disconnect();
            }
        };
    }, []);

    const fetchOrders = async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Build query string from filters
            const queryParams = new URLSearchParams({
                page,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '')
                )
            });

            const response = await axios.get(
                `${API_BASE_URL}/api/admin/orders?${queryParams}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setOrders(response.data.orders);
                setPagination(response.data.pagination);
            } else {
                setError(response.data.message || 'Failed to fetch orders');
            }
        } catch (error) {
            console.error('Error fetching orders:', error.response || error);
            setError(error.response?.data?.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_BASE_URL}/api/admin/orders/${orderId}/status`,
                { status },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            // The UI will be updated automatically through the socket event
        } catch (error) {
            console.error('Error updating order status:', error);
            // Optionally show an error notification here
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const FilterSection = () => (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="bg-gray-700 text-white rounded-lg px-4 py-2"
                >
                    <option value="">All Order Status</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                </select>

                <select
                    value={filters.paymentStatus}
                    onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                    className="bg-gray-700 text-white rounded-lg px-4 py-2"
                >
                    <option value="">All Payment Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                </select>

                <select
                    value={filters.paymentMethod}
                    onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                    className="bg-gray-700 text-white rounded-lg px-4 py-2"
                >
                    <option value="">All Payment Methods</option>
                    <option value="cod">Cash on Delivery</option>
                    <option value="razorpay">Razorpay</option>
                </select>
            </div>
        </div>
    );

    const PaginationControls = () => (
        <div className="flex justify-center items-center gap-4 mt-6">
            {pagination.hasPrevPage && (
                <button
                    onClick={() => fetchOrders(pagination.currentPage - 1)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                    Previous
                </button>
            )}
            <span className="text-gray-400">
                Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            {pagination.hasNextPage && (
                <button
                    onClick={() => fetchOrders(pagination.currentPage + 1)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                    Next
                </button>
            )}
        </div>
    );

    const StatusButtons = ({ order, onUpdate }) => {
        const [isUpdating, setIsUpdating] = useState(false);

        const handleStatusUpdate = async (orderId, newStatus) => {
            // Check if order is cancelled
            if (order.orderStatus === 'cancelled') {
                alert('Cannot update status of cancelled orders');
                return;
            }

            try {
                setIsUpdating(true);
                await onUpdate(orderId, newStatus);
            } finally {
                setIsUpdating(false);
            }
        };

        return (
            <div className="flex gap-2 mt-4">
                {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                    <>
                        <button
                            onClick={() => handleStatusUpdate(order._id, 'processing')}
                            className={`px-4 py-2 rounded-lg transition-all duration-300 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                                } ${order.orderStatus === 'processing'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                                }`}
                            disabled={order.orderStatus === 'processing' || isUpdating}
                        >
                            {isUpdating ? 'Updating...' : 'Processing'}
                        </button>
                        <button
                            onClick={() => handleStatusUpdate(order._id, 'shipped')}
                            className={`px-4 py-2 rounded-lg transition-all duration-300 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                                } ${order.orderStatus === 'shipped'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30'
                                }`}
                            disabled={order.orderStatus === 'shipped' || isUpdating}
                        >
                            {isUpdating ? 'Updating...' : 'Shipped'}
                        </button>
                        <button
                            onClick={() => handleStatusUpdate(order._id, 'delivered')}
                            className={`px-4 py-2 rounded-lg transition-all duration-300 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                                } ${order.orderStatus === 'delivered'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                                }`}
                            disabled={order.orderStatus === 'delivered' || isUpdating}
                        >
                            {isUpdating ? 'Updating...' : 'Delivered'}
                        </button>
                    </>
                )}
                {order.orderStatus === 'cancelled' && (
                    <span className="text-red-500 text-sm">
                        This order has been cancelled and cannot be updated
                    </span>
                )}
            </div>
        );
    };

    const OrderCard = ({ order }) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-lg p-6 mb-4"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-white">
                        Order #{order.orderNumber}
                    </h3>
                    <p className="text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    {order.updatedAt && (
                        <p className="text-xs text-gray-500">
                            Last updated: {new Date(order.updatedAt).toLocaleString()}
                        </p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={order.orderStatus}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`px-3 py-1 rounded-full text-sm ${order.orderStatus === 'delivered'
                                ? 'bg-green-500/20 text-green-500'
                                : order.orderStatus === 'cancelled'
                                    ? 'bg-red-500/20 text-red-500'
                                    : 'bg-yellow-500/20 text-yellow-500'
                                }`}
                        >
                            {order.orderStatus}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                <h4 className="text-white font-medium">Products</h4>
                {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                        <div>
                            <p className="text-white">{item.name}</p>
                            <p className="text-sm text-gray-400">
                                Farmer: {order.farmerDetails?.name || order.farmer_details?.name || order.user?.name || 'N/A'}
                                {console.log('Order details:', order)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-white">{item.quantity} x ₹{item.price}</p>
                            <p className="text-teal-500">₹{item.quantity * item.price}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-gray-700/30 p-4 rounded-lg mb-4">
                <h4 className="text-white font-medium mb-2">Payment Details</h4>
                {order.paymentDetails && (
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                            <p className="text-gray-400 mr-2">Order ID:</p>
                            <p className="text-gray-300">{order.paymentDetails.razorpay_order_id}</p>
                        </div>
                        <div className="flex items-center">
                            <p className="text-gray-400 mr-2">Payment ID:</p>
                            <p className="text-gray-300">{order.paymentDetails.razorpay_payment_id}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-gray-700/30 p-4 rounded-lg mb-4">
                <h4 className="text-white font-medium mb-2">Shipping Address</h4>
                <div className="text-sm text-gray-300">
                    <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                    <p>{order.shippingAddress.address}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                    <p>{order.shippingAddress.pincode}</p>
                    <p>Phone: {order.shippingAddress.phone}</p>
                </div>
            </div>

            <StatusButtons order={order} onUpdate={updateOrderStatus} />
        </motion.div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading orders...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center text-teal-500 hover:text-teal-400 mb-6"
                >
                    <FaArrowLeft className="mr-2" /> Back to Dashboard
                </button>

                <FilterSection />

                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="text-center py-12 bg-gray-800/50 rounded-lg">
                            <p className="text-gray-400">No orders found</p>
                        </div>
                    ) : (
                        orders.map(order => (
                            <OrderCard key={order._id} order={order} />
                        ))
                    )}
                </div>

                <PaginationControls />
            </div>
        </div>
    );
};

export default OrderManagement;