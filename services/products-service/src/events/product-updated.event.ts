import { BaseEvent, createEvent } from '@oms/toolkit';

export interface ProductUpdatedData {
  productId: string;
  changes: Record<string, any>;
  updatedAt: string;
}

export function createProductUpdatedEvent(data: ProductUpdatedData): BaseEvent {
  return createEvent('product.updated', 'products-service', data);
}
