import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware.js';

export const createServiceValidator = [
  body('title').isString().notEmpty().withMessage('Title is required'),
  body('list').isArray().withMessage('List must be an array'),
  body('list.*').isString().notEmpty().withMessage('List items cannot be empty'),
  validationMiddleware,
];

export const updateServiceValidator = [
  body('title').optional().isString().notEmpty().withMessage('Title is required'),
  body('list').optional().isArray().withMessage('List must be an array'),
  body('list.*').optional().isString().notEmpty().withMessage('List items cannot be empty'),
  validationMiddleware,
];
