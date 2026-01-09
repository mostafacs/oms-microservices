/**
 * Generic event interface - services define their own event data structures
 */

export interface BaseEvent {
  eventId: string;
  eventType: string;      // e.g., "order.created", "payment.completed"
  timestamp: string;
  version: string;
  source: string;         // e.g., "orders-service"
  data: Record<string, any>;  // Generic payload - each service defines its own structure
  metadata?: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    [key: string]: any;
  };
}

export function createEvent(
  eventType: string,
  source: string,
  data: Record<string, any>,
  metadata?: BaseEvent['metadata']
): BaseEvent {
  return {
    eventId: crypto.randomUUID(),
    eventType,
    timestamp: new Date().toISOString(),
    version: '1.0',
    source,
    data,
    metadata,
  };
}
