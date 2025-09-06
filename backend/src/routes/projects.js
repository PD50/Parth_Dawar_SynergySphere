import express from 'express';
import { authenticateJwt } from '../middleware/auth.js';
import { validate, projectSchema } from '../middleware/validation.js';
import Project from '../models/Project.js';

const router = express.Router();

// Apply JWT authentication to all routes
router.use(authenticateJwt);

// @route   GET /api/projects
// @desc    Get all projects for the current user
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    // Find projects where user is owner or member
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });
    
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post('/', validate(projectSchema), async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    
    // Create new project
    const project = await Project.create({
      name,
      description,
      status: status || 'planning',
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'admin', // Owner is always admin
        }
      ]
    });
    
    // Populate owner and members data
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/projects/:id
// @desc    Get a project by ID
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    // Find project and check if user has access
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
    
    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found' } });
    }
    
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/projects/:id
// @desc    Update a project
// @access  Private
router.put('/:id', validate(projectSchema), async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    
    // Find project and check if user is owner or admin
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 
          'members.user': req.user._id,
          'members.role': 'admin'
        }
      ]
    });
    
    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found or unauthorized' } });
    }
    
    // Update project
    project.name = name;
    project.description = description;
    if (status) project.status = status;
    
    await project.save();
    
    // Populate owner and members data
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    // Find project and check if user is owner
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found or unauthorized' } });
    }
    
    // Delete project
    await project.deleteOne();
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/projects/:id/members
// @desc    Add a member to a project
// @access  Private
router.post('/:id/members', async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    
    // Find project and check if user is owner or admin
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 
          'members.user': req.user._id,
          'members.role': 'admin'
        }
      ]
    });
    
    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found or unauthorized' } });
    }
    
    // Check if user is already a member
    const existingMember = project.members.find(member => member.user.toString() === userId);
    
    if (existingMember) {
      return res.status(400).json({ error: { message: 'User is already a member of this project' } });
    }
    
    // Add member
    project.members.push({
      user: userId,
      role: role || 'viewer',
    });
    
    await project.save();
    
    // Populate owner and members data
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/projects/:id/members/:userId
// @desc    Update a member's role
// @access  Private
router.put('/:id/members/:userId', async (req, res, next) => {
  try {
    const { role } = req.body;
    
    // Find project and check if user is owner or admin
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 
          'members.user': req.user._id,
          'members.role': 'admin'
        }
      ]
    });
    
    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found or unauthorized' } });
    }
    
    // Find member
    const memberIndex = project.members.findIndex(member => member.user.toString() === req.params.userId);
    
    if (memberIndex === -1) {
      return res.status(404).json({ error: { message: 'Member not found' } });
    }
    
    // Update member role
    project.members[memberIndex].role = role;
    
    await project.save();
    
    // Populate owner and members data
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove a member from a project
// @access  Private
router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    // Find project and check if user is owner or admin
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 
          'members.user': req.user._id,
          'members.role': 'admin'
        }
      ]
    });
    
    if (!project) {
      return res.status(404).json({ error: { message: 'Project not found or unauthorized' } });
    }
    
    // Check if trying to remove the owner
    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ error: { message: 'Cannot remove the project owner' } });
    }
    
    // Remove member
    project.members = project.members.filter(member => member.user.toString() !== req.params.userId);
    
    await project.save();
    
    // Populate owner and members data
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

export default router;
