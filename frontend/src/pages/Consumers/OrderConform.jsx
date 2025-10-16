import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCheck,
  FiPackage,
  FiTruck,
  FiCreditCard,
  FiMapPin,
  FiCalendar,
  FiShoppingBag,
  FiHome,
  FiDownload,
  FiClock,
} from "react-icons/fi";

const OrderConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || {};

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // If no order data is passed, redirect to homepage
  React.useEffect(() => {
    if (!order) {
      navigate("/consumer");
    }
  }, [order, navigate]);

  if (!order) {
    return null;
  }

  // Format date with fallback
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  // Format time with fallback
  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const options = { hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleTimeString(undefined, options);
    } catch (error) {
      console.error("Time formatting error:", error);
      return "N/A";
    }
  };

  // Get order date (with fallbacks)
  const orderDate = order.createdAt || order.orderDate || new Date().toISOString();
  
  // Get delivery estimate from order or calculate (5 days from order date)
  const deliveryDate = order.deliveryEstimate 
    ? new Date(order.deliveryEstimate)
    : (() => {
        const date = new Date(orderDate);
        date.setDate(date.getDate() + 5);
        return date;
      })();

  return (
    <div className="pb-16 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Success message */}
        <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-6 mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-8 h-8 text-teal-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
          <p className="text-gray-400">
            Thank you for your order. {order.paymentMethod === "razorpay" 
              ? "We've received your payment and will process your order soon." 
              : "Your order has been placed successfully and will be processed soon."}
          </p>
        </div>

        {/* Order details */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-green-200/20 dark:border-teal-800/20 overflow-hidden mb-6">
          <div className="p-6 border-b border-green-200/20 dark:border-teal-800/20 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FiPackage className="w-5 h-5 text-teal-400" />
              <h2 className="text-xl font-semibold text-white">Order Details</h2>
            </div>
            <span className="text-teal-400 font-medium">#{order.order_id || order.orderId || "New Order"}</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row justify-between text-sm">
              <div className="mb-4 md:mb-0">
                <div className="text-gray-400 mb-1">Order Date</div>
                <div className="flex items-center text-white">
                  <FiCalendar className="w-4 h-4 mr-2 text-teal-400" />
                  {formatDate(orderDate)} at {formatTime(orderDate)}
                </div>
              </div>
              
              <div className="mb-4 md:mb-0">
                <div className="text-gray-400 mb-1">Payment Method</div>
                <div className="flex items-center text-white">
                  <FiCreditCard className="w-4 h-4 mr-2 text-teal-400" />
                  {order.paymentMethod === "razorpay" ? "Online Payment (Razorpay)" : "Cash on Delivery"}
                </div>
              </div>
              
              <div>
                <div className="text-gray-400 mb-1">Estimated Delivery</div>
                <div className="flex items-center text-white">
                  <FiTruck className="w-4 h-4 mr-2 text-teal-400" />
                  {formatDate(deliveryDate)}
                </div>
              </div>
            </div>

            <div className="border-t border-green-200/10 dark:border-teal-800/10 pt-4 mt-4">
              <h3 className="font-medium text-white mb-3">Order Items</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {order.items.map((item, index) => (
                  <div key={item._id || index} className="flex items-center">
                    <div className="h-12 w-12 bg-white/10 rounded overflow-hidden flex-shrink-0 mr-3">
                      {item.image_url && (
                        <img
                          src={item.image_url.startsWith("http") 
                            ? item.image_url 
                            : `${API_BASE_URL}${item.image_url}`}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => { e.target.src = "https://via.placeholder.com/80?text=No+Image"; }}
                        />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <span className="text-white">{item.name}</span>
                        <span className="text-teal-400 font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <div className="text-gray-400 text-xs">
                        Quantity: {item.quantity} × ₹{item.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-green-200/20 dark:border-teal-800/20 overflow-hidden">
            <div className="p-4 border-b border-green-200/20 dark:border-teal-800/20 flex items-center space-x-2">
              <FiMapPin className="w-4 h-4 text-teal-400" />
              <h3 className="font-medium text-white">Shipping Address</h3>
            </div>
            <div className="p-4">
              <p className="text-white font-medium mb-1">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p className="text-gray-400 text-sm whitespace-pre-line">
                {order.shippingAddress.address}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
                {order.shippingAddress.country}<br />
                <span className="text-teal-400">Phone:</span> {order.shippingAddress.phone}
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-green-200/20 dark:border-teal-800/20 overflow-hidden">
            <div className="p-4 border-b border-green-200/20 dark:border-teal-800/20 flex items-center space-x-2">
              <FiCreditCard className="w-4 h-4 text-teal-400" />
              <h3 className="font-medium text-white">Payment Information</h3>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center text-gray-400 text-sm mb-2">
                <span>Subtotal</span>
                <span className="text-white">₹{order.subtotal?.toFixed(2) || (order.totalAmount * 0.95).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 text-sm mb-2">
                <span>Tax (5%)</span>
                <span className="text-white">₹{order.taxAmount?.toFixed(2) || (order.totalAmount * 0.05).toFixed(2)}</span>
              </div>
              {order.shippingFee > 0 && (
                <div className="flex justify-between items-center text-gray-400 text-sm mb-2">
                  <span>Shipping Fee</span>
                  <span className="text-white">₹{order.shippingFee.toFixed(2)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between items-center text-teal-400 text-sm mb-2">
                  <span>Discount</span>
                  <span>-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-white font-medium pt-2 border-t border-green-200/10 dark:border-teal-800/10">
                <span>Total</span>
                <span className="text-teal-400">₹{order.totalAmount.toFixed(2)}</span>
              </div>
              
              {order.paymentMethod === "razorpay" && (order.paymentId || (order.paymentDetails && order.paymentDetails.razorpay_payment_id)) && (
                <div className="mt-3 pt-3 border-t border-green-200/10 dark:border-teal-800/10 text-xs text-gray-400">
                  <p><span className="text-teal-400">Transaction ID:</span> {order.paymentId || order.paymentDetails.razorpay_payment_id}</p>
                  <p><span className="text-teal-400">Status:</span> Paid</p>
                </div>
              )}

              {order.paymentMethod === "cod" && (
                <div className="mt-3 pt-3 border-t border-green-200/10 dark:border-teal-800/10 text-xs text-gray-400">
                  <p><span className="text-teal-400">Status:</span> Payment due on delivery</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
          <Link
            to="/consumer/track-orders"
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg flex items-center justify-center"
          >
            <FiClock className="mr-2" />
            Track Your Order
          </Link>
          
          <Link
            to="/consumer"
            className="bg-teal-900/50 hover:bg-teal-900 text-white px-6 py-3 rounded-lg flex items-center justify-center"
          >
            <FiHome className="mr-2" />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.print()}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center justify-center"
          >
            <FiDownload className="mr-2" />
            Print Receipt
          </button>
        </div>

        <div className="text-center text-gray-400 text-sm">
          <p>Any questions about your order? <a href="mailto:support@agrosync.com" className="text-teal-400 hover:underline">Contact our support team</a></p>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderConfirmationPage;