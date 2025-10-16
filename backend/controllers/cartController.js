import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/user.js';
import mongoose from 'mongoose';

// Get current user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find cart or create if it doesn't exist
    let cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'available_quantity')
      .populate('items.farmer_details.farmer_id', 'name email');
    
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: []
      });
      await cart.save();
    }
    
    // Check for any stock issues (item quantity > available)
    const stockIssues = [];
    cart.items.forEach(item => {
      if (item.product && item.quantity > item.product.available_quantity) {
        stockIssues.push({
          product_id: item.product._id,
          name: item.product_details.name,
          requested: item.quantity,
          available: item.product.available_quantity
        });
      }
    });
    
    res.status(200).json({
      success: true,
      cart,
      stockIssues: stockIssues.length > 0 ? stockIssues : null
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Error fetching cart', error: error.message });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }
    
    // Find the product with farmer details
    const product = await Product.findById(productId)
      .populate('farmer_id', 'name email location phone');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Check if there's enough quantity available
    if (product.available_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.available_quantity} ${product.unit} available`
      });
    }
    
    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: []
      });
    }
    
    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId &&
      item.farmer_details.farmer_id.toString() === product.farmer_id._id.toString()
    );
    
    if (existingItemIndex > -1) {
      // Update quantity if product already in cart
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // Verify stock availability for combined quantity
      if (newQuantity > product.available_quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${quantity} more. Only ${product.available_quantity} ${product.unit} available in total.`
        });
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Create new cart item
      const cartItem = {
        product: product._id,
        product_details: {
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          image_url: product.image_url,
          unit: product.unit
        },
        farmer_details: {
          farmer_id: product.farmer_id._id,
          name: product.farmer_id.name,
          location: product.farmer_id.location || 'Not specified',
          contact: product.farmer_id.phone || product.farmer_id.email || 'Not available'
        },
        traceability: {
          harvest_method: product.traceability?.harvest_method || 'Not specified',
          harvest_date: product.traceability?.harvest_date
        },
        quantity: quantity,
        added_at: new Date()
      };
      
      // Add to cart items
      cart.items.push(cartItem);
    }
    
    // Save cart
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      cart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Error adding to cart', error: error.message });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, quantity } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }
    
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }
    
    // Find cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    // Find the item in cart
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
    
    // Check product availability
    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product no longer exists' });
    }
    
    // Verify stock
    if (quantity > product.available_quantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity exceeds available stock. Only ${product.available_quantity} ${product.unit} available.`
      });
    }
    
    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ success: false, message: 'Error updating cart', error: error.message });
  }
};

// Remove item from cart
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }
    
    // Find cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    // Remove item
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Error removing item', error: error.message });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    // Clear items
    cart.items = [];
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Error clearing cart', error: error.message });
  }
};

// Apply coupon to cart
export const applyCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const { couponCode } = req.body;
    
    if (!couponCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }
    
    // Find cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    // Validate coupon (simplified - in real app, you'd check against a Coupon model)
    let discountPercent = 0;
    
    if (couponCode.toLowerCase() === 'discount10') {
      discountPercent = 10;
    } else if (couponCode.toLowerCase() === 'welcome') {
      discountPercent = 15;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid coupon code' });
    }
    
    // Calculate discount amount
    const discountAmount = (cart.total * discountPercent) / 100;
    
    // Apply coupon
    cart.coupon_code = couponCode;
    cart.discount_amount = discountAmount;
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      cart
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ success: false, message: 'Error applying coupon', error: error.message });
  }
};

// Get cart count
export const getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.items) {
      return res.status(200).json({ success: true, count: 0 });
    }
    
    // Calculate total items count
    const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    
    res.status(200).json({
      success: true,
      count: itemCount
    });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({ success: false, message: 'Error getting cart count', error: error.message });
  }
};