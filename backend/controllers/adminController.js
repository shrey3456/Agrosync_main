import User from '../models/user.js';
import Product from '../models/Product.js';
import Order from '../models/order.js';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

// Get admin dashboard statistics
export const getAdminStats = async (req, res) => {
  try {
    console.log('📊 Getting admin stats...');
    console.log('User requesting stats:', req.user);

    // Get counts from database
    const totalProducts = await Product.countDocuments();
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const totalConsumers = await User.countDocuments({ role: 'consumer' });
    
    // Get order statistics if Order model exists
    let totalOrders = 0;
    let activeOrders = 0;
    let completedOrders = 0;
    let totalRevenue = 0;

    try {
      totalOrders = await Order.countDocuments();
      activeOrders = await Order.countDocuments({ 
        status: { $in: ['pending', 'processing', 'shipped'] } 
      });
      completedOrders = await Order.countDocuments({ status: 'delivered' });
      
      // Calculate total revenue
      const revenueResult = await Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    } catch (orderError) {
      console.log('⚠️ Order statistics not available:', orderError.message);
    }

    const stats = {
      totalProducts,
      totalFarmers,
      totalConsumers,
      totalOrders,
      activeOrders,
      completedOrders,
      totalRevenue
    };

    console.log('📈 Stats calculated:', stats);

    // Return in the format expected by frontend
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error getting admin stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get admin statistics',
      error: error.message 
    });
  }
};
export const getAllFarmers = async (req, res) => {
    try {
        console.log('Fetching farmers with product counts...');
        
        const farmers = await User.aggregate([
            { 
                $match: { role: 'farmer' } 
            },
            {
                $lookup: {
                    from: 'products',  // Make sure this matches your products collection name
                    localField: '_id',
                    foreignField: 'farmer_id',
                    as: 'products'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    phoneNumber: 1,
                    location: 1,
                    totalProducts: { $size: '$products' }
                }
            }
        ]);

        // Add logging to debug
        console.log('Farmers with product counts:', farmers.map(f => ({
            name: f.name,
            totalProducts: f.totalProducts
        })));

        res.status(200).json({
            success: true,
            count: farmers.length,
            farmers
        });
    } catch (error) {
        console.error('Error in getAllFarmers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching farmers'
        });
    }
};
export const getAllConsumers = async (req, res) => {
    try {
        const consumers = await User.aggregate([
            { 
                $match: { role: 'consumer' } 
            },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'orders'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    phoneNumber: 1,
                    location: 1,
                    totalOrders: { $size: '$orders' }
                }
            }

        ]);

        res.status(200).json({
            success: true,
            count: consumers.length,
            consumers
        });
        console.log('Consumers with order counts:', consumers.map(c => ({
            name: c.name,
            totalOrders: c.totalOrders
        })));
        console.log('Consumers:', consumers);
    } catch (error) {
        console.error('Error in getAllConsumers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching consumers'
        });
    }
};
export const getConsumerOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 3; // Orders per page
        const skip = (page - 1) * limit;

        // Get total orders count
        const totalOrders = await Order.countDocuments({ 
            user: req.params.consumer_id 
        });

        const orders = await Order.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.params.consumer_id)
                }
            },
            {
                $sort: { createdAt: -1 } // Sort by newest first
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $addFields: {
                    products: {
                        $map: {
                            input: '$products',
                            as: 'prod',
                            in: {
                                _id: '$$prod.product',
                                quantity: '$$prod.quantity',
                                price: '$$prod.price',
                                name: {
                                    $let: {
                                        vars: {
                                            productDetail: {
                                                $arrayElemAt: [
                                                    '$productDetails',
                                                    {
                                                        $indexOfArray: [
                                                            '$productDetails._id',
                                                            '$$prod.product'
                                                        ]
                                                    }
                                                ]
                                            }
                                        },
                                        in: '$$productDetail.name'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]);

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
        console.error('Error in getConsumerOrders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching consumer orders'
        });
    }
};
export const updateOrderStatus = async (req, res) => {
    try {
        const { order_id } = req.params;
        const { status } = req.body;
        const userRole = req.user.role;

        // First check if order exists and get its current status
        const orderToUpdate = await Order.findById(order_id)
            .populate('items.product')
            .populate('user', 'name email');

        if (!orderToUpdate) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // If order is already cancelled, prevent any status changes
        if (orderToUpdate.orderStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update cancelled order status'
            });
        }

        // Define allowed status transitions based on user role
        const adminAllowedStatuses = ['processing', 'shipped', 'delivered'];
        const consumerAllowedStatuses = ['cancelled'];

        // Check permissions based on role
        if (userRole === 'admin') {
            if (!adminAllowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order status. Admin can only mark orders as processing, shipped, or delivered'
                });
            }

            // Handle quantity update when shipping
            if (status === 'shipped') {
                try {
                    for (const item of orderToUpdate.items) {
                        const product = await Product.findById(item.product);
                        if (!product) {
                            throw new Error(`Product ${item.name} not found`);
                        }

                        if (product.available_quantity < item.quantity) {
                            throw new Error(`Insufficient quantity for product ${item.name}`);
                        }

                        // Decrease the available quantity
                        product.available_quantity -= item.quantity;
                        await product.save();
                        console.log(`Updated quantity for product ${product.name}: ${product.available_quantity}`);
                    }
                } catch (quantityError) {
                    return res.status(400).json({
                        success: false,
                        message: quantityError.message
                    });
                }
            }
        } else if (userRole === 'consumer') {
            if (!consumerAllowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Consumers can only cancel orders'
                });
            }

            // Check if order belongs to the requesting user
            if (orderToUpdate.user._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this order'
                });
            }

            // Check if order can be cancelled (not delivered)
            if (orderToUpdate.orderStatus === 'delivered') {
                return res.status(400).json({
                    success: false,
                    message: 'Delivered orders cannot be cancelled'
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update order status'
            });
        }

        // Update the order status
        const updatedOrder = await Order.findByIdAndUpdate(
            order_id,
            { 
                orderStatus: status,
                updatedAt: Date.now()
            },
            { new: true }
        ).populate('user', 'name email')
         .populate('items.farmer_id', 'name email');

        // Create notifications
        try {
            // Notification for consumer
            await Notification.create({
                userId: updatedOrder.user._id,
                userRole: 'consumer',
                type: `order_${status}`,
                orderId: order_id,
                message: getConsumerNotificationMessage(status, updatedOrder.orderNumber),
                read: false
            });

            // Notifications for farmers
            const uniqueFarmerIds = [...new Set(updatedOrder.items.map(item => 
                item.farmer_id?._id?.toString()
            ))].filter(Boolean);

            for (const farmerId of uniqueFarmerIds) {
                await Notification.create({
                    userId: farmerId,
                    userRole: 'farmer',
                    type: `order_${status}`,
                    orderId: order_id,
                    message: getFarmerNotificationMessage(status, updatedOrder.orderNumber),
                    read: false
                });
            }
        } catch (notificationError) {
            console.error('Error creating notifications:', notificationError);
            // Continue execution even if notification creation fails
        }

        res.status(200).json({
            success: true,
            message: `Order ${status === 'cancelled' ? 'cancelled' : 'updated'} successfully`,
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating order status'
        });
    }
};

// Helper functions for notification messages
const getConsumerNotificationMessage = (status, orderNumber) => {
    switch (status) {
        case 'processing':
            return `Your order #${orderNumber} is now being processed`;
        case 'shipped':
            return `Your order #${orderNumber} has been shipped`;
        case 'delivered':
            return `Your order #${orderNumber} has been delivered successfully`;
        case 'cancelled':
            return `Your order #${orderNumber} has been cancelled`;
        default:
            return `Your order #${orderNumber} status has been updated to ${status}`;
    }
};

const getFarmerNotificationMessage = (status, orderNumber) => {
    switch (status) {
        case 'processing':
            return `Order #${orderNumber} is now being processed`;
        case 'shipped':
            return `Order #${orderNumber} has been shipped to the customer`;
        case 'delivered':
            return `Order #${orderNumber} has been delivered to the customer`;
        case 'cancelled':
            return `Order #${orderNumber} has been cancelled`;
        default:
            return `Order #${orderNumber} status has been updated to ${status}`;
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // 10 orders per page
        const skip = (page - 1) * limit;

        // Build filter query
        let filterQuery = {};

        // Order status filter
        if (req.query.status) {
            filterQuery.orderStatus = req.query.status;
        }

        // Payment status filter
        if (req.query.paymentStatus) {
            filterQuery.paymentStatus = req.query.paymentStatus;
        }

        // Payment method filter
        if (req.query.paymentMethod) {
            filterQuery.paymentMethod = req.query.paymentMethod;
        }

        // Date range filter
        if (req.query.startDate && req.query.endDate) {
            filterQuery.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        // Get total count for pagination
        const totalOrders = await Order.countDocuments(filterQuery);

        // Fetch filtered orders
        const orders = await Order.find(filterQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'items.product',
                select: 'name price category farmer_details'
            })
            .populate({
                path: 'user',
                select: 'name email'
            });

        res.status(200).json({
            success: true,
            orders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders,
                hasNextPage: skip + limit < totalOrders,
                hasPrevPage: page > 1
            },
            filters: {
                status: req.query.status || 'all',
                paymentStatus: req.query.paymentStatus || 'all',
                paymentMethod: req.query.paymentMethod || 'all',
                dateRange: {
                    start: req.query.startDate,
                    end: req.query.endDate
                }
            }
        });

    } catch (error) {
        console.error('Error in getAllOrders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Add a new route to get filter options
export const getOrderFilters = async (req, res) => {
    try {
        const orderStatuses = ['processing', 'shipped', 'delivered'];
        const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        const paymentMethods = ['cod', 'razorpay'];

        // Get unique values from the database
        const uniqueStats = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' },
                    // Add any other statistics you want to track
                }
            }
        ]);

        res.status(200).json({
            success: true,
            filters: {
                orderStatuses,
                paymentStatuses,
                paymentMethods
            },
            statistics: uniqueStats[0] || {
                totalOrders: 0,
                totalAmount: 0
            }
        });

    } catch (error) {
        console.error('Error in getOrderFilters:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching filter options'
        });
    }
};