import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  TruckIcon, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  RefreshCcw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const OrderStatusBadge = ({ status }) => {
  let bgColor = 'bg-gray-500';
  let textColor = 'text-white';
  let icon = <AlertCircle size={14} className="mr-1" />;

  switch (status) {
    case 'created':
      bgColor = 'bg-blue-500/20';
      textColor = 'text-blue-400';
      icon = <Package size={14} className="mr-1" />;
      break;
    case 'processing':
      bgColor = 'bg-yellow-500/20';
      textColor = 'text-yellow-400';
      icon = <RefreshCcw size={14} className="mr-1" />;
      break;
    case 'shipped':
      bgColor = 'bg-purple-500/20';
      textColor = 'text-purple-400';
      icon = <TruckIcon size={14} className="mr-1" />;
      break;
    case 'delivered':
      bgColor = 'bg-green-500/20';
      textColor = 'text-green-400';
      icon = <CheckCircle size={14} className="mr-1" />;
      break;
    case 'cancelled':
      bgColor = 'bg-red-500/20';
      textColor = 'text-red-400';
      icon = <AlertCircle size={14} className="mr-1" />;
      break;
  }

  return (
    <span className={`${bgColor} ${textColor} text-xs flex items-center px-2 py-1 rounded-full`}>
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const FarmerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  const handleBack = () => {
    navigate('/farmer');
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }
      
      const { data } = await axios.get(`${API_BASE_URL}/api/farmer/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Failed to fetch orders');
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpand = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => 
        order.items.some(item => item.status === statusFilter)
      );
    }
    
    if (searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(search) ||
        order.shippingAddress.firstName.toLowerCase().includes(search) ||
        order.shippingAddress.lastName.toLowerCase().includes(search) ||
        order.shippingAddress.city.toLowerCase().includes(search) ||
        order.user?.name?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  };

  const formattedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get current orders for pagination
  const filteredOrders = filterOrders();
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setExpandedOrder(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] pt-20 px-6">
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-t-4 border-teal-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] pt-20 px-6">
        <div className="max-w-4xl mx-auto p-6 bg-red-900/20 border border-red-700/20 rounded-lg text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Orders</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={fetchOrders}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
      <div className="pt-20 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
              >
                <ChevronLeft size={20} />
                <span>Back to Dashboard</span>
              </button>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-teal-50 mb-2">Your Orders</h1>
            <p className="text-gray-400">View and track orders containing your products</p>
          </div>
          
          {/* Filters */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search by order number, customer name or address..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-200"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-800/50 border border-gray-700/50 text-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Statuses</option>
                <option value="created">Created</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <button
                onClick={fetchOrders}
                className="bg-teal-600 hover:bg-teal-700 text-white p-2 rounded-lg transition-colors duration-200"
                title="Refresh Orders"
              >
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>
          
          {/* Orders List */}
          {currentOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <Package className="mx-auto h-12 w-12 text-gray-500 mb-4" />
              <h3 className="text-xl font-medium text-gray-300">No orders found</h3>
              <p className="mt-2 text-gray-400">
                {statusFilter !== 'all' 
                  ? `No orders with status "${statusFilter}" were found.` 
                  : searchTerm 
                    ? "No orders match your search criteria." 
                    : "You don't have any orders yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentOrders.map(order => (
                  <motion.div 
                    key={order._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden backdrop-blur-sm"
                  >
                    {/* Order Header */}
                    <div 
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-gray-700/30 transition-colors duration-200"
                      onClick={() => toggleOrderExpand(order._id)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-teal-400" />
                          <span className="font-medium text-gray-200">{order.orderNumber}</span>
                        </div>
                        
                        <div className="text-sm text-gray-400">
                          {formattedDate(order.createdAt)}
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-gray-400 mr-1">Customer:</span>
                          <span className="text-gray-200">
                            {order.user?.name || 
                             `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-3 md:mt-0">
                        <span className="text-teal-400 font-medium">
                          ₹{order.totalAmount.toFixed(2)}
                        </span>
                        
                        {expandedOrder === order._id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Order Details (Expanded) */}
                    {expandedOrder === order._id && (
                      <div className="p-4 border-t border-gray-700/50 bg-gray-800/30">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Order Items</h4>
                          
                          <div className="space-y-3">
                            {order.items.map(item => (
                              <div key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                                <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                  <div className="w-16 h-16 bg-gray-700/50 rounded-lg flex items-center justify-center">
                                    {item.image_url ? (
                                      <img 
                                        src={item.image_url}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded-lg"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";
                                        }}
                                      />
                                    ) : (
                                      <Package size={24} className="text-gray-500" />
                                    )}
                                  </div>
                                  
                                  <div>
                                    <p className="font-medium text-gray-200">{item.name}</p>
                                    <p className="text-sm text-gray-400">
                                      {item.quantity} × ₹{item.price.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      Total: ₹{(item.quantity * item.price).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <OrderStatusBadge status={item.status || order.orderStatus} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Shipping Details</h4>
                            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                              <p className="text-gray-200">
                                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {order.shippingAddress.address}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                              </p>
                              <p className="text-gray-400 text-sm mt-2">
                                {order.shippingAddress.phone}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {order.shippingAddress.email}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Payment Information</h4>
                            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-400">Payment Method:</span>
                                <span className="text-gray-200 capitalize">{order.paymentMethod}</span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-400">Payment Status:</span>
                                <span className={order.paymentStatus === 'paid' ? 'text-green-400' : 'text-yellow-400'}>
                                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Total Amount:</span>
                                <span className="text-teal-400 font-medium">₹{order.totalAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {filteredOrders.length > ordersPerPage && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg ${
                      currentPage === 1
                        ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-800/50 text-teal-400 hover:bg-gray-700/50 transition-colors duration-200'
                    }`}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(pageNum => {
                        if (totalPages <= 7) return true;
                        if (pageNum === 1 || pageNum === totalPages) return true;
                        if (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) return true;
                        if (pageNum === 2 || pageNum === totalPages - 1) return true;
                        return false;
                      })
                      .map((pageNum, i, arr) => (
                        <React.Fragment key={pageNum}>
                          {i > 0 && arr[i - 1] !== pageNum - 1 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                              currentPage === pageNum
                                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50'
                                : 'bg-gray-800/50 text-teal-400 hover:bg-gray-700/50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg ${
                      currentPage === totalPages
                        ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-800/50 text-teal-400 hover:bg-gray-700/50 transition-colors duration-200'
                    }`}
                  >
                    <ChevronRight size={20} />
                  </button>

                  <span className="ml-4 text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              )}
            </>
          )}
          
          <ToastContainer 
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </div>
      </div>
    </div>
  );
};

export default FarmerOrders;