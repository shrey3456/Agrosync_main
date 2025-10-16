import mongoose from 'mongoose';

// Cart item schema - references your existing Product schema
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // Store additional product details for quick access
  product_details: {
    name: String,
    description: String,
    category: String,
    price: Number,
    image_url: String,
    unit: String
  },
  // Store farmer details for this specific product
  farmer_details: {
    farmer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    location: String,
    contact: String
  },
  // Store traceability info from the product
  traceability: {
    harvest_method: String,
    harvest_date: Date
  },
  // Quantity of this item in cart
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  // Timestamp for tracking when added
  added_at: {
    type: Date,
    default: Date.now
  }
});

// Main cart schema
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  // Track cart total
  total: {
    type: Number,
    default: 0
  },
  // Optional coupon applied
  coupon_code: {
    type: String
  },
  discount_amount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate total
cartSchema.pre('save', function(next) {
  // Calculate total price of items in cart
  if (this.items && this.items.length > 0) {
    this.total = this.items.reduce((sum, item) => {
      return sum + (item.product_details.price * item.quantity);
    }, 0);
  } else {
    this.total = 0;
  }
  next();
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;