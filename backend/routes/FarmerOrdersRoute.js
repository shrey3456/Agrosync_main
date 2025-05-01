import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import Order from '../models/order.js';
import Product from '../models/Product.js';
import { orderController} from '../controllers/orderController.js';

const router = express.Router();

// Get all orders containing products from this farmer
router.get('/orders', authenticate, orderController.getFarmerOrders);

// Get recent orders for this farmer
router.get('/recent', authenticate, orderController.getRecentOrders);

// Get order details for a specific order
router.get('/orders/:orderId', authenticate, orderController.getOrderDetails);

export { router as FarmerOrdersRoutes };