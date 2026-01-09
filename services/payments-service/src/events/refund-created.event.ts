import { BaseEvent, createEvent } from '@oms/toolkit';

export interface RefundCreatedData {
  refundId: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  reason: string;
  createdAt: string;
}

export function createRefundCreatedEvent(data: RefundCreatedData): BaseEvent {
  return createEvent('refund.created', 'payments-service', data);
}
