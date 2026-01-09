/**
 * Users Service - OWN event definitions
 * Defines what this service publishes
 */
import { BaseEvent, createEvent } from '@oms/toolkit';

export interface UserCreatedData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export function createUserCreatedEvent(data: UserCreatedData): BaseEvent {
  return createEvent('user.created', 'users-service', data);
}
