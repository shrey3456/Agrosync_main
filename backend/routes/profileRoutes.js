import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import User from '../models/user.js';
import upload  from '../middlewares/upload.js';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    // Fetch complete user profile from database using ID from middleware
    const user = await User.findById(req.user.id).select('-password');
    console.log(user)
    console.log('User profile fetched:', user);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      user: user
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user profile
// Update user profile with all fields from your frontend
// Update user profile with all fields from your frontend
router.put('/profile', authenticate, upload.single('profileImage'), async (req, res) => {
  try {
    // Check if we're just updating the profile image
    if (req.file && Object.keys(req.body).length === 0) {
      // Only updating profile image
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      user.profileImage = `/uploads/profiles/${req.file.filename}`;
      await user.save();
      
      // Return updated user without password
      const updatedUser = await User.findById(req.user.id).select('-password');
      return res.json({ success: true, user: updatedUser });
    }
    
    // Extract fields from frontend form
    const { 
      name,
      email,
      bio,
      phoneNumber,
      pincode,
      country,
      state,
      district,
      city
    } = req.body;
    
    console.log('Received data:', req.body);
    
    // Find user by ID
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update basic user fields
    if (name) user.name = name;
    if (email && email !== user.email) {
      // You might want to add email verification logic here
      user.email = email;
    }
    if (bio !== undefined) user.bio = bio;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (pincode !== undefined) user.pincode = pincode;
    
    // Initialize location object if it doesn't exist
    if (!user.location) {
      user.location = {};
    }
    
    // Update location fields in the nested structure
    if (country !== undefined) user.location.country = country;
    if (state !== undefined) user.location.state = state;
    if (district !== undefined) user.location.district = district;
    if (city !== undefined) user.location.city = city;
    
    // Update profile image if uploaded in form submission
    if (req.file) {
      user.profileImage = `/uploads/profiles/${req.file.filename}`;
    }
    
    console.log('Updated user before save:', {
      name: user.name,
      email: user.email,
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      pincode: user.pincode,
      location: user.location
    });
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    // This would typically fetch from a notifications collection.
    // For now, return empty array as placeholder.
    res.json({ success: true, notifications: [] });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user settings
router.get('/settings', authenticate, async (req, res) => {
  try {
    // Use req.user.id for consistency
    const user = await User.findById(req.user.id).select('settings');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Default settings if none exist
    const settings = user.settings || {
      emailNotifications: false,
      publicProfile: false,
      showLocation: false
    };
    
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user settings
router.put('/settings', authenticate, async (req, res) => {
  try {
    const { emailNotifications, publicProfile, showLocation } = req.body;
    
    // Use req.user.id for consistency
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Ensure settings object exists on user
    user.settings = user.settings || {};
    
    // Update settings
    if (emailNotifications !== undefined) user.settings.emailNotifications = emailNotifications;
    if (publicProfile !== undefined) user.settings.publicProfile = publicProfile;
    if (showLocation !== undefined) user.settings.showLocation = showLocation;
    
    await user.save();
    
    res.json({ success: true, settings: user.settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export {router as ProfileRoutes};