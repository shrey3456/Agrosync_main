import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './Dashboard';
import ProtectedAdminRoute from '../../components/ProtectedAdminRoute';
import ProfilePage from '../Profile';
import FarmersList from './FarmersList';
import ConsumersList from './ConsumersList';
import OrderManagement from './OrderManagement';
import DocumentVerification from './DocumentVerification';
import Certificates from './Certificates';

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/profile" element={<ProtectedAdminRoute><ProfilePage /></ProtectedAdminRoute>} />
            <Route path="/consumers" element={<ProtectedAdminRoute><ConsumersList /></ProtectedAdminRoute>} />
            <Route path="/orders" element={<ProtectedAdminRoute><OrderManagement /></ProtectedAdminRoute>} />
            <Route path="/farmers" element={<ProtectedAdminRoute><FarmersList /></ProtectedAdminRoute>} />
            <Route path="/document-verification" element={<ProtectedAdminRoute><DocumentVerification /></ProtectedAdminRoute>} />
            <Route path="/certificates" element={<ProtectedAdminRoute><Certificates /></ProtectedAdminRoute>} />
        </Routes>
    );
};

export default AdminRoutes;