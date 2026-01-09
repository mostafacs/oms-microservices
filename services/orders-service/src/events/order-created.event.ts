/**
 * Orders Service - OWN event definitions
 * Defines what this service publishes
 */
import { BaseEvent, createEvent } from '@oms/toolkit';

export interface OrderCreatedData {
  orderId: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
}

export function createOrderCreatedEvent(data: OrderCreatedData): BaseEvent {
  return createEvent('order.created', 'orders-service', data);
}
