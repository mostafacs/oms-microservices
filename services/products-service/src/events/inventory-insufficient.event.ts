import { BaseEvent, createEvent } from '@oms/toolkit';

export interface InventoryInsufficientData {
  orderId: string;
  productId: string;
  warehouseId: string;
  requestedQuantity: number;
  availableQuantity: number;
  reason: string;
}

export function createInventoryInsufficientEvent(data: InventoryInsufficientData): BaseEvent {
  return createEvent('inventory.insufficient', 'products-service', data);
}
