/**
 * Payments Service - OWN event definitions
 * Defines what this service publishes
 */
import { BaseEvent, createEvent } from '@oms/toolkit';

export interface PaymentInitiatedData {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  initiatedAt: string;
}

export function createPaymentInitiatedEvent(data: PaymentInitiatedData): BaseEvent {
  return createEvent('payment.initiated', 'payments-service', data);
}
