import Order from '../models/order.js';
import Product from '../models/Product.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import mongoose from 'mongoose'; // Add mongoose import
import Notification from '../models/Notification.js'; // Add this import

dotenv.config();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Helper function to generate receipt id
const generateReceiptId = () => {
  return 'rcpt_' + Math.random().toString(36).substring(2, 15);
};

// Helper function to generate unique order ID
const generateOrderId = () => {
  const date = new Date();
  const dateStr = date.getFullYear() +
                String(date.getMonth() + 1).padStart(2, '0') +
                String(date.getDate()).padStart(2, '0');
  const randomStr = Math.floor(10000 + Math.random() * 90000).toString();
  return `ORD-${dateStr}-${randomStr}`;
};

// Create Razorpay order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: 'INR',
      receipt: generateReceiptId(),
      payment_capture: 1,
      notes: {
        user_id: req.user.id
      }
    };
    
const razorpayOrder = await razorpay.orders.create(options);
    
    res.status(200).json({
      success: true,
      order: razorpayOrder
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong. Please try again.'
    });
  }
};

// Create a new order
const createOrder = async (req, res) => {
  try {
    console.log('Order data received:', req.body);
    
    const requestId = req.headers['x-request-id'] || req.body.requestId;
    
    if (requestId) {
      const existingOrder = await Order.findOne({ requestId });
      if (existingOrder) {
        console.log('Duplicate request detected, returning existing order');
        return res.status(200).json({
          success: true,
          message: 'Order already processed',
          order: existingOrder
        });
      }
    }
    
    const {
      items = [],
      shippingAddress = {},
      subtotal = 0,
      shippingFee = 0,
      taxAmount = 0,
      discount = 0,
      totalAmount = 0,
      couponCode = "",
      paymentMethod = "",
      razorpay_order_id = ""
    } = req.body;
    
    if (!items.length || !shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Missing required order information'
      });
    }
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false, 
        error: 'User authentication required'
      });
    }

    const itemsWithFarmerId = items.map(item => ({
      ...item,
      farmer_id: item.farmer_id
    }));
    
    const order = new Order({
      requestId: requestId,
      user: req.user.id,
      items: itemsWithFarmerId,
      shippingAddress,
      subtotal,
      shippingFee,
      taxAmount,
      discount,
      totalAmount,
      couponCode,
      paymentMethod
    });
    
    if (paymentMethod === 'cod') {
      order.paymentStatus = 'pending';
      order.orderStatus = 'processing';
    }
    
    if (paymentMethod === 'razorpay' && razorpay_order_id) {
      order.paymentDetails = {
        razorpay_order_id
      };
    }

    try {
      await order.save();
      
      const uniqueFarmerIds = [...new Set(itemsWithFarmerId.map(item => item.farmer_id))];
      for (const farmerId of uniqueFarmerIds) {
        if (farmerId) {
          await Notification.create({
            userId: farmerId,
            userRole: 'farmer',
            type: 'new_order',
            message: `New order #${order.orderNumber} received`,
            orderId: order._id,
            read: false
          });
        }
      }

      await Notification.create({
        userId: req.user.id,
        userRole: 'consumer',
        type: 'new_order',
        message: `Your order #${order.orderNumber} has been placed successfully`,
        orderId: order._id,
        read: false
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        order: order
      });
    } catch (saveError) {
      if (saveError.code === 11000) {
        console.error('Duplicate key error:', saveError.keyValue);
        
        if (saveError.keyValue.orderNumber) {
          const year = new Date().getFullYear().toString().substr(-2);
          const random = Math.floor(100000 + Math.random() * 900000).toString();
          order.orderNumber = `ORD-${year}${random}`;
          
          await order.save();
          
          return res.status(201).json({
            success: true,
            message: 'Order created successfully (retry)',
            order: order
          });
        }
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Error creating order:', error.message, error.stack);
    
    let errorMessage = 'Failed to create order. Please try again.';
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      errorMessage = `Validation failed: ${validationErrors.join(', ')}`;
    } else if (error.code === 11000) {
      errorMessage = 'A duplicate order was detected. Please try again.';
      console.error('Duplicate key error details:', error.keyValue);
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
};

// Verify Razorpay payment
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;
    
    // Validate signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
      
    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed'
      });
    }
    
    // Find and update order
    let order;
    
    if (orderId) {
      // If order ID provided, find by ID
      order = await Order.findById(orderId);
    } else {
      // Find by razorpay order ID
      order = await Order.findOne({
        'paymentDetails.razorpay_order_id': razorpay_order_id
      });
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Update order with payment details
    order.paymentStatus = 'paid';
    order.orderStatus = 'processing';
    order.paymentDetails = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    };
    
    await order.save();
    
    // Update product inventory
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } }
        );
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order
    });
    
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed. Please contact support.'
    });
  }
};

// Get all orders for the current user
const getMyOrders = async (req, res) => {
  try {
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalOrders = await Order.countDocuments({ user: req.user.id });

    // Get paginated orders
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'name price image_url')
      .lean();

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNextPage: page * limit < totalOrders,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
};

// Get single order details
const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if order belongs to current user
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this order'
      });
    }
    
    res.status(200).json({
      success: true,
      order
    });
    
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order details'
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if order belongs to current user
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this order'
      });
    }
    
    // Check if order can be cancelled
    if (['shipped', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        error: `Order cannot be cancelled as it is already ${order.orderStatus}`
      });
    }
    
    order.orderStatus = 'cancelled';
    
    // If already paid, mark for refund
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }
    
    await order.save();
    
    // Restore product inventory
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
};

// Admin: Get all orders
const getAllOrders = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filters
    let filterOptions = {};
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filterOptions.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Search by order number or customer name
    if (req.query.search) {
      filterOptions.$or = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.firstName': { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.lastName': { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get orders with pagination
    const orders = await Order.find(filterOptions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');
      
    // Get total count for pagination
    const total = await Order.countDocuments(filterOptions);
    
    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      orders
    });
    
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
};

// Admin: Get orders by status
const getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    // Validate status
    const validStatuses = ['created', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get orders by status
    const orders = await Order.find({ orderStatus: status })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');
      
    // Get total count
    const total = await Order.countDocuments({ orderStatus: status });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      orders
    });
    
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
};

// Admin: Process refund
const processRefund = async (req, res) => {
  try {
    const { refundAmount, refundReason } = req.body;
    
    if (!refundAmount || !refundReason) {
      return res.status(400).json({
        success: false,
        error: 'Refund amount and reason are required'
      });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Verify payment status
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Order must be paid to process refund'
      });
    }
    
    // For Razorpay refunds, you would integrate with their API here
    // This is a simplified example
    
    // Update order with refund information
    order.paymentStatus = 'refunded';
    order.refundDetails = {
      amount: refundAmount,
      reason: refundReason,
      processedBy: req.user.id,
      processedAt: new Date()
    };
    
    await order.save();
    
    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      order
    });
    
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund'
    });
  }
};

// Admin: Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    // Get date range (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (parseInt(req.query.days) || 30));
    
    // Total orders
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Total revenue
    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
    
    // Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Orders by payment method
    const ordersByPayment = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Daily sales chart data
    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Top selling products
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue,
        ordersByStatus: ordersByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        ordersByPayment: ordersByPayment.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        dailySales,
        topProducts
      }
    });
    
  } catch (error) {
    console.error('Error generating dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard stats'
    });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeFrame = 'monthly' } = req.query;

    // Fetch orders excluding cancelled ones
    const orders = await Order.find({ 
      user: userId,
      orderStatus: { $ne: 'cancelled' }
    })
    .populate('items.product')
    .sort({ createdAt: 1 });

    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate most bought products with spending
    const productStats = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productStats[item.name]) {
          productStats[item.name] = {
            quantity: 0,
            totalSpent: 0
          };
        }
        productStats[item.name].quantity += item.quantity;
        productStats[item.name].totalSpent += (item.price * item.quantity);
      });
    });

    const mostBoughtProducts = Object.entries(productStats)
      .map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        totalSpent: stats.totalSpent,
        percentage: 0 // Will be calculated below
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Calculate percentages
    const totalQuantity = mostBoughtProducts.reduce((sum, product) => sum + product.quantity, 0);
    mostBoughtProducts.forEach(product => {
      product.percentage = (product.quantity / totalQuantity) * 100;
    });

    // Calculate order frequency based on timeFrame
    let orderFrequency = [];
    const now = new Date();

    if (timeFrame === 'weekly') {
      // Get last 4 weeks
      const weeks = {};
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const weekStart = new Date(orderDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeks[weekKey]) {
          weeks[weekKey] = { orders: 0, amount: 0 };
        }
        weeks[weekKey].orders++;
        weeks[weekKey].amount += order.totalAmount;
      });

      orderFrequency = Object.entries(weeks)
        .map(([period, stats]) => ({
          period: `Week of ${period}`,
          orders: stats.orders,
          amount: stats.amount
        }))
        .slice(-4);
    } 
    else if (timeFrame === 'monthly') {
      // Get last 12 months
      const months = {};
      orders.forEach(order => {
        const date = new Date(order.createdAt);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        
        if (!months[monthKey]) {
          months[monthKey] = { orders: 0, amount: 0 };
        }
        months[monthKey].orders++;
        months[monthKey].amount += order.totalAmount;
      });

      orderFrequency = Object.entries(months)
        .map(([period, stats]) => ({
          period,
          orders: stats.orders,
          amount: stats.amount
        }))
        .slice(-12);
    }
    else if (timeFrame === 'yearly') {
      // Get last 5 years
      const years = {};
      orders.forEach(order => {
        const year = new Date(order.createdAt).getFullYear().toString();
        if (!years[year]) {
          years[year] = { orders: 0, amount: 0 };
        }
        years[year].orders++;
        years[year].amount += order.totalAmount;
      });

      orderFrequency = Object.entries(years)
        .map(([period, stats]) => ({
          period,
          orders: stats.orders,
          amount: stats.amount
        }))
        .slice(-5);
    }

    // Calculate spending analysis with the same timeframes
    const spendingAnalysis = orderFrequency.map(({ period, amount }) => ({
      period,
      amount
    }));

    // Calculate category distribution
    const categoryStats = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!categoryStats[category]) {
          categoryStats[category] = {
            count: 0,
            totalSpent: 0
          };
        }
        categoryStats[category].count += item.quantity;
        categoryStats[category].totalSpent += (item.price * item.quantity);
      });
    });

    const categoryDistribution = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        totalSpent: stats.totalSpent
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalAmount,
        mostBoughtProducts,
        spendingAnalysis,
        orderFrequency,
        categoryDistribution
      }
    });

  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting order statistics'
    });
  }
};

export const getRecentOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    console.log('Fetching recent orders for:', userRole, userId);

    let query = {};
    
    // Different query based on user role
    if (userRole === 'farmer') {
      query = { 'items.farmer_id': userId };  // Search by farmer_id in items
    } else {
      query = { user: userId };  // Search by consumer/user id
    }

    const recentOrders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('items.product', 'name price image_url')
      .populate('user', 'name email') // Add user details for farmer view
      .select('orderNumber items totalAmount createdAt orderStatus');

    // For farmers, filter items to only show their products
    if (userRole === 'farmer') {
      const filteredOrders = recentOrders.map(order => ({
        ...order.toObject(),
        items: order.items.filter(item => item.farmer_id?.toString() === userId)
      }));

      console.log('Found recent orders for farmer:', filteredOrders.length);
      return res.json({
        success: true,
        orders: filteredOrders || []
      });
    }

    console.log('Found recent orders for consumer:', recentOrders.length);
    res.json({
      success: true,
      orders: recentOrders || []
    });

  } catch (error) {
    console.error('Error in getRecentOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent orders',
      error: error.message
    });
  }
};

export const getFarmerOrders = async (req, res) => {
  try {
    const farmer_id = req.user.id;  // Get farmer ID from authenticated user
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get orders containing items from this farmer
    const orders = await Order.find({
      'items.farmer_id': farmer_id
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments({
      'items.farmer_id': farmer_id
    });

    // Filter items in each order to only show items from this farmer
    const filteredOrders = orders.map(order => ({
      ...order,
      items: order.items.filter(item => item.farmer_id?.toString() === farmer_id)
    }));

    res.status(200).json({
      success: true,
      orders: filteredOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNextPage: page * limit < totalOrders,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching farmer orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
};

export const orderController = {
  createRazorpayOrder,
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
  getAllOrders,
  getOrdersByStatus,
  processRefund,
  getDashboardStats,
  getOrderStats,
  getRecentOrders,
  getFarmerOrders,
};

