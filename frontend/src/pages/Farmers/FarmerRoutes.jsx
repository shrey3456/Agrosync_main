import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FarmerDashboard from './Dashboard';
import ProductList from './ProductList';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import Profile from '../Profile';
import FarmerOrders from './Farmerorder';
import DocumentUpload from './DocumentUpload';
import FarmerCertificate from './FarmerCertificate';

const FarmerRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<FarmerDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/update/:productId" element={<EditProduct />} />
            <Route path="/orders" element={<FarmerOrders />} />
            <Route path="/documents" element={<DocumentUpload />} />
            <Route path="/certificate/:certificateId" element={<FarmerCertificate />} />
            {/* Add more routes as needed */}   
        </Routes>
    );
};

export default FarmerRoutes;