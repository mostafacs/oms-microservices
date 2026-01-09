/**
 * Orders Service - OWN validation schemas
 * No dependency on other services' schemas
 */
import { z } from 'zod';

// Common validations for THIS service
const uuidSchema = z.string().uuid();
const positiveNumberSchema = z.number().positive();
const nonNegativeNumberSchema = z.number().nonnegative();

// Order status enum
export const orderStatusEnum = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

// Create order
export const createOrderSchema = z.object({
  body: z.object({
    userId: uuidSchema,
    items: z.array(
      z.object({
        productId: uuidSchema,
        quantity: positiveNumberSchema,
        unitPrice: positiveNumberSchema,
        productSnapshot: z.record(z.any()).optional(), // Store product details at time of order
      })
    ).min(1, 'At least one item is required'),
    shippingAddress: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1),
    }),
    billingAddress: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1),
    }).optional(),
    notes: z.string().max(1000).optional(),
  }),
});

// Update order
export const updateOrderSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    status: orderStatusEnum.optional(),
    shippingAddress: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1),
    }).optional(),
    notes: z.string().max(1000).optional(),
  }),
});

// Get order
export const getOrderSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// List orders
export const listOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    userId: uuidSchema.optional(),
    status: orderStatusEnum.optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
  }),
});

// Cancel order
export const cancelOrderSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    reason: z.string().min(1, 'Cancellation reason is required').max(500),
  }),
});

// Confirm order
export const confirmOrderSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Get order by user
export const getUserOrdersSchema = z.object({
  params: z.object({
    userId: uuidSchema,
  }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: orderStatusEnum.optional(),
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
