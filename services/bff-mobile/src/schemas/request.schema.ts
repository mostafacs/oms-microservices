/**
 * BFF-Mobile - OWN validation schemas
 * Validates incoming requests from mobile clients
 * Optimized for mobile bandwidth constraints
 */
import { z } from 'zod';

const uuidSchema = z.string().uuid();
const positiveNumberSchema = z.number().positive();

// Mobile checkout (simplified payload)
export const checkoutSchema = z.object({
  body: z.object({
    userId: uuidSchema,
    items: z.array(
      z.object({
        productId: uuidSchema,
        quantity: positiveNumberSchema,
      })
    ).min(1, 'At least one item is required'),
    addressId: uuidSchema, // Mobile clients use saved addresses
    paymentMethodId: uuidSchema, // Mobile clients use saved payment methods
  }),
});

// Get order summary (lightweight for mobile)
export const getOrderSummarySchema = z.object({
  params: z.object({
    orderId: uuidSchema,
  }),
});

// Get user profile (minimal)
export const getUserProfileSchema = z.object({
  params: z.object({
    userId: uuidSchema,
  }),
});

// List orders (paginated for mobile)
export const listOrdersSchema = z.object({
  params: z.object({
    userId: uuidSchema,
  }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(20).default(10), // Smaller limit for mobile
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  }),
});

// Search products (lightweight)
export const searchProductsSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    categoryId: uuidSchema.optional(),
  }),
});

// Get product details (with availability)
export const getProductDetailsSchema = z.object({
  params: z.object({
    productId: uuidSchema,
  }),
  query: z.object({
    warehouseId: uuidSchema.optional(), // For location-based availability
  }),
});

// Quick register (minimal fields)
export const quickRegisterSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    deviceToken: z.string().optional(), // For push notifications
  }),
});

// Login with device info
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1),
    deviceToken: z.string().optional(),
    deviceInfo: z.object({
      platform: z.enum(['ios', 'android']),
      version: z.string(),
      model: z.string(),
    }).optional(),
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
