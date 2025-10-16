import User from '../models/user.js';
import Product from '../models/Product.js';
import Order from '../models/order.js';
import FarmerDocument from '../models/FarmerDocument.js';

// Get farmer dashboard statistics
export const getFarmerStats = async (req, res) => {
  try {
    console.log('📊 Getting farmer stats...');
    console.log('🔍 Full request user object:', req.user);

    // Check if req.user exists
    if (!req.user) {
      console.error('❌ req.user is undefined - authentication middleware issue');
      return res.status(401).json({
        success: false,
        message: 'Authentication required. User not found in request.'
      });
    }

    // Extract farmer ID with multiple fallbacks
    const farmerId = req.user.id || req.user._id || req.user.userId;
    console.log('🆔 Farmer ID extracted:', farmerId);

    if (!farmerId) {
      console.error('❌ No farmer ID found in request user object');
      return res.status(400).json({
        success: false,
        message: 'Farmer ID not found in authentication token'
      });
    }

    // Convert to string for consistency
    const farmerIdStr = farmerId.toString();
    console.log('🆔 Farmer ID as string:', farmerIdStr);

    // FIXED: Search using the correct field name from your database schema
    console.log('🔍 Searching for products with farmer_id field...');
    
    const totalProducts = await Product.countDocuments({ 
      farmer_id: farmerIdStr  // Use farmer_id (with underscore) as shown in your data
    });
    
    console.log('📦 Total products found:', totalProducts);

    // Debug: Check what products exist in the database
    const allProducts = await Product.find({}).select('farmer_id name').limit(5);
    console.log('🔍 Sample products in database:', allProducts);

    // Find farmer's products for orders calculation
    const farmerProducts = await Product.find({ 
      farmer_id: farmerIdStr  // Use farmer_id (with underscore)
    }).select('_id name');
    
    console.log('🛒 Farmer products found:', farmerProducts.length);
    console.log('🛒 Farmer products details:', farmerProducts);

    // Get orders statistics
    let pendingOrders = 0;
    let completedOrders = 0;
    let totalRevenue = 0;
    let activeOrders = 0;

    if (farmerProducts.length > 0) {
      const productIds = farmerProducts.map(p => p._id);
      console.log('🆔 Product IDs for order search:', productIds);

      try {
        // Count pending orders
        pendingOrders = await Order.countDocuments({
          'items.productId': { $in: productIds },
          status: { $in: ['pending', 'processing'] }
        });

        // Count active orders
        activeOrders = await Order.countDocuments({
          'items.productId': { $in: productIds },
          status: { $in: ['pending', 'processing', 'shipped'] }
        });

        // Count completed orders
        completedOrders = await Order.countDocuments({
          'items.productId': { $in: productIds },
          status: 'delivered'
        });

        // Calculate revenue
        const revenueResult = await Order.aggregate([
          {
            $match: {
              'items.productId': { $in: productIds },
              status: 'delivered'
            }
          },
          {
            $unwind: '$items'
          },
          {
            $match: {
              'items.productId': { $in: productIds }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
            }
          }
        ]);

        totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
        
        console.log('📊 Orders stats:', { pendingOrders, activeOrders, completedOrders, totalRevenue });
      } catch (orderError) {
        console.log('⚠️ Error calculating order statistics:', orderError.message);
      }
    } else {
      console.log('⚠️ No products found for farmer, skipping order calculations');
    }

    // Get verification status - also check if you're using farmer_id or farmerId in FarmerDocument
    let verificationStatus = 'not_uploaded';
    try {
      const farmerDoc = await FarmerDocument.findOne({ 
        $or: [
          { farmerId: farmerIdStr },  // Try both formats
          { farmer_id: farmerIdStr }, // In case you're using farmer_id here too
          { userId: farmerIdStr }     // Or userId
        ]
      });
      
      console.log('📄 Farmer document found:', farmerDoc ? 'Yes' : 'No');
      
      if (farmerDoc) {
        verificationStatus = farmerDoc.verificationStatus || 'pending';
      }
    } catch (docError) {
      console.log('⚠️ Error getting verification status:', docError.message);
    }

    const stats = {
      totalProducts,
      pendingOrders,
      activeOrders,
      completedOrders,
      totalRevenue,
      verificationStatus
    };

    console.log('📈 Final farmer stats:', stats);

    res.json({
      success: true,
      stats,
      debug: {
        farmerId: farmerIdStr,
        productsFound: farmerProducts.length,
        sampleProducts: farmerProducts.slice(0, 3) // Show first 3 products for debugging
      }
    });

  } catch (error) {
    console.error('❌ Error getting farmer stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get farmer statistics',
      error: error.message
    });
  }
};

// Get farmer's products with pagination - FIXED
export const getFarmerProducts = async (req, res) => {
  try {
    console.log('📦 Getting farmer products...');
    
    const farmerId = req.user.id || req.user._id || req.user.userId;
    const farmerIdStr = farmerId.toString();
    console.log('🆔 Farmer ID for products:', farmerIdStr);
    
    const { page = 1, limit = 10, search, category, status = 'active' } = req.query;

    // FIXED: Use farmer_id (with underscore)
    let query = { 
      farmer_id: farmerIdStr  // Use the correct field name
    };

    // Add search functionality
    if (search) {
      query.$and = [
        { farmer_id: farmerIdStr }, // Keep farmer filter
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Add status filter if your Product model has a status field
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('farmer_id', 'name email');  // Populate farmer_id field

    const total = await Product.countDocuments(query);

    console.log('📦 Products found:', products.length, 'Total:', total);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + products.length < total
      }
    });
  } catch (error) {
    console.error('❌ Error getting farmer products:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get products',
      error: error.message 
    });
  }
};

// Get farmer's pending orders - FIXED
export const getFarmerPendingOrders = async (req, res) => {
  try {
    console.log('📋 Getting farmer pending orders...');
    
    const farmerId = req.user.id || req.user._id || req.user.userId;
    const farmerIdStr = farmerId.toString();
    const { page = 1, limit = 10 } = req.query;

    // FIXED: Get products using farmer_id field
    const farmerProducts = await Product.find({ 
      farmer_id: farmerIdStr  // Use correct field name
    }).select('_id name');
    
    const productIds = farmerProducts.map(p => p._id);
    console.log('🛒 Found farmer products:', farmerProducts.length);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        orders: [],
        pagination: {
          total: 0,
          currentPage: 1,
          totalPages: 0,
          hasMore: false
        }
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders containing farmer's products with pending status
    const orders = await Order.find({
      'items.productId': { $in: productIds },
      status: { $in: ['pending', 'processing'] }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('consumerId', 'name email phone')
    .populate('items.productId', 'name price category')
    .lean();

    const total = await Order.countDocuments({
      'items.productId': { $in: productIds },
      status: { $in: ['pending', 'processing'] }
    });

    // Filter items to only include farmer's products and calculate totals
    const processedOrders = orders.map(order => {
      const farmerItems = order.items.filter(item => 
        productIds.some(pid => pid.toString() === item.productId._id.toString())
      );
      
      const orderTotal = farmerItems.reduce((sum, item) => 
        sum + (item.quantity * item.price), 0
      );

      return {
        ...order,
        items: farmerItems,
        farmerTotal: orderTotal,
        itemCount: farmerItems.reduce((sum, item) => sum + item.quantity, 0)
      };
    });

    res.json({
      success: true,
      orders: processedOrders,
      pagination: {
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + orders.length < total
      }
    });
  } catch (error) {
    console.error('❌ Error getting farmer pending orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get pending orders',
      error: error.message 
    });
  }
};

// Get all farmer's orders - FIXED
export const getFarmerOrders = async (req, res) => {
  try {
    console.log('📋 Getting all farmer orders...');
    
    const farmerId = req.user.id || req.user._id || req.user.userId;
    const farmerIdStr = farmerId.toString();
    const { page = 1, limit = 10, status, search } = req.query;

    // FIXED: Get products using farmer_id field
    const farmerProducts = await Product.find({ 
      farmer_id: farmerIdStr  // Use correct field name
    }).select('_id name');
    
    const productIds = farmerProducts.map(p => p._id);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        orders: [],
        pagination: {
          total: 0,
          currentPage: 1,
          totalPages: 0,
          hasMore: false
        }
      });
    }

    let query = {
      'items.productId': { $in: productIds }
    };

    // Add status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('consumerId', 'name email phone')
      .populate('items.productId', 'name price category')
      .lean();

    const total = await Order.countDocuments(query);

    // Filter items to only include farmer's products
    const processedOrders = orders.map(order => {
      const farmerItems = order.items.filter(item => 
        productIds.some(pid => pid.toString() === item.productId._id.toString())
      );
      
      const orderTotal = farmerItems.reduce((sum, item) => 
        sum + (item.quantity * item.price), 0
      );

      return {
        ...order,
        items: farmerItems,
        farmerTotal: orderTotal,
        itemCount: farmerItems.reduce((sum, item) => sum + item.quantity, 0)
      };
    });

    res.json({
      success: true,
      orders: processedOrders,
      pagination: {
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + orders.length < total
      }
    });
  } catch (error) {
    console.error('❌ Error getting farmer orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get orders',
      error: error.message 
    });
  }
};

// Update order status - FIXED
export const updateOrderStatus = async (req, res) => {
  try {
    console.log('🔄 Updating order status...');
    
    const farmerId = req.user.id || req.user._id || req.user.userId;
    const farmerIdStr = farmerId.toString();
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const allowedStatuses = ['processing', 'shipped', 'delivered'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed: processing, shipped, delivered'
      });
    }

    // FIXED: Get farmer's products using farmer_id field
    const farmerProducts = await Product.find({ 
      farmer_id: farmerIdStr  // Use correct field name
    }).select('_id');
    
    const productIds = farmerProducts.map(p => p._id);

    // Check if order contains farmer's products
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const hasFarmerProducts = order.items.some(item => 
      productIds.some(pid => pid.toString() === item.productId.toString())
    );

    if (!hasFarmerProducts) {
      return res.status(403).json({
        success: false,
        message: 'You can only update orders containing your products'
      });
    }

    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('consumerId', 'name email')
     .populate('items.productId', 'name price');

    console.log('✅ Order status updated:', updatedOrder._id, status);

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update order status',
      error: error.message 
    });
  }
};

// Get farmer profile - keep existing logic
export const getFarmerProfile = async (req, res) => {
  try {
    console.log('👤 Getting farmer profile...');
    
    const farmerId = req.user.id || req.user._id || req.user.userId;

    const farmer = await User.findById(farmerId).select('-password');
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }

    // Get verification status
    const farmerDoc = await FarmerDocument.findOne({ 
      $or: [
        { farmerId: farmerId.toString() },
        { farmer_id: farmerId.toString() },
        { userId: farmerId.toString() }
      ]
    });

    res.json({
      success: true,
      farmer: {
        ...farmer.toObject(),
        verificationStatus: farmerDoc ? farmerDoc.verificationStatus : 'not_uploaded',
        documentUploaded: !!farmerDoc,
        certificateId: farmerDoc?.certificateId || null,
        verificationDate: farmerDoc?.verificationDate || null
      }
    });
  } catch (error) {
    console.error('❌ Error getting farmer profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get profile',
      error: error.message 
    });
  }
};