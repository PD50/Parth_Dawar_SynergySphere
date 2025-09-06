import Joi from 'joi';

// Validation middleware factory function
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        message: detail.message,
        path: detail.path,
      }));
      
      return res.status(400).json({ 
        error: {
          message: 'Validation Error',
          details: errorDetails,
        }
      });
    }
    
    next();
  };
};

// Validation schemas
export const projectSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().required().min(10),
  status: Joi.string().valid('planning', 'in-progress', 'completed', 'archived'),
  members: Joi.array().items(
    Joi.object({
      user: Joi.string().required(),
      role: Joi.string().valid('viewer', 'editor', 'admin'),
    })
  ),
});

export const taskSchema = Joi.object({
  title: Joi.string().required().min(3).max(100),
  description: Joi.string().allow(''),
  project: Joi.string().required(),
  assignedTo: Joi.string().allow(null),
  status: Joi.string().valid('todo', 'in-progress', 'review', 'completed'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  dueDate: Joi.date().allow(null),
});

export const messageSchema = Joi.object({
  content: Joi.string().required(),
  project: Joi.string().required(),
  replyTo: Joi.string().allow(null),
  attachments: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      url: Joi.string().required(),
      type: Joi.string().required(),
      size: Joi.number().required(),
    })
  ),
});
