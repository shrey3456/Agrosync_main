import express from 'express';
import Order from '../models/order.js';
import Product from '../models/Product.js';
import { orderController} from '../controllers/orderController.js';
import { authenticate, restrictTo } from '../middlewares/authMiddleware.js';
import {
  getFarmerStats,
 
} from '../controllers/farmerController.js';

const router = express.Router();

// Get all orders containing products from this farmer
router.use(authenticate);
router.use(restrictTo('farmer'));
router.get('/stats', getFarmerStats);

router.get('/orders', authenticate, orderController.getFarmerOrders);

// Get recent orders for this farmer
router.get('/recent', authenticate, orderController.getRecentOrders);

// Get order details for a specific order
router.get('/orders/:orderId', authenticate, orderController.getOrderDetails);

export { router as FarmerOrdersRoutes };