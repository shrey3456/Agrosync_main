import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Marketplace from './pages/MarketPlace';
import Farmers from './pages/Farmers';
import Login from './pages/Login';  // Import Login Page
import RegisterPage from './pages/RegisterPage';  // Import Register Page
import AdminMain from './pages/Admin/AdminRoute';
import FarmerMain from './pages/Farmers/FarmerRoutes';
import ConsumerMain from './pages/Consumers/ConsumerRoutes';

import React from 'react';  
function App() {
  return (
    <Router>
      <div className="min-h-screen transition-colors duration-300">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/farmers" element={<Farmers />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />  {/* Add Login Route */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/*" element={<AdminMain />} />
          <Route path="/farmer/*" element={<FarmerMain />} />
          <Route path="/consumer/*" element={<ConsumerMain />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;