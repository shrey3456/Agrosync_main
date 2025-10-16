import express from 'express';
import dotenv from 'dotenv';
import connectMongoDB from './config/mongoDb.js';
import { authRoutes } from './routes/authRoutes.js';
import { productRoute } from './routes/productRoute.js';
import { orderRoutes } from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import cors from 'cors';
import { ProfileRoutes } from './routes/profileRoutes.js';
import { FarmerOrdersRoutes } from './routes/FarmerOrdersRoute.js';
import adminRoutes from './routes/adminRoutes.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import notificationRoutes from './routes/notificationRoutes.js';
import { documentRoutes } from './routes/documentRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import farmerRioutes from './routes/farmerRoutes.js'; // Import farmer routes

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Update CORS configuration
app.use(cors({
  origin: ["https://krushisetu-dishangpatel-13-1.onrender.com", "https://krushi-setu.netlify.app"],

  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add this before your routes

// Serve static files from the uploads directory
//app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoute);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', ProfileRoutes);
app.use('/api/farmer', FarmerOrdersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/farmer1', farmerRioutes); // Register farmer routes
// Connect MongoDB
connectMongoDB();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Something went wrong!"
  });
});

// Update your server startup to use httpServer instead of app
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});