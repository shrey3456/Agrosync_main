import Notification from '../models/Notification.js';

export const createNotification = async (userId, userRole, type, message, orderId) => {
  try {
    const notification = new Notification({
      userId,
      userRole,
      type,
      message,
      orderId
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { role } = req.params;
    const userId = req.user.id;

    console.log('Fetching notifications for:', { userId, role });

    const notifications = await Notification.find({
      userId,
      userRole: role
    })
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
};

export const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.body;

    await Notification.updateMany(
      { userId, userRole: role },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read'
    });
  }
};