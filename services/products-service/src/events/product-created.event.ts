/**
 * Products Service - OWN event definitions
 * Defines what this service publishes
 */
import { BaseEvent, createEvent } from '@oms/toolkit';

export interface ProductCreatedData {
  productId: string;
  name: string;
  sku: string;
  price: number;
  categoryId?: string;
  createdAt: string;
}

export function createProductCreatedEvent(data: ProductCreatedData): BaseEvent {
  return createEvent('product.created', 'products-service', data);
}
