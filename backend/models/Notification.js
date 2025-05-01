import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    enum: ['farmer', 'consumer'],
    required: true
  },
  type: {
    type: String,
    enum: [
      'new_order',
      'order_received',
      'order_processing',
      'order_shipped',
      'order_delivered',
      'order_cancelled'
    ],
    required: true
  },
  message: String,
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);