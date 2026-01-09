/**
 * Payments Service - OWN validation schemas
 * No dependency on other services' schemas
 */
import { z } from 'zod';

// Common validations for THIS service
const uuidSchema = z.string().uuid();
const positiveNumberSchema = z.number().positive();

// Payment status enum
export const paymentStatusEnum = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'partially_refunded',
]);

// Payment method enum
export const paymentMethodEnum = z.enum([
  'credit_card',
  'debit_card',
  'paypal',
  'bank_transfer',
  'cash_on_delivery',
]);

// Create payment
export const createPaymentSchema = z.object({
  body: z.object({
    orderId: uuidSchema,
    amount: positiveNumberSchema,
    currency: z.string().length(3).default('USD'), // ISO 4217 currency codes
    paymentMethod: paymentMethodEnum,
    paymentDetails: z.object({
      cardNumber: z.string().optional(),
      cardHolderName: z.string().optional(),
      expiryDate: z.string().optional(),
      cvv: z.string().optional(),
      // PayPal
      paypalEmail: z.string().email().optional(),
      // Bank Transfer
      accountNumber: z.string().optional(),
      routingNumber: z.string().optional(),
    }).optional(),
    billingAddress: z.object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1),
    }).optional(),
  }),
});

// Get payment
export const getPaymentSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Get payments by order
export const getPaymentsByOrderSchema = z.object({
  params: z.object({
    orderId: uuidSchema,
  }),
});

// List payments
export const listPaymentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: paymentStatusEnum.optional(),
    orderId: uuidSchema.optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
  }),
});

// Create refund
export const createRefundSchema = z.object({
  body: z.object({
    paymentId: uuidSchema,
    amount: positiveNumberSchema,
    reason: z.string().min(1, 'Refund reason is required').max(500),
  }),
});

// Get refund
export const getRefundSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// List refunds
export const listRefundsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    paymentId: uuidSchema.optional(),
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
