/**
 * Users Service - OWN validation schemas
 * No dependency on other services' schemas
 */
import { z } from 'zod';

// Common validations for THIS service
const emailSchema = z.string().email().toLowerCase().trim();

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');

const uuidSchema = z.string().uuid();

// Register user
export const registerUserSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
  }),
});

// Login
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  }),
});

// Update user
export const updateUserSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
  }),
});

// Get user
export const getUserSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// List users
export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
  }),
});

// Change password
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
  }),
});

// Validation middleware
export function validateRequest(schema: z.ZodSchema) {
  return async (request: any, reply: any) => {
    try {
      const toValidate: any = {};
      if (schema.shape?.body) toValidate.body = request.body;
      if (schema.shape?.query) toValidate.query = request.query;
      if (schema.shape?.params) toValidate.params = request.params;

      await schema.parseAsync(toValidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
      } else {
        throw error;
      }
    }
  };
}
