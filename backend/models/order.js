import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestId: {
    type: String,
    sparse: true,
    index: true
  },
  // Add order_id to schema definition (it was missing)
  order_id: {
    type: String,
    unique: true,
    sparse: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    farmer_id: {  // Add this field
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    image_url: String,
    category: String,
    farmer_details: {
      name: String,
      location: String,
      contact: String,
      rating: Number
    },
    traceability: {
      farm_location: String,
      harvest_date: Date,
      harvest_method: String,
      certified_by: String
    }
  }],
    orderNumber: {
    type: String,
    unique: true,
    sparse: true // Allow null values without violating uniqueness
  },
  shippingAddress: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  subtotal: {
    type: Number,
    required: true
  },
  shippingFee: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  couponCode: String,
  paymentMethod: {
    type: String,
    enum: ['cod', 'razorpay'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['created', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'created'
  },
  orderNumber: {
    type: String,
    unique: true
  },
  paymentDetails: {
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String
  },
  deliveryEstimate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'cancelled', 'out_for_delivery', 'delivered'],
    default: 'pending'
  },
  cancellationReason: {
    type: String,
    default: null
  },
  cancelledBy: {
    type: String,
    enum: ['farmer', 'consumer', null],
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  }
});

OrderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

// Add validation for required user ID
OrderSchema.pre('validate', function(next) {
  if (!this.user) {
    next(new Error('User ID is required'));
  } else {
    next();
  }
});

// Update timestamp before saving
OrderSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // Only generate these values for new orders
  if (this.isNew) {
    // Generate order_id if not provided
    if (!this.order_id) {
      const date = new Date();
      const dateStr = date.getFullYear() +
                    String(date.getMonth() + 1).padStart(2, '0') +
                    String(date.getDate()).padStart(2, '0');
      const randomStr = Math.floor(10000 + Math.random() * 90000).toString();
      this.order_id = `ORD-${dateStr}-${randomStr}`;
    }
    
    // Generate orderNumber if not provided
    if (!this.orderNumber) {
      const year = new Date().getFullYear().toString().substr(-2);
      const random = Math.floor(100000 + Math.random() * 900000).toString();
      this.orderNumber = `ORD-${year}${random}`;
    }
    
    // Calculate delivery estimate (5 days from now) if not set
    if (!this.deliveryEstimate) {
      const estimate = new Date();
      estimate.setDate(estimate.getDate() + 5);
      this.deliveryEstimate = estimate;
    }
  }
  
  next();
});

// Generate order number before saving
OrderSchema.pre('save', function(next) {

  if (this.isNew && !this.order_id) {
    // Generate a unique order ID (format: ORD-YYYYMMDD-XXXXX)
    const date = new Date();
    const dateStr = date.getFullYear() +
                  String(date.getMonth() + 1).padStart(2, '0') +
                  String(date.getDate()).padStart(2, '0');
    const randomStr = Math.floor(10000 + Math.random() * 90000).toString();
    this.order_id = `ORD-${dateStr}-${randomStr}`;
  }
  if (!this.orderNumber) {
    // Generate order number - current year + random 6 digit number
    const year = new Date().getFullYear().toString().substr(-2);
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    this.orderNumber = `ORD-${year}${random}`;
  }
  
  // Calculate delivery estimate (5 days from now)
  if (!this.deliveryEstimate) {
    const estimate = new Date();
    estimate.setDate(estimate.getDate() + 5);
    this.deliveryEstimate = estimate;
  }
  
  next();
});

const Order = mongoose.model('Order', OrderSchema);
export default Order;