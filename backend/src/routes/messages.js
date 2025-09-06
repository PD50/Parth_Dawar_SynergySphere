import express from 'express';
import { authenticateJwt } from '../middleware/auth.js';
import { validate, messageSchema } from '../middleware/validation.js';
import Message from '../models/Message.js';
import Project from '../models/Project.js';

const router = express.Router();

// Apply JWT authentication to all routes
router.use(authenticateJwt);

// Helper function to check if user has access to a project
const hasProjectAccess = async (userId, projectId) => {
  const project = await Project.findOne({
    _id: projectId,
    $or: [
      { owner: userId },
      { 'members.user': userId }
    ]
  });
  
  return !!project;
};

// @route   GET /api/messages
// @desc    Get messages for a project
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const { projectId, limit = 50, before } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ error: { message: 'Project ID is required' } });
    }
    
    // Check if user has access to the project
    const hasAccess = await hasProjectAccess(req.user._id, projectId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: { message: 'You do not have access to this project' } });
    }
    
    // Build query
    const query = { project: projectId };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    // Find messages
    const messages = await Message.find(query)
      .populate('sender', 'name email avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ messages: messages.reverse() });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/messages
// @desc    Create a new message
// @access  Private
router.post('/', validate(messageSchema), async (req, res, next) => {
  try {
    const { content, project: projectId, replyTo, attachments } = req.body;
    
    // Check if user has access to the project
    const hasAccess = await hasProjectAccess(req.user._id, projectId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: { message: 'You do not have access to this project' } });
    }
    
    // Create new message
    const message = await Message.create({
      content,
      project: projectId,
      sender: req.user._id,
      replyTo: replyTo || null,
      attachments: attachments || [],
      readBy: [{ user: req.user._id }], // Sender automatically reads the message
    });
    
    // Populate sender
    await message.populate('sender', 'name email avatar');
    
    // Populate reply if exists
    if (message.replyTo) {
      await message.populate('replyTo');
    }
    
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark a message as read
// @access  Private
router.put('/:id/read', async (req, res, next) => {
  try {
    // Find message
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: { message: 'Message not found' } });
    }
    
    // Check if user has access to the project
    const hasAccess = await hasProjectAccess(req.user._id, message.project);
    
    if (!hasAccess) {
      return res.status(403).json({ error: { message: 'You do not have access to this message' } });
    }
    
    // Check if message is already read by user
    const alreadyRead = message.readBy.some(read => read.user.toString() === req.user._id.toString());
    
    if (!alreadyRead) {
      // Mark as read
      message.readBy.push({
        user: req.user._id,
        readAt: new Date(),
      });
      
      await message.save();
    }
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    // Find message
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: { message: 'Message not found' } });
    }
    
    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'You can only delete your own messages' } });
    }
    
    // Delete message
    await message.deleteOne();
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
