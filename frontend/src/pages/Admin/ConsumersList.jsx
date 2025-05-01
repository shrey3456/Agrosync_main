import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaArrowLeft, FaShoppingBag } from 'react-icons/fa';

const ConsumersList = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const [consumers, setConsumers] = useState([]); // Initialize as empty array
    const [selectedConsumer, setSelectedConsumer] = useState(null);
    const [consumerOrders, setConsumerOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConsumers = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('No authentication token found');
                    setLoading(false);
                    return;
                }

                const response = await axios.get(
                    `${API_BASE_URL}/api/admin/consumers`,
                    { 
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        } 
                    }
                );

                console.log('API Response:', response.data); // Debug log

                if (response.data.success && Array.isArray(response.data.consumers)) {
                    setConsumers(response.data.consumers);
                } else {
                    setError('Invalid data format received from server');
                }
            } catch (error) {
                console.error('Error fetching consumers:', error);
                setError(error.response?.data?.message || 'Failed to fetch consumers');
            } finally {
                setLoading(false);
            }
        };

        fetchConsumers();
    }, [API_BASE_URL]);

    const handleConsumerClick = async (consumerId, page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/api/admin/consumers/${consumerId}/orders?page=${page}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log('Consumer Orders Response:', {
                ordersCount: response.data.orders?.length,
                pagination: response.data.pagination
            });

            if (response.data.success) {
                const consumer = consumers.find(c => c._id === consumerId);
                setSelectedConsumer(consumer);
                setConsumerOrders(response.data.orders);
                setPagination(response.data.pagination);
                setCurrentPage(page);
            }
        } finally {
            setLoading(false);
        }
    };

    const PaginationControls = () => {
        if (!pagination) return null;

        // Generate array of page numbers to show
        const getPageNumbers = () => {
            const pageNumbers = [];
            const maxVisiblePages = 5; // Number of page buttons to show
            let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

            // Adjust start if we're near the end
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }
            return pageNumbers;
        };

        return (
            <div className="flex justify-center items-center mt-6 gap-2">
                {/* Previous button */}
                {pagination.hasPrevPage && (
                    <button
                        onClick={() => handleConsumerClick(selectedConsumer._id, currentPage - 1)}
                        className="px-3 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                    >
                        ←
                    </button>
                )}

                {/* First page if not in view */}
                {getPageNumbers()[0] > 1 && (
                    <>
                        <button
                            onClick={() => handleConsumerClick(selectedConsumer._id, 1)}
                            className="px-3 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                        >
                            1
                        </button>
                        {getPageNumbers()[0] > 2 && (
                            <span className="px-2 text-gray-400">...</span>
                        )}
                    </>
                )}

                {/* Page numbers */}
                {getPageNumbers().map(pageNum => (
                    <button
                        key={pageNum}
                        onClick={() => handleConsumerClick(selectedConsumer._id, pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg ${
                            pageNum === currentPage
                                ? 'bg-teal-500 text-white'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                    >
                        {pageNum}
                    </button>
                ))}

                {/* Last page if not in view */}
                {getPageNumbers()[getPageNumbers().length - 1] < pagination.totalPages && (
                    <>
                        {getPageNumbers()[getPageNumbers().length - 1] < pagination.totalPages - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                            onClick={() => handleConsumerClick(selectedConsumer._id, pagination.totalPages)}
                            className="px-3 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                        >
                            {pagination.totalPages}
                        </button>
                    </>
                )}

                {/* Next button */}
                {pagination.hasNextPage && (
                    <button
                        onClick={() => handleConsumerClick(selectedConsumer._id, currentPage + 1)}
                        className="px-3 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                    >
                        →
                    </button>
                )}
            </div>
        );
    };

    const LoadingOverlay = () => (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="text-white text-xl">Loading orders...</div>
        </div>
    );

    // Add loading state display
    if (loading && !selectedConsumer) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading consumers...</div>
            </div>
        );
    }

    // Add error state display
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
                <div className="text-red-500 text-xl mb-4">{error}</div>
                <button 
                    onClick={() => navigate('/admin')}
                    className="text-teal-500 hover:text-teal-400"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // Add empty state display
    if (!consumers || consumers.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
                <div className="text-white text-xl mb-4">No consumers found</div>
                <button 
                    onClick={() => navigate('/admin')}
                    className="text-teal-500 hover:text-teal-400"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (selectedConsumer) {
        return (
            <div className="min-h-screen bg-gray-900 p-8 relative">
                {loading && <LoadingOverlay />}
                <div className="max-w-7xl mx-auto">
                    <button 
                        onClick={() => setSelectedConsumer(null)}
                        className="flex items-center text-teal-500 hover:text-teal-400 mb-6"
                    >
                        <FaArrowLeft className="mr-2" /> Back to Consumers List
                    </button>
                    
                    <div className="bg-gray-800 rounded-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {selectedConsumer.name}'s Orders
                            </h2>
                            <span className="bg-teal-500/20 text-teal-500 px-4 py-2 rounded-full">
                                {pagination?.totalOrders || 0} Total Orders
                            </span>
                        </div>
                        
                        <div className="space-y-4">
                            {consumerOrders.map((order) => (
                                <div key={order._id} className="bg-gray-700 rounded-lg p-6">
                                    {/* Order Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-white font-semibold">
                                                Order Number: {order.orderNumber}
                                            </p>
                                            <p className="text-white">
                                                Order ID: {order.order_id}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                Placed on: {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                Estimated Delivery: {new Date(order.deliveryEstimate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 rounded-full text-sm ${
                                                order.orderStatus === 'delivered' 
                                                    ? 'bg-green-500/20 text-green-500'
                                                    : order.orderStatus === 'cancelled'
                                                    ? 'bg-red-500/20 text-red-500'
                                                    : 'bg-yellow-500/20 text-yellow-500'
                                            }`}>
                                                {order.orderStatus}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-sm ${
                                                order.paymentStatus === 'paid' 
                                                    ? 'bg-green-500/20 text-green-500'
                                                    : 'bg-yellow-500/20 text-yellow-500'
                                            }`}>
                                                Payment: {order.paymentStatus}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment Information */}
                                    <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                                        <h3 className="text-white font-semibold mb-2">Payment Information</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-400">Payment Method</p>
                                                <p className="text-gray-300">{order.paymentMethod}</p>
                                            </div>
                                            {order.paymentDetails && (
                                                <>
                                                    <div>
                                                        <p className="text-gray-400">Razorpay Order ID</p>
                                                        <p className="text-gray-300">{order.paymentDetails.razorpay_order_id}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400">Payment ID</p>
                                                        <p className="text-gray-300">{order.paymentDetails.razorpay_payment_id}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Shipping Address */}
                                    <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                                        <h3 className="text-white font-semibold mb-2">Shipping Address</h3>
                                        <div className="text-gray-300 text-sm">
                                            <p className="font-medium">
                                                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                                            </p>
                                            <p>{order.shippingAddress.address}</p>
                                            <p>
                                                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                            </p>
                                            <p>{order.shippingAddress.country}</p>
                                            <p>Phone: {order.shippingAddress.phone}</p>
                                            <p>Email: {order.shippingAddress.email}</p>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="space-y-4">
                                        {order.items.map((item) => (
                                            <div key={item._id} 
                                                className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
                                            >
                                                <div className="flex-grow">
                                                    <h4 className="text-white font-medium">{item.name}</h4>
                                                    <div className="text-gray-400 text-sm">
                                                        <p>Category: {item.category}</p>
                                                        {item.farmer_details && (
                                                            <p className="mt-1">
                                                                Farmer: {item.farmer_details.name} | Rating: {item.farmer_details.rating}⭐
                                                            </p>
                                                        )}
                                                        {item.traceability && (
                                                            <div className="mt-2 text-xs">
                                                                <p>Farm: {item.traceability.farm_location}</p>
                                                                <p>Harvested: {new Date(item.traceability.harvest_date).toLocaleDateString()}</p>
                                                                <p>Method: {item.traceability.harvest_method}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right text-gray-300">
                                                    <p>{item.quantity} x ₹{item.price}</p>
                                                    <p className="text-teal-500 font-medium">
                                                        ₹{item.quantity * item.price}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Summary */}
                                    <div className="mt-4 pt-3 border-t border-gray-600">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-400">Subtotal</span>
                                            <span className="text-gray-300">₹{order.subtotal}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-400">Shipping Fee</span>
                                            <span className="text-gray-300">₹{order.shippingFee}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-400">Tax</span>
                                            <span className="text-gray-300">₹{order.taxAmount}</span>
                                        </div>
                                        {order.discount > 0 && (
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-400">Discount</span>
                                                <span className="text-green-500">-₹{order.discount}</span>
                                            </div>
                                        )}
                                        {order.couponCode && (
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-400">Coupon Applied</span>
                                                <span className="text-teal-500">{order.couponCode}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-white font-semibold text-lg mt-2 pt-2 border-t border-gray-600">
                                            <span>Total Amount</span>
                                            <span>₹{order.totalAmount}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <PaginationControls />
                    </div>
                </div>
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
                
                <h1 className="text-3xl font-bold text-white mb-8 text-center">
                    Consumers Directory
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {consumers.map((consumer) => (
                        <div 
                            key={consumer._id} 
                            className="bg-gray-800 rounded-lg p-6 shadow-lg hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                            onClick={() => handleConsumerClick(consumer._id)}
                        >
                            <h2 className="text-xl font-bold text-white mb-4">
                                {consumer.name || 'Unnamed Consumer'}
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center text-gray-300">
                                    <FaEnvelope className="text-teal-500 mr-2" />
                                    {consumer.email || 'No email provided'}
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <FaPhone className="text-teal-500 mr-2" />
                                    {consumer.phoneNumber || 'N/A'}
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <FaMapMarkerAlt className="text-teal-500 mr-2" />
                                    {consumer.location?.city || 'N/A'}
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <FaShoppingBag className="text-teal-500 mr-2" />
                                    {consumer.totalOrders || 0} Orders
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConsumersList;