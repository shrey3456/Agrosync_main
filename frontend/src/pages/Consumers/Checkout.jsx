import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiShoppingBag,
  FiCreditCard,
  FiMapPin,
  FiTruck,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiShield,
  FiClock,
  FiInfo,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(""); // cod or razorpay
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Form data for shipping address
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    saveAddress: false,
  });

  // Validation states
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  // API URL - Using Vite environment variables
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Load checkout data from localStorage
  useEffect(() => {
    try {
      const savedCheckout = localStorage.getItem("checkout");
      if (savedCheckout) {
        const checkoutInfo = JSON.parse(savedCheckout);
        setCheckoutData(checkoutInfo);

        // Try to load saved address if available
        const savedAddress = localStorage.getItem("savedAddress");
        if (savedAddress) {
          setFormData({ ...formData, ...JSON.parse(savedAddress) });
        }
      } else {
        setError("No checkout information found");
        setTimeout(() => {
          navigate("/consumer/cart");
        }, 2000);
      }
    } catch (error) {
      console.error("Error loading checkout data:", error);
      setError("Failed to load checkout information");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Handle form field change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear error when field is changed
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    // Basic validations
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Email is invalid";

    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone))
      errors.phone = "Phone must be 10 digits";

    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.city.trim()) errors.city = "City is required";
    if (!formData.state.trim()) errors.state = "State is required";
    if (!formData.pincode.trim()) errors.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(formData.pincode))
      errors.pincode = "Pincode must be 6 digits";

    if (!paymentMethod) errors.paymentMethod = "Please select a payment method";

    return errors;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      // If form is valid, process the order
      processOrder();
    } else {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(
        `[name="${firstErrorField}"]`
      );
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      // Parse JWT token payload
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      const payload = JSON.parse(jsonPayload);
      return payload.id || payload._id || payload.userId;
    } catch (error) {
      console.error("Error extracting user ID from token:", error);
      return null;
    }
  };

  // Process order based on payment method
  const processOrder = async () => {
    setIsProcessing(true);
    try {
      // Generate a request ID to ensure idempotency
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Get token and authenticate
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }
      
      // Get user ID from token
      const userId = getUserIdFromToken();
      if (!userId) {
        throw new Error("User authentication required. Please login again.");
      }
      
      // Save address if requested
      if (formData.saveAddress) {
        localStorage.setItem("savedAddress", JSON.stringify(formData));
      }
      
      // Create clean item objects without unnecessary properties
      const orderItems = checkoutData.items.map(item => ({
        product: item._id || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url,
        category: item.category || "",
        farmer_details: item.farmer_details || {}
      }));
      
      // Prepare order data with request ID for idempotency
      const orderData = {
        requestId: requestId,
        items: checkoutData.items.map(item => ({
          ...item,
          farmer_id: item.farmer_id || item.farmerId, // Make sure farmer_id is included
          product: item.product?._id || item.product, // Ensure proper product ID
        })),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country || "India"
        },
        subtotal: checkoutData.subtotal,
        shippingFee: checkoutData.shippingFee,
        taxAmount: checkoutData.taxAmount,
        discount: checkoutData.discount || 0,
        totalAmount: checkoutData.total,
        couponCode: checkoutData.couponCode || "",
        paymentMethod: paymentMethod
      };
      
      console.log("Sending order data:", JSON.stringify(orderData, null, 2));
      
      // Make API call with idempotency header
      const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Request-ID": requestId
        },
        body: JSON.stringify(orderData)
      });
      
      let responseData;
      try {
        responseData = await response.json();
      } catch (error) {
        const text = await response.text();
        console.error("Invalid JSON response:", text);
        throw new Error("Server returned an invalid response");
      }
      
      if (!response.ok) {
        console.error("Server error response:", responseData);
        throw new Error(responseData.error || "Failed to create order. Please try again.");
      }
      
      console.log("Order created successfully:", responseData);
      
      // Clear cart and checkout data after successful order
      localStorage.removeItem("cart");
      localStorage.removeItem("checkout");
      
      // For COD orders, show success and redirect
      if (paymentMethod === "cod") {
        setOrderPlaced(true);
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate("/consumer/order-confirmation", {
            state: { order: responseData.order }
          });
        }, 2000);
        
        return;
      

      } else if (paymentMethod === "razorpay") {
        // For Razorpay, first create a Razorpay order through our backend
        const razorpayResponse = await fetch(
          `${API_BASE_URL}/api/orders/create-razorpay-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              amount: checkoutData.total,
            }),
          }
        );

        if (!razorpayResponse.ok) {
          const errorData = await razorpayResponse.json();
          throw new Error(errorData.error || "Failed to create payment order");
        }

        const razorpayResult = await razorpayResponse.json();

        // Now create order in our system with pending payment status
        orderData.razorpayOrderId = razorpayResult.order.id;

        const orderResponse = await fetch(`${API_BASE_URL}/api/orders/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        });

        if (!orderResponse.ok) {
          const orderErrorData = await orderResponse.json();
          throw new Error(orderErrorData.error || "Failed to create order");
        }

        const orderResult = await orderResponse.json();

        // Open Razorpay checkout with the order ID from backend
        openRazorpayPayment(
          razorpayResult.order.id,
          orderResult.order._id,
          token
        );
      }
    } catch (error) {
      console.error("Error processing order:", error);
      if (error.message && error.message.includes("duplicate")) {
        console.log("Duplicate order detected - treating as success");
        
        // Clear cart data
        localStorage.removeItem("cart");
        localStorage.removeItem("checkout");
        
        // Show success message
        setOrderPlaced(true);
        
        // Redirect to orders page
        setTimeout(() => {
          navigate("/consumer/orders");
        }, 2000);
        
        return;
      }
      setError(
        error.message || "Failed to process your order. Please try again."
      );
      setIsProcessing(false);
    }
  };

  // Open Razorpay payment
  const openRazorpayPayment = (razorpayOrderId, orderId, token) => {
    // Get the Razorpay key from environment variable
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!key) {
      console.error("Razorpay key not found in environment variables");
      setError("Payment configuration error. Please contact support.");
      setIsProcessing(false);
      return;
    }

    const options = {
      key: key,
      amount: checkoutData.total * 100, // amount in paisa
      currency: "INR",
      name: "AgroSync",
      description: "Payment for your order",
      image: "/logo.png", // replace with your logo
      order_id: razorpayOrderId,
      handler: async function (response) {
        try {
          // Verify payment with backend
          const verifyResponse = await fetch(
            `${API_BASE_URL}/api/orders/verify-payment`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderId,
              }),
            }
          );

          if (!verifyResponse.ok) {
            const verifyErrorData = await verifyResponse.json();
            throw new Error(
              verifyErrorData.error || "Payment verification failed"
            );
          }

          const verifyResult = await verifyResponse.json();

          // Clear cart and checkout data
          localStorage.removeItem("cart");
          localStorage.removeItem("checkout");

          // Show success and redirect
          setOrderPlaced(true);
          setIsProcessing(false);

          // Redirect to order confirmation
          setTimeout(() => {
            navigate("/consumer/order-confirmation", {
              state: { order: verifyResult.order },
            });
          }, 2000);
        } catch (error) {
          console.error("Payment verification error:", error);
          setError(
            error.message ||
              "Payment verification failed. Please contact support."
          );
          setIsProcessing(false);
        }
      },
      prefill: {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        contact: formData.phone,
      },
      theme: {
        color: "#14b8a6", // Teal color
      },
      modal: {
        ondismiss: function () {
          console.log("Payment cancelled");
          setIsProcessing(false);
          setError("Payment was cancelled. Please try again.");
        },
      },
    };

    // Create new Razorpay instance and open checkout
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response) {
      console.error("Payment failed:", response.error);
      setError(`Payment failed: ${response.error.description}`);
      setIsProcessing(false);
    });

    rzp.open();

    // IMPORTANT: Remove the simulation timeout completely
    // Don't use this in production with real Razorpay
  };

  // Go back to cart
  const goToCart = () => {
    navigate("/consumer/cart");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-red-600 text-white rounded-lg shadow-lg flex items-center space-x-2">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {/* Order Placed Success Message */}
      {orderPlaced && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#1a2626] rounded-xl p-8 max-w-md flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mb-4">
              <FiCheckCircle className="w-8 h-8 text-teal-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Order Placed Successfully!
            </h2>
            <p className="text-gray-400 mb-6">
              Your order has been placed and is being processed.
            </p>
            <div className="animate-pulse text-teal-400">
              Redirecting to order confirmation...
            </div>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={goToCart}
            className="flex items-center space-x-2 text-teal-400 hover:text-teal-300 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back to Cart</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <FiShoppingBag className="w-7 h-7 text-teal-400" />
          <h1 className="text-3xl font-bold text-white">Checkout</h1>
        </div>
        <p className="text-gray-400 mt-2">
          Complete your order by providing shipping and payment details
        </p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left side - Address and Payment */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:w-2/3"
        >
          <form onSubmit={handleSubmit}>
            {/* Shipping Address */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-green-200/20 dark:border-teal-800/20 overflow-hidden mb-6">
              <div className="p-6 border-b border-green-200/20 dark:border-teal-800/20 flex items-center space-x-3">
                <FiMapPin className="w-5 h-5 text-teal-400" />
                <h2 className="text-xl font-semibold text-white">
                  Shipping Address
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-gray-300 mb-2 text-sm"
                      htmlFor="firstName"
                    >
                      First Name*
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/5 border ${
                        formErrors.firstName
                          ? "border-red-500"
                          : "border-green-200/20 dark:border-teal-800/20"
                      } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors`}
                      placeholder="Enter your first name"
                    />
                    {formErrors.firstName && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-gray-300 mb-2 text-sm"
                      htmlFor="lastName"
                    >
                      Last Name*
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/5 border ${
                        formErrors.lastName
                          ? "border-red-500"
                          : "border-green-200/20 dark:border-teal-800/20"
                      } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors`}
                      placeholder="Enter your last name"
                    />
                    {formErrors.lastName && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-gray-300 mb-2 text-sm"
                      htmlFor="email"
                    >
                      Email Address*
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/5 border ${
                        formErrors.email
                          ? "border-red-500"
                          : "border-green-200/20 dark:border-teal-800/20"
                      } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors`}
                      placeholder="Enter your email address"
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-gray-300 mb-2 text-sm"
                      htmlFor="phone"
                    >
                      Phone Number*
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/5 border ${
                        formErrors.phone
                          ? "border-red-500"
                          : "border-green-200/20 dark:border-teal-800/20"
                      } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors`}
                      placeholder="Enter your phone number"
                    />
                    {formErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    className="block text-gray-300 mb-2 text-sm"
                    htmlFor="address"
                  >
                    Full Address*
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows="3"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-white/5 border ${
                      formErrors.address
                        ? "border-red-500"
                        : "border-green-200/20 dark:border-teal-800/20"
                    } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors`}
                    placeholder="Street address, apartment, suite, etc."
                  ></textarea>
                  {formErrors.address && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-gray-300 mb-2 text-sm"
                      htmlFor="city"
                    >
                      City*
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/5 border ${
                        formErrors.city
                          ? "border-red-500"
                          : "border-green-200/20 dark:border-teal-800/20"
                      } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors`}
                      placeholder="Enter your city"
                    />
                    {formErrors.city && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-gray-300 mb-2 text-sm"
                      htmlFor="state"
                    >
                      State*
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/5 border ${
                        formErrors.state
                          ? "border-red-500"
                          : "border-green-200/20 dark:border-teal-800/20"
                      } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors`}
                      placeholder="Enter your state"
                    />
                    {formErrors.state && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.state}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-gray-300 mb-2 text-sm"
                      htmlFor="pincode"
                    >
                      Pincode*
                    </label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white/5 border ${
                        formErrors.pincode
                          ? "border-red-500"
                          : "border-green-200/20 dark:border-teal-800/20"
                      } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors`}
                      placeholder="Enter your pincode"
                    />
                    {formErrors.pincode && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.pincode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-gray-300 mb-2 text-sm"
                      htmlFor="country"
                    >
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/5 border border-green-200/20 dark:border-teal-800/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                      placeholder="Enter your country"
                      disabled
                    />
                  </div>
                </div>

                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="saveAddress"
                    name="saveAddress"
                    checked={formData.saveAddress}
                    onChange={handleInputChange}
                    className="w-4 h-4 border border-green-200/20 dark:border-teal-800/20 rounded bg-white/5 text-teal-500 focus:ring-teal-500"
                  />
                  <label
                    className="ml-2 block text-gray-300 text-sm"
                    htmlFor="saveAddress"
                  >
                    Save this address for future orders
                  </label>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-green-200/20 dark:border-teal-800/20 overflow-hidden mb-6">
              <div className="p-6 border-b border-green-200/20 dark:border-teal-800/20 flex items-center space-x-3">
                <FiCreditCard className="w-5 h-5 text-teal-400" />
                <h2 className="text-xl font-semibold text-white">
                  Payment Method
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {formErrors.paymentMethod && (
                  <p className="text-red-500 text-sm mb-4">
                    {formErrors.paymentMethod}
                  </p>
                )}

                {/* Cash on Delivery Option */}
                <div
                  className={`border ${
                    paymentMethod === "cod"
                      ? "border-teal-500 bg-teal-500/10"
                      : "border-green-200/20 dark:border-teal-800/20 hover:border-teal-500/50"
                  } rounded-lg p-4 cursor-pointer transition-all`}
                  onClick={() => setPaymentMethod("cod")}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="cod"
                      name="paymentMethod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="w-4 h-4 text-teal-500 focus:ring-teal-500 border-gray-600"
                    />
                    <label
                      htmlFor="cod"
                      className="flex items-center cursor-pointer"
                    >
                      <FiDollarSign className="w-5 h-5 text-teal-400 mr-2" />
                      <span className="text-white font-medium">
                        Cash on Delivery
                      </span>
                    </label>
                  </div>

                  {paymentMethod === "cod" && (
                    <div className="mt-3 pl-7 text-gray-400 text-sm">
                      <p>
                        Pay with cash upon delivery. Our delivery partner will
                        collect the payment.
                      </p>
                      <div className="flex items-center mt-2 text-teal-400 text-xs">
                        <FiInfo className="w-4 h-4 mr-1" />
                        <span>No additional charges for Cash on Delivery</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Razorpay Option */}
                <div
                  className={`border ${
                    paymentMethod === "razorpay"
                      ? "border-teal-500 bg-teal-500/10"
                      : "border-green-200/20 dark:border-teal-800/20 hover:border-teal-500/50"
                  } rounded-lg p-4 cursor-pointer transition-all`}
                  onClick={() => setPaymentMethod("razorpay")}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="razorpay"
                      name="paymentMethod"
                      checked={paymentMethod === "razorpay"}
                      onChange={() => setPaymentMethod("razorpay")}
                      className="w-4 h-4 text-teal-500 focus:ring-teal-500 border-gray-600"
                    />
                    <label
                      htmlFor="razorpay"
                      className="flex items-center cursor-pointer"
                    >
                      <img
                        src="https://razorpay.com/build/browser/static/razorpay-logo.613e6405.svg"
                        alt="Razorpay"
                        className="h-5 mr-2"
                        style={{ filter: "brightness(0) invert(1)" }}
                      />
                      <span className="text-white font-medium">
                        Pay with Razorpay
                      </span>
                    </label>
                  </div>

                  {paymentMethod === "razorpay" && (
                    <div className="mt-3 pl-7 text-gray-400 text-sm">
                      <p>
                        Pay securely with credit/debit cards, UPI, wallets, and
                        net banking via Razorpay.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <div className="p-1 rounded bg-white/10">
                          <img
                            src="https://cdn.razorpay.com/bank-cards/visa.png"
                            alt="Visa"
                            className="h-6"
                          />
                        </div>
                        <div className="p-1 rounded bg-white/10">
                          <img
                            src="https://cdn.razorpay.com/bank-cards/mastercard.png"
                            alt="Mastercard"
                            className="h-6"
                          />
                        </div>
                        <div className="p-1 rounded bg-white/10">
                          <img
                            src="https://cdn.razorpay.com/app/upi.svg"
                            alt="UPI"
                            className="h-6"
                            style={{ filter: "brightness(0) invert(1)" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Place Order Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isProcessing}
                className={`py-4 px-8 rounded-lg font-medium flex items-center justify-center ${
                  isProcessing
                    ? "bg-teal-700 cursor-not-allowed"
                    : "bg-teal-500 hover:bg-teal-600"
                } text-white transition-colors`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Place Order
                    <FiShoppingBag className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Right side - Order Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:w-1/3"
        >
          {checkoutData && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-green-200/20 dark:border-teal-800/20 sticky top-28">
              <div className="p-6 border-b border-green-200/20 dark:border-teal-800/20">
                <h2 className="text-xl font-semibold text-white">
                  Order Summary
                </h2>
              </div>

              <div className="p-6">
                <div className="max-h-60 overflow-y-auto pr-2 mb-4">
                  {checkoutData.items.map((item, index) => (
                    <div
                      key={item._id || index}
                      className="flex items-center space-x-3 mb-3"
                    >
                      <div className="h-12 w-12 bg-white/10 rounded overflow-hidden flex-shrink-0">
                        {item.image_url && (
                          <img
                            src={
                              item.image_url.startsWith("http")
                                ? item.image_url
                                : `${API_BASE_URL}${item.image_url}`
                            }
                            alt={item.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/80?text=No+Image";
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-grow">
                        <h3 className="text-white text-sm font-medium truncate">
                          {item.name}
                        </h3>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">
                            Qty: {item.quantity}
                          </span>
                          <span className="text-teal-400 text-sm font-medium">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-green-200/10 dark:border-teal-800/10">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span className="font-medium">
                      ₹{checkoutData.subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-300">
                    <span>Shipping Fee</span>
                    <span className="font-medium">
                      ₹{checkoutData.shippingFee.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-300">
                    <span>Tax (5%)</span>
                    <span className="font-medium">
                      ₹{checkoutData.taxAmount.toFixed(2)}
                    </span>
                  </div>

                  {checkoutData.discount > 0 && (
                    <div className="flex justify-between text-teal-400">
                      <span>Discount</span>
                      <span className="font-medium">
                        -₹{checkoutData.discount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-green-200/10 dark:border-teal-800/10">
                    <div className="flex justify-between text-white">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-teal-400">
                        ₹{checkoutData.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-xs text-gray-400">
                  <div className="flex items-center space-x-1 mb-2">
                    <FiTruck className="w-4 h-4 text-teal-400" />
                    <span>Expected delivery: 3-5 business days</span>
                  </div>

                  <div className="flex items-center space-x-1 mb-2">
                    <FiShield className="w-4 h-4 text-teal-400" />
                    <span>Secure payment processing</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <FiClock className="w-4 h-4 text-teal-400" />
                    <span>Order placed: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutPage;
