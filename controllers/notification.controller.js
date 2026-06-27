const notificationService = require('../services/notification.service');
const ApiResponse         = require('../utils/ApiResponse');
const asyncHandler        = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const { is_read, limit } = req.query;
  const notifications = await notificationService.getNotifications({ is_read, limit });
  res.status(200).json(new ApiResponse(200, notifications, 'Notifications fetched'));
});

const markRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead();
  res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount();
  res.status(200).json(new ApiResponse(200, { count }, 'Unread count'));
});

module.exports = { getAll, markRead, getUnreadCount };
