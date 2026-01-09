import { BaseEvent, createEvent } from '@oms/toolkit';

export interface OrderConfirmedData {
  orderId: string;
  userId: string;
  totalAmount: number;
  confirmedAt: string;
}

export function createOrderConfirmedEvent(data: OrderConfirmedData): BaseEvent {
  return createEvent('order.confirmed', 'orders-service', data);
}
