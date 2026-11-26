const { z } = require('zod');
const { CATEGORIES, PRIORITIES, STATUSES } = require('../constants');

const enumField = (values, name) =>
  z.enum(values, { errorMap: () => ({ message: `${name} must be one of: ${values.join(', ')}` }) });

// ---------- Auth ----------

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name is too long'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ---------- Tickets ----------

const title = z.string().trim().min(5, 'Title must be at least 5 characters').max(120, 'Title is too long');
const description = z
  .string()
  .trim()
  .min(10, 'Description must be at least 10 characters')
  .max(5000, 'Description is too long');

const createTicketSchema = z.object({
  title,
  description,
  category: enumField(CATEGORIES, 'Category'),
  priority: enumField(PRIORITIES, 'Priority').default('medium'),
});

const updateTicketSchema = z
  .object({
    title: title.optional(),
    description: description.optional(),
    category: enumField(CATEGORIES, 'Category').optional(),
    priority: enumField(PRIORITIES, 'Priority').optional(),
    status: enumField(STATUSES, 'Status').optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'Provide at least one field to update',
  });

const SORT_OPTIONS = ['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'priority', '-priority'];

const listTicketsQuerySchema = z.object({
  status: enumField(STATUSES, 'Status').optional(),
  priority: enumField(PRIORITIES, 'Priority').optional(),
  category: enumField(CATEGORIES, 'Category').optional(),
  search: z.string().trim().max(100).optional(),
  sort: enumField(SORT_OPTIONS, 'Sort').default('-createdAt'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ---------- Comments ----------

const commentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(2000, 'Comment is too long'),
});

module.exports = {
  registerSchema,
  loginSchema,
  createTicketSchema,
  updateTicketSchema,
  listTicketsQuerySchema,
  commentSchema,
};
