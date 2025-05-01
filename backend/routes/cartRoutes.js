import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  getCartCount
} from '../controllers/cartController.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// Get user's cart
router.get('/', getCart);

// Add item to cart
router.post('/add', addToCart);

// Update cart item quantity
router.put('/update', updateCartItem);

// Remove item from cart
router.delete('/remove/:itemId', removeCartItem);

// Clear entire cart
router.delete('/clear', clearCart);

// Apply coupon to cart
router.post('/coupon', applyCoupon);

// Get cart item count
router.get('/count', getCartCount);

export default router;