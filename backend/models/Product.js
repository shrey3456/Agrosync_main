import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  available_quantity: {
    type: Number,
    required: [true, 'Available quantity is required'],
    min: 0
  },
  unit: {
    type: String,
    default: 'kg',
    enum: ['kg', 'g', 'lb', 'pieces', 'bunches', 'liters', 'ml', 'units']
  },
  image_url: {
    type: String,
    default: ''
  },
  image_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  traceability: {
    harvest_method: {
      type: String,
      default: 'Organic'
    },
    harvest_date: {
      type: Date,
      get: function(date) {
        return date ? date.toISOString().split('T')[0] : null;
      }
    }
  },
  farmer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { getters: true }
});

const Product = mongoose.model('Product', productSchema);
export default Product;