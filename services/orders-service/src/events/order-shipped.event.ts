import { BaseEvent, createEvent } from '@oms/toolkit';

export interface OrderShippedData {
  orderId: string;
  userId: string;
  trackingNumber?: string;
  carrier?: string;
  shippedAt: string;
}

export function createOrderShippedEvent(data: OrderShippedData): BaseEvent {
  return createEvent('order.shipped', 'orders-service', data);
}
