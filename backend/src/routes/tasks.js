import express from 'express';
import { authenticateJwt } from '../middleware/auth.js';
import { validate, taskSchema } from '../middleware/validation.js';
import Task from '../models/Task.js';
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

// @route   GET /api/tasks
// @desc    Get all tasks for the current user
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    // Get project filter if provided
    const { projectId } = req.query;
    
    // Base query: get tasks assigned to user or created by user
    const baseQuery = {
      $or: [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ]
    };
    
    // Add project filter if provided
    if (projectId) {
      // Check if user has access to the project
      const hasAccess = await hasProjectAccess(req.user._id, projectId);
      
      if (!hasAccess) {
        return res.status(403).json({ error: { message: 'You do not have access to this project' } });
      }
      
      baseQuery.project = projectId;
    }
    
    // Find tasks
    const tasks = await Task.find(baseQuery)
      .populate('project', 'name')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ updatedAt: -1 });
    
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', validate(taskSchema), async (req, res, next) => {
  try {
    const { title, description, project: projectId, assignedTo, status, priority, dueDate } = req.body;
    
    // Check if user has access to the project
    const hasAccess = await hasProjectAccess(req.user._id, projectId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: { message: 'You do not have access to this project' } });
    }
    
    // Create new task
    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
    });
    
    // Populate references
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/tasks/:id
// @desc    Get a task by ID
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    // Find task
    const task = await Task.findById(req.params.id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    
    if (!task) {
      return res.status(404).json({ error: { message: 'Task not found' } });
    }
    
    // Check if user has access to the project
    const hasAccess = await hasProjectAccess(req.user._id, task.project._id);
    
    if (!hasAccess) {
      return res.status(403).json({ error: { message: 'You do not have access to this task' } });
    }
    
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', validate(taskSchema), async (req, res, next) => {
  try {
    const { title, description, assignedTo, status, priority, dueDate } = req.body;
    
    // Find task
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: { message: 'Task not found' } });
    }
    
    // Check if user has access to the project
    const hasAccess = await hasProjectAccess(req.user._id, task.project);
    
    if (!hasAccess) {
      return res.status(403).json({ error: { message: 'You do not have access to this task' } });
    }
    
    // Update task
    task.title = title;
    task.description = description;
    task.assignedTo = assignedTo || null;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;
    
    await task.save();
    
    // Populate references
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    // Find task
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: { message: 'Task not found' } });
    }
    
    // Check if user has access to the project
    const hasAccess = await hasProjectAccess(req.user._id, task.project);
    
    if (!hasAccess) {
      return res.status(403).json({ error: { message: 'You do not have access to this task' } });
    }
    
    // Check if user is task creator or project owner
    const project = await Project.findById(task.project);
    
    if (task.createdBy.toString() !== req.user._id.toString() && project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: { message: 'You do not have permission to delete this task' } });
    }
    
    // Delete task
    await task.deleteOne();
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
