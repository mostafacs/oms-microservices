/**
 * Payments Service - Event Consumer
 * Consumes order.cancelled from Orders Service
 * Processes refund if payment was already made
 */
import { BaseEvent, logger } from '@oms/toolkit';

interface ExpectedOrderCancelledPayload {
  orderId: string;
  userId: string;
  reason: string;
  cancelledAt: string;
}

export class OrderCancelledConsumer {
  private paymentService: any;

  constructor(paymentService: any) {
    this.paymentService = paymentService;
  }

  async handle(event: BaseEvent): Promise<void> {
    try {
      const payload = event.data as ExpectedOrderCancelledPayload;

      logger.info({ orderId: payload.orderId }, 'Processing order.cancelled event');

      // Check if payment exists for this order
      const payment = await this.paymentService.findByOrderId(payload.orderId);

      if (payment && payment.status === 'completed') {
        // Create refund
        await this.paymentService.createRefund({
          paymentId: payment.id,
          amount: payment.amount,
          reason: `Order cancelled: ${payload.reason}`,
          automated: true,
        });

        logger.info({ orderId: payload.orderId }, 'Refund initiated for cancelled order');
      } else {
        logger.info({ orderId: payload.orderId }, 'No payment to refund for cancelled order');
      }
    } catch (error) {
      logger.error({ error, eventId: event.eventId }, 'Failed to handle order.cancelled event');
      throw error;
    }
  }
}
