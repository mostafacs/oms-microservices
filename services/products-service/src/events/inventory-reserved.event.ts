import { BaseEvent, createEvent } from '@oms/toolkit';

export interface InventoryReservedData {
  orderId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedAt: string;
}

export function createInventoryReservedEvent(data: InventoryReservedData): BaseEvent {
  return createEvent('inventory.reserved', 'products-service', data);
}
