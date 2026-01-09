import { BaseEvent, createEvent } from '@oms/toolkit';

export interface OrderCancelledData {
  orderId: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  reason: string;
  cancelledAt: string;
}

export function createOrderCancelledEvent(data: OrderCancelledData): BaseEvent {
  return createEvent('order.cancelled', 'orders-service', data);
}
