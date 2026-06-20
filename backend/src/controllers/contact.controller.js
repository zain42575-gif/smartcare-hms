import ContactMessage from '../models/ContactMessage.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, ApiError } from '../utils/apiResponse.js';
import { buildPagination } from '../utils/query.js';

// @desc    Submit a new contact message
// @route   POST /api/contact
// @access  Public
export const createMessage = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    throw new ApiError('Name, email, and message are required', 400);
  }

  const newMessage = await ContactMessage.create({
    name,
    email,
    message
  });

  ok(res, newMessage, 'Your message has been received. Our team will contact you shortly.', 201);
});

// @desc    Get all contact messages (Admin/Receptionist)
// @route   GET /api/contact
// @access  Private (Admin)
export const listMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  
  const filter = {};
  if (req.query.read !== undefined) {
    filter.read = req.query.read === 'true';
  }

  const [items, total] = await Promise.all([
    ContactMessage.find(filter).sort('-createdAt').skip(skip).limit(limit),
    ContactMessage.countDocuments(filter),
  ]);

  ok(res, items, 'Messages fetched successfully', 200, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  });
});

// @desc    Toggle message read status
// @route   PATCH /api/contact/:id/read
// @access  Private (Admin)
export const markMessageRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { read } = req.body;

  const message = await ContactMessage.findById(id);
  if (!message) {
    throw new ApiError('Message not found', 404);
  }

  message.read = read !== undefined ? read : true;
  await message.save();

  ok(res, message, `Message marked as ${message.read ? 'read' : 'unread'}`);
});

// @desc    Delete a message
// @route   DELETE /api/contact/:id
// @access  Private (Admin)
export const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const message = await ContactMessage.findById(id);
  if (!message) {
    throw new ApiError('Message not found', 404);
  }

  await message.deleteOne();

  ok(res, null, 'Message deleted successfully');
});
