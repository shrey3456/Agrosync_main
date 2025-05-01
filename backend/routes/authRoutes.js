import express from 'express';
import User from '../models/user.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import jwt from 'jsonwebtoken';
import { loginUser} from '../controllers/authController.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Create user with validated role (prevent admin creation)
        const allowedRole = role === 'farmer' ? 'farmer' : 'consumer';

        const user = await User.create({
            name,
            email,
            password,
            role: allowedRole
        });

        // Generate tokens
        const token = user.generateToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token
        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token,
            refreshToken
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// Login user
router.post('/login', loginUser);

// Google OAuth login/register
// router.post('/google', googleSignIn);

// Refresh token
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token required' });
        }

        // Verify refresh token
        try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

            // Find user
            const user = await User.findById(decoded.id);

            if (!user || user.refreshToken !== refreshToken) {
                return res.status(401).json({ message: 'Invalid refresh token' });
            }

            // Generate new tokens
            const newToken = user.generateToken();
            const newRefreshToken = user.generateRefreshToken();

            // Save new refresh token
            await user.save();

            res.json({
                token: newToken,
                refreshToken: newRefreshToken
            });
        } catch (error) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ message: 'Error refreshing token', error: error.message });
    }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
    try {
        // Clear refresh token
        const user = await User.findById(req.user.id);

        if (user) {
            user.refreshToken = null;
            await user.save();
        }

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Error logging out', error: error.message });
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -refreshToken');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export const authRoutes = router;