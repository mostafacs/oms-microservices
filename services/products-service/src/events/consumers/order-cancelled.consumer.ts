/**
 * Products Service - Event Consumer
 * Consumes order.cancelled from Orders Service
 * Releases reserved inventory
 */
import { BaseEvent, logger } from '@oms/toolkit';

interface ExpectedOrderCancelledPayload {
  orderId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export class OrderCancelledConsumer {
  private inventoryService: any;

  constructor(inventoryService: any) {
    this.inventoryService = inventoryService;
  }

  async handle(event: BaseEvent): Promise<void> {
    try {
      const payload = event.data as ExpectedOrderCancelledPayload;

      logger.info({ orderId: payload.orderId }, 'Processing order.cancelled event');

      // Release reserved inventory for each item
      for (const item of payload.items) {
        await this.inventoryService.release({
          productId: item.productId,
          quantity: item.quantity,
          orderId: payload.orderId,
        });
      }

      logger.info({ orderId: payload.orderId }, 'Inventory released successfully');
    } catch (error) {
      logger.error({ error, eventId: event.eventId }, 'Failed to handle order.cancelled event');
      throw error;
    }
  }
}
