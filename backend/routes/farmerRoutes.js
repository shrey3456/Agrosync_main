import express from 'express';
import { authenticate, restrictTo } from '../middlewares/authMiddleware.js';
import {
  getFarmerStats,
  getFarmerProducts,
  getFarmerPendingOrders,
  getFarmerOrders,
  updateOrderStatus,
  getFarmerProfile
} from '../controllers/farmerController.js';

const router = express.Router();

// All routes require farmer authentication
router.use(authenticate);
router.use(restrictTo('farmer'));

// Dashboard statistics


// Products management
router.get('/products', getFarmerProducts);

// Orders management
router.get('/orders/pending', getFarmerPendingOrders);
router.get('/orders', getFarmerOrders);
router.put('/orders/:orderId/status', updateOrderStatus);

// Profile
router.get('/profile', getFarmerProfile);

export default router;