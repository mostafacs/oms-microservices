import { BaseEvent, createEvent } from '@oms/toolkit';

export interface PaymentFailedData {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  error: string;
  errorCode?: string;
  failedAt: string;
}

export function createPaymentFailedEvent(data: PaymentFailedData): BaseEvent {
  return createEvent('payment.failed', 'payments-service', data);
}
