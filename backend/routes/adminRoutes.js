import express from 'express';
import {adminAuth} from '../middlewares/adminAuth.js';
import {getAdminStats,getAllFarmers,getAllConsumers,getConsumerOrders,updateOrderStatus,getAllOrders, getOrderFilters} from '../controllers/adminController.js';
import {getProductbyId} from '../controllers/productController.js';
import mongoose from 'mongoose';

const router = express.Router();

// Dashboard Statistics Route
router.get('/stats', adminAuth, getAdminStats);
router.get('/farmers', adminAuth, getAllFarmers);
router.get('/farmers/:farmer_id', adminAuth, getProductbyId);
router.get('/consumers', adminAuth, getAllConsumers);
router.get('/consumers/:consumer_id/orders', adminAuth, getConsumerOrders); 
router.get('/orders', adminAuth, getAllOrders);
router.get('/orders/filters', adminAuth, getOrderFilters); // New route for getting filter options
router.put('/orders/:order_id/status', adminAuth, updateOrderStatus);



export const adminRoutes = router;