import express from 'express';
import { authenticate, restrictTo } from '../middlewares/authMiddleware.js';
import {
  getAdminStats,
  getAllFarmers,
  getAllConsumers,
  getConsumerOrders,
  updateOrderStatus,
  getAllOrders, 
  getOrderFilters
} from '../controllers/adminController.js';
import { getProductbyId } from '../controllers/productController.js';
import mongoose from 'mongoose';

const router = express.Router();

// Dashboard Statistics Route - USE PROPER MIDDLEWARE CHAIN
router.get('/stats', authenticate, restrictTo('admin'), getAdminStats);
router.get('/farmers', authenticate, restrictTo('admin'), getAllFarmers);
router.get('/farmers/:farmer_id', authenticate, restrictTo('admin'), getProductbyId);
router.get('/consumers', authenticate, restrictTo('admin'), getAllConsumers);
router.get('/consumers/:consumer_id/orders', authenticate, restrictTo('admin'), getConsumerOrders); 
router.get('/orders', authenticate, restrictTo('admin'), getAllOrders);
router.get('/orders/filters', authenticate, restrictTo('admin'), getOrderFilters);
router.put('/orders/:order_id/status', authenticate, restrictTo('admin'), updateOrderStatus);

// FIXED: Use default export
export default router;