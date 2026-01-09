import { BaseEvent, createEvent } from '@oms/toolkit';

export interface UserUpdatedData {
  userId: string;
  changes: Record<string, any>;
  updatedAt: string;
}

export function createUserUpdatedEvent(data: UserUpdatedData): BaseEvent {
  return createEvent('user.updated', 'users-service', data);
}
