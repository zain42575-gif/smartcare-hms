import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const items = await Notification.find({ $or: [{ user: req.user._id }, { role: req.user.role }] }).sort('-createdAt').limit(30);
  ok(res, items, 'Notifications fetched');
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ _id: { $in: req.body.ids || [] } }, { read: true });
  ok(res, null, 'Notifications marked as read');
});
