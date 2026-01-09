import { BaseEvent, createEvent } from '@oms/toolkit';

export interface PaymentCompletedData {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  transactionId: string;
  paymentMethod: string;
  completedAt: string;
}

export function createPaymentCompletedEvent(data: PaymentCompletedData): BaseEvent {
  return createEvent('payment.completed', 'payments-service', data);
}
