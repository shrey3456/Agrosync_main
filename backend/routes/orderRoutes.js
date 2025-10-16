import express from 'express';
import { orderController } from '../controllers/orderController.js';
import { authenticate as protect } from '../middlewares/authMiddleware.js';
import Order from '../models/order.js';

const router = express.Router();

// Public routes - none

// Protected routes - require authentication
router.route('/create-razorpay-order')
  .post(protect, orderController.createRazorpayOrder);

router.route('/create')
  .post(protect, orderController.createOrder);

router.route('/verify-payment')
  .post(protect, orderController.verifyPayment);

// Move stats route BEFORE the :id route to prevent parameter confusion
router.get('/stats', protect, orderController.getOrderStats);

router.route('/my-orders')
  .get(protect, orderController.getMyOrders);

router.get('/recent', protect, orderController.getRecentOrders);

router.route('/:id')
  .get(protect, orderController.getOrderDetails);

router.route('/:id/cancel')
  .put(protect, orderController.cancelOrder);



export { router as orderRoutes };