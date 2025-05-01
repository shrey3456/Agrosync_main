import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FarmerDashboard from './Dashboard';

import ProductList from './ProductList';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
// import OrderList from './OrderList';
import Profile from '../Profile';
import FarmerOrders from './Farmerorder';
import Analytics from './Analytics';

const FarmerRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<FarmerDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/update/:productId" element={<EditProduct />} />
            {/* <Route path="/orders" element={<OrderList />} /> */}
            <Route path="/orders" element={<FarmerOrders />} />
            <Route path="analytics" element={<Analytics />} />
            {/* Add more routes as needed */}   
        </Routes>
    );
};

export default FarmerRoutes;