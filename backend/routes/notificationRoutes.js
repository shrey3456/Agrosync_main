import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get notifications by role
router.get('/:role', authenticate, async (req, res) => {
  try {
    const { role } = req.params;
    const userId = req.user.id;

    console.log('Fetching notifications for:', { userId, role });

    // Validate role
    if (!['farmer', 'consumer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const notifications = await Notification.find({
      userId,
      userRole: role
    })
    .sort({ createdAt: -1 })
    .limit(50);

    console.log(`Found ${notifications.length} notifications`);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error in notification route:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// Mark notifications as read
router.post('/mark-read', authenticate, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;

    await Notification.deleteMany({
      userId,
      userRole: role
    });

    res.json({
      success: true,
      message: 'Notifications deleted successfully'
    });
  } catch (error) {
    console.error('Error in mark-read route:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notifications',
      error: error.message
    });
  }
});

export default router;