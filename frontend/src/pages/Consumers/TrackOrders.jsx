import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';
import { FiPackage, FiTruck, FiCheck, FiXCircle, FiBox, FiArrowLeft, FiArrowRight, FiCalendar, FiArrowDown } from 'react-icons/fi';
import { TbTruckDelivery } from 'react-icons/tb';


const TrackOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'cancelled'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'week', 'month', 'year'
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'amount'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [socket, setSocket] = useState(null);

  const dateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, activeTab, dateFilter, sortBy, sortOrder]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_API_URL);
    setSocket(newSocket);

    // Listen for order status updates
    newSocket.on('orderStatusUpdate', ({ orderId, newStatus }) => {
      console.log('Received status update:', orderId, newStatus);
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, orderStatus: newStatus }
            : order
        )
      );

      setFilteredOrders(prevFiltered =>
        prevFiltered.map(order =>
          order._id === orderId
            ? { ...order, orderStatus: newStatus }
            : order
        )
      );
    });

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const fetchOrders = async (page) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching orders for page:', page);
      
      const response = await axios.get(`/api/orders/my-orders?page=${page}&limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Orders API Response:', response.data);

      if (response.data.success) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
        console.log('Updated Orders:', response.data.orders);
        console.log('Updated Pagination:', response.data.pagination);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError('Failed to load orders');
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      console.log('Attempting to cancel order:', orderId);
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/orders/${orderId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Cancel order response:', response.data);

      if (response.data.success) {
        console.log('Order cancelled successfully');
        fetchOrders(currentPage);
      }
    } catch (error) {
      console.error('Cancel order error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  const filterAndSortOrders = () => {
    console.log('Starting filter and sort with:', {
      activeTab,
      dateFilter,
      sortBy,
      sortOrder,
      totalOrders: orders.length
    });

    let filtered = [...orders];

    // Status filter
    filtered = filtered.filter(order => 
      activeTab === 'cancelled' 
        ? order.orderStatus === 'cancelled'
        : order.orderStatus !== 'cancelled'
    );
    console.log('After status filter:', filtered.length, 'orders');

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= filterDate
      );
      console.log('After date filter:', filtered.length, 'orders');
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc'
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt);
      } else {
        return sortOrder === 'desc'
          ? b.totalAmount - a.totalAmount
          : a.totalAmount - b.totalAmount;
      }
    });
    
    console.log('Final filtered and sorted orders:', {
      count: filtered.length,
      firstOrder: filtered[0],
      lastOrder: filtered[filtered.length - 1]
    });

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'created':
        return 'text-blue-500';
      case 'processing':
        return 'text-yellow-500';
      case 'shipped':
        return 'text-purple-500';
      case 'delivered':
        return 'text-green-500';
      case 'cancelled':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Update the OrderTimeline component to be horizontal
  const OrderTimeline = ({ status }) => {
    const steps = [
      { status: 'created', icon: <FiBox size={20} />, label: 'Order Placed' },
      { status: 'processing', icon: <FiPackage size={20} />, label: 'Processing' },
      { status: 'shipped', icon: <TbTruckDelivery size={20} />, label: 'Shipped' },
      { status: 'delivered', icon: <FiCheck size={20} />, label: 'Delivered' }
    ];

    const currentStep = steps.findIndex(step => step.status === status);

    return (
      <div className="relative mt-8">
        {/* Horizontal line */}
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-700"></div>
        
        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => (
            <div key={step.status} className="flex flex-col items-center">
              <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full 
                ${index <= currentStep ? 'bg-teal-500' : 'bg-gray-700'} 
                transition-colors duration-300`}>
                {step.icon}
              </div>
              <p className={`mt-2 text-sm font-medium ${
                index <= currentStep ? 'text-teal-500' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Update the PaginationControls component to include page numbers
  const PaginationControls = () => {
    const pageNumbers = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <button
          onClick={() => setCurrentPage(prev => prev - 1)}
          disabled={!pagination.hasPrevPage}
          className={`px-3 py-2 rounded-lg flex items-center
            ${pagination.hasPrevPage 
              ? 'bg-teal-500/20 text-teal-500 hover:bg-teal-500/30' 
              : 'bg-gray-700/20 text-gray-500 cursor-not-allowed'}`}
        >
          <FiArrowLeft />
        </button>

        <div className="flex gap-1">
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center
                ${currentPage === number 
                  ? 'bg-teal-500 text-white' 
                  : 'bg-teal-500/20 text-teal-500 hover:bg-teal-500/30'}`}
            >
              {number}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={!pagination.hasNextPage}
          className={`px-3 py-2 rounded-lg flex items-center
            ${pagination.hasNextPage 
              ? 'bg-teal-500/20 text-teal-500 hover:bg-teal-500/30' 
              : 'bg-gray-700/20 text-gray-500 cursor-not-allowed'}`}
        >
          <FiArrowRight />
        </button>
      </div>
    );
  };

  const TabSelector = () => (
    <div className="flex space-x-4 mb-6 bg-white/5 p-1 rounded-lg">
      <button 
        onClick={() => setActiveTab('active')}
        className={`flex-1 py-2 px-4 rounded-md transition-colors ${
          activeTab === 'active' 
            ? 'bg-teal-500 text-white' 
            : 'text-gray-400 hover:text-teal-500'
        }`}
      >
        Active Orders
      </button>
      <button 
        onClick={() => setActiveTab('cancelled')}
        className={`flex-1 py-2 px-4 rounded-md transition-colors ${
          activeTab === 'cancelled' 
            ? 'bg-red-500 text-white' 
            : 'text-gray-400 hover:text-red-500'
        }`}
      >
        Cancelled Orders
      </button>
    </div>
  );

  const FilterBar = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-lg">
        <FiCalendar className="text-gray-400" />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-transparent text-teal-50 outline-none w-full"
        >
          {dateFilterOptions.map(option => (
            <option 
              key={option.value} 
              value={option.value}
              className="bg-gray-800 text-teal-50"
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-lg">
        <FiPackage className="text-gray-400" />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-transparent text-teal-50 outline-none w-full"
        >
          <option value="date" className="bg-gray-800">Sort by Date</option>
          <option value="amount" className="bg-gray-800">Sort by Amount</option>
        </select>
      </div>

      <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-lg">
        <FiArrowDown className="text-gray-400" />
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="bg-transparent text-teal-50 outline-none w-full"
        >
          <option value="desc" className="bg-gray-800">Descending</option>
          <option value="asc" className="bg-gray-800">Ascending</option>
        </select>
      </div>
    </div>
  );

  const OrderCard = ({ order, showCancelButton }) => {
    const [isUpdated, setIsUpdated] = useState(false);

    useEffect(() => {
      if (isUpdated) {
        const timer = setTimeout(() => setIsUpdated(false), 2000);
        return () => clearTimeout(timer);
      }
    }, [isUpdated]);

    useEffect(() => {
      setIsUpdated(true);
    }, [order.orderStatus]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border 
          ${isUpdated 
            ? 'border-teal-500 shadow-lg shadow-teal-500/20' 
            : 'border-green-200/20'} 
          transition-all duration-300`}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-teal-50">Order #{order.orderNumber}</h3>
            <p className="text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className={`px-3 py-1 rounded-full ${getStatusColor(order.orderStatus)} bg-opacity-20`}>
            {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
          </div>
        </div>

        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center bg-white/5 p-4 rounded-lg">
              <div>
                <p className="text-teal-50">{item.name}</p>
                <p className="text-gray-400">Quantity: {item.quantity}</p>
                <p className="text-gray-400">Farmer: {item.farmer_details.name}</p>
              </div>
              <p className="text-teal-50">₹{item.price * item.quantity}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-gray-700 pt-4">
          <div className="flex justify-between items-center">
            <div className="text-teal-50">
              <p>Total Amount:</p>
              <p className="text-xl font-semibold">₹{order.totalAmount}</p>
            </div>
            {showCancelButton && order.orderStatus !== 'delivered' && (
              <button
                onClick={() => cancelOrder(order._id)}
                className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Cancel Order
              </button>
            )}
          </div>

          <OrderTimeline status={order.orderStatus} />
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-teal-50">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-teal-50 mb-8">Track Orders</h2>
          
          <TabSelector />
          <FilterBar />

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl">
              <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">
                {activeTab === 'cancelled' 
                  ? 'No cancelled orders found' 
                  : 'No active orders found'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + dateFilter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {filteredOrders.map(order => (
                  <OrderCard 
                    key={order._id} 
                    order={order} 
                    showCancelButton={activeTab === 'active'}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
          <PaginationControls />
        </div>
      </div>
    </div>
  );
};

export default TrackOrders;