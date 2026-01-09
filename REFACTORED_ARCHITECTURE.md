# Refactored Architecture: Independent Microservices

## Problem with Current Design

The current `@oms/validation` and `@oms/messaging` packages create tight coupling:
- All services depend on validation schemas for OTHER services
- Event types are shared, creating dependencies
- Changes to one service's schema require updating shared package
- Violates microservices independence principle

## Solution: Minimal Shared Dependencies

### Shared Package (ONE package only)

**@oms/toolkit** - Generic utilities only:
- Logger (pino)
- Generic error classes
- Generic database batch utilities
- Generic RabbitMQ base classes
- Generic types (pagination, etc.)

NO service-specific code in shared package!

### Each Service Owns

1. **Its own validation schemas** (using Zod)
2. **Its own event contracts** (what it publishes/consumes)
3. **Its own types and interfaces**
4. **Its own database schema**

## New Structure

```
Repositories:
├── oms-toolkit/                    # ONE shared package
│   ├── logger/
│   ├── errors/
│   ├── database-utils/
│   ├── rabbitmq-base/
│   └── types/
│
├── users-service/                  # Completely independent
│   ├── src/
│   │   ├── schemas/                # OWN validation schemas
│   │   │   ├── user.schema.ts
│   │   │   └── auth.schema.ts
│   │   ├── events/                 # OWN event definitions
│   │   │   ├── user-created.event.ts
│   │   │   └── user-updated.event.ts
│   │   ├── database/
│   │   ├── services/
│   │   └── ...
│   └── package.json                # Only depends on @oms/toolkit
│
├── products-service/               # Completely independent
│   ├── src/
│   │   ├── schemas/                # OWN validation schemas
│   │   │   ├── product.schema.ts
│   │   │   └── inventory.schema.ts
│   │   ├── events/                 # OWN event definitions
│   │   │   ├── inventory-reserved.event.ts
│   │   │   └── product-created.event.ts
│   │   └── ...
│   └── package.json                # Only depends on @oms/toolkit
│
├── orders-service/                 # Completely independent
│   ├── src/
│   │   ├── schemas/                # OWN validation schemas
│   │   │   └── order.schema.ts
│   │   ├── events/                 # OWN event definitions
│   │   │   ├── order-created.event.ts
│   │   │   └── order-confirmed.event.ts
│   │   └── ...
│   └── package.json                # Only depends on @oms/toolkit
│
└── payments-service/               # Completely independent
    ├── src/
    │   ├── schemas/                # OWN validation schemas
    │   │   └── payment.schema.ts
    │   ├── events/                 # OWN event definitions
    │   │   └── payment-completed.event.ts
    │   └── ...
    └── package.json                # Only depends on @oms/toolkit
```

## Event Communication Pattern

Services communicate via **generic event structure**, not specific types:

### Generic Event Interface (in @oms/toolkit)

```typescript
// In @oms/toolkit/events/base.ts
export interface BaseEvent {
  eventId: string;
  eventType: string;  // e.g., "order.created"
  timestamp: string;
  version: string;
  source: string;     // e.g., "orders-service"
  data: Record<string, any>;  // Generic payload
}
```

### Each Service Defines Its Own Events

**Orders Service** - `src/events/order-created.event.ts`:
```typescript
import { BaseEvent } from '@oms/toolkit';

export interface OrderCreatedEventData {
  orderId: string;
  userId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  totalAmount: number;
}

export function createOrderCreatedEvent(data: OrderCreatedEventData): BaseEvent {
  return {
    eventId: crypto.randomUUID(),
    eventType: 'order.created',
    timestamp: new Date().toISOString(),
    version: '1.0',
    source: 'orders-service',
    data,
  };
}
```

**Products Service** - `src/events/order-created.consumer.ts`:
```typescript
import { BaseEvent } from '@oms/toolkit';

// Products service doesn't import Orders service types!
// It defines what it expects from order.created events

interface OrderCreatedPayload {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
  // Only fields products service needs
}

export class OrderCreatedConsumer {
  async handle(event: BaseEvent) {
    const payload = event.data as OrderCreatedPayload;
    // Process the event
  }
}
```

## Benefits

✅ **True Independence** - Each service is a separate repository
✅ **No Cross-Service Dependencies** - Services only depend on generic toolkit
✅ **Deploy Independently** - Change order schema without touching products service
✅ **Version Independently** - Each service has its own versioning
✅ **Clear Contracts** - Events define the contract between services
✅ **Loose Coupling** - Services don't know about each other's internal structure

## Migration Path

1. Create `@oms/toolkit` with only generic code
2. Move service-specific schemas INTO each service
3. Convert specific event types to generic BaseEvent pattern
4. Remove cross-service dependencies
5. Split into separate repositories

## Example: Truly Independent Services

### Dependencies Per Service

**users-service/package.json**:
```json
{
  "dependencies": {
    "@oms/toolkit": "^1.0.0",    // ONLY shared dependency
    "fastify": "^4.28.0",
    "drizzle-orm": "^0.30.0",
    "zod": "^3.23.8",             // Service defines its own schemas
    "bcrypt": "^5.1.1"
  }
}
```

**products-service/package.json**:
```json
{
  "dependencies": {
    "@oms/toolkit": "^1.0.0",    // ONLY shared dependency
    "fastify": "^4.28.0",
    "drizzle-orm": "^0.30.0",
    "zod": "^3.23.8"              // Service defines its own schemas
  }
}
```

No service imports another service's code!
