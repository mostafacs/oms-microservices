/**
 * Payments Service - Event Consumer
 * Consumes order.confirmed from Orders Service
 * Initiates payment processing
 */
import { BaseEvent, logger } from '@oms/toolkit';

// Payments service defines what IT expects from order.confirmed
interface ExpectedOrderConfirmedPayload {
  orderId: string;
  userId: string;
  totalAmount: number;
  confirmedAt: string;
}

export class OrderConfirmedConsumer {
  private paymentService: any; // Would be actual PaymentService

  constructor(paymentService: any) {
    this.paymentService = paymentService;
  }

  async handle(event: BaseEvent): Promise<void> {
    try {
      const payload = event.data as ExpectedOrderConfirmedPayload;

      logger.info({ orderId: payload.orderId }, 'Processing order.confirmed event');

      // Initiate payment processing
      await this.paymentService.initiatePayment({
        orderId: payload.orderId,
        amount: payload.totalAmount,
        // Payment method would be retrieved from order or user preferences
      });

      logger.info({ orderId: payload.orderId }, 'Payment initiated for confirmed order');
    } catch (error) {
      logger.error({ error, eventId: event.eventId }, 'Failed to handle order.confirmed event');
      throw error;
    }
  }
}
