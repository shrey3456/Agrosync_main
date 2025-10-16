import { Routes, Route } from "react-router-dom";
import React from "react";
import ConsumerDashboard from "./Dashboard";
import Orders from "./Orders";
import CartPage from './CartPage';
import ProductList from './ProductList';
import CheckoutPage from "./Checkout";
import OrderConfirmationPage from "./OrderConform";
import Profile from '../Profile';
import TrackOrders from "./TrackOrders";
import Analytics from "./Analytics";
import ProductFarmers from "./ProductFarmers";

function ConsumerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ConsumerDashboard />}>
        <Route index element={<Profile />} /> {/* Default route */}
        <Route path="profile" element={<Profile />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="shop" element={<ProductList />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order-confirmation" element={<OrderConfirmationPage />} /> 
        <Route path="track-orders" element={<TrackOrders />} />
        <Route path="analytics" element={<Analytics />} />
        {/* FIXED: Change from :productId to :productName */}
        <Route path="product/:productName/farmers" element={<ProductFarmers />} />
      </Route>
    </Routes>
  );
}

export default ConsumerRoutes;