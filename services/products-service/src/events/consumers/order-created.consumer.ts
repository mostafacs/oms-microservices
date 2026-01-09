/**
 * Products Service - Event Consumer
 * Consumes order.created from Orders Service
 * Does NOT import from orders-service!
 */
import { BaseEvent, logger } from '@oms/toolkit';

// Products service defines what IT expects from order.created
// Only fields THIS service needs
interface ExpectedOrderPayload {
  orderId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export class OrderCreatedConsumer {
  private inventoryService: any; // Would be actual InventoryService

  constructor(inventoryService: any) {
    this.inventoryService = inventoryService;
  }

  async handle(event: BaseEvent): Promise<void> {
    try {
      const payload = event.data as ExpectedOrderPayload;

      logger.info({ orderId: payload.orderId }, 'Processing order.created event');

      // Reserve inventory for each item
      for (const item of payload.items) {
        const reserved = await this.inventoryService.reserve({
          productId: item.productId,
          quantity: item.quantity,
          orderId: payload.orderId,
        });

        if (!reserved) {
          logger.warn(
            { orderId: payload.orderId, productId: item.productId },
            'Insufficient inventory for product'
          );
          // Publish inventory.insufficient event
          // Orders service will handle cancellation
        }
      }

      logger.info({ orderId: payload.orderId }, 'Inventory reserved successfully');
    } catch (error) {
      logger.error({ error, eventId: event.eventId }, 'Failed to handle order.created event');
      throw error;
    }
  }
}
