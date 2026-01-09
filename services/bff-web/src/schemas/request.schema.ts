/**
 * BFF-Web - OWN validation schemas
 * Validates incoming requests from web clients
 */
import { z } from 'zod';

const uuidSchema = z.string().uuid();
const positiveNumberSchema = z.number().positive();

// Checkout schema
export const checkoutSchema = z.object({
  body: z.object({
    userId: uuidSchema,
    items: z.array(
      z.object({
        productId: uuidSchema,
        quantity: positiveNumberSchema,
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
    paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer']),
    paymentDetails: z.object({
      cardNumber: z.string().optional(),
      cardHolderName: z.string().optional(),
      expiryDate: z.string().optional(),
      cvv: z.string().optional(),
      paypalEmail: z.string().email().optional(),
    }).optional(),
  }),
});

// Get order details (aggregated)
export const getOrderDetailsSchema = z.object({
  params: z.object({
    orderId: uuidSchema,
  }),
});

// Get user dashboard (aggregated)
export const getUserDashboardSchema = z.object({
  params: z.object({
    userId: uuidSchema,
  }),
  query: z.object({
    includeOrders: z.coerce.boolean().default(true),
    includeWishlist: z.coerce.boolean().default(false),
  }),
});

// Search products
export const searchProductsSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    categoryId: uuidSchema.optional(),
  }),
});

// Register user
export const registerUserSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
  }),
});

// Login
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1),
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
