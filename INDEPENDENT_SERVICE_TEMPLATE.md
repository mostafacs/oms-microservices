# Independent Service Template

## Users Service - Completely Standalone Example

This shows how each service should be structured to be truly independent.

### Directory Structure

```
users-service/
├── src/
│   ├── schemas/                    # OWN validation schemas
│   │   ├── user.schema.ts
│   │   ├── auth.schema.ts
│   │   └── common.schema.ts
│   │
│   ├── events/                     # OWN event definitions
│   │   ├── user-created.event.ts
│   │   ├── user-updated.event.ts
│   │   └── publisher.ts
│   │
│   ├── database/
│   │   ├── schema.ts
│   │   └── client.ts
│   │
│   ├── repositories/
│   │   └── user.repository.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── user.service.ts
│   │
│   ├── handlers/
│   │   ├── auth.handler.ts
│   │   └── user.handler.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── user.routes.ts
│   │
│   ├── config/
│   │   └── env.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── package.json                    # Only depends on @oms/toolkit
├── tsconfig.json
├── Dockerfile
└── README.md
```

### Key Files

#### package.json
```json
{
  "name": "users-service",
  "dependencies": {
    "@oms/toolkit": "^1.0.0",      // ONLY shared dependency
    "fastify": "^4.28.0",
    "@fastify/cors": "^9.0.1",
    "@fastify/helmet": "^11.1.1",
    "@fastify/jwt": "^8.0.1",
    "drizzle-orm": "^0.30.0",
    "pg": "^8.12.0",
    "zod": "^3.23.8",                // Define own schemas
    "bcrypt": "^5.1.1",
    "dotenv": "^16.4.5"
  }
}
```

#### src/schemas/user.schema.ts (Service owns its validation)
```typescript
import { z } from 'zod';

// Common validations (in THIS service)
const emailSchema = z.string().email().toLowerCase();
const passwordSchema = z.string().min(8)
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number');

export const registerUserSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
  }),
});
```

#### src/events/user-created.event.ts (Service defines what it publishes)
```typescript
import { BaseEvent, createEvent } from '@oms/toolkit';

export interface UserCreatedData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export function createUserCreatedEvent(data: UserCreatedData): BaseEvent {
  return createEvent('user.created', 'users-service', data);
}
```

#### src/events/publisher.ts
```typescript
import { RabbitMQClient, logger } from '@oms/toolkit';

export class EventPublisher {
  private client: RabbitMQClient;

  constructor(rabbitMQUrl: string) {
    this.client = RabbitMQClient.getInstance(rabbitMQUrl);
  }

  async init(): Promise<void> {
    await this.client.connect();
  }

  async publish(event: any, exchange: string, routingKey: string): Promise<void> {
    const channel = this.client.getChannel();
    await channel.assertExchange(exchange, 'topic', { durable: true });
    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, contentType: 'application/json' }
    );
    logger.info({ eventType: event.eventType }, 'Event published');
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
```

## Products Service - Independent Example

```
products-service/
├── src/
│   ├── schemas/                    # OWN schemas
│   │   ├── product.schema.ts
│   │   └── inventory.schema.ts
│   │
│   ├── events/                     # OWN events
│   │   ├── inventory-reserved.event.ts
│   │   ├── inventory-insufficient.event.ts
│   │   ├── publisher.ts
│   │   └── consumers/
│   │       └── order-created.consumer.ts
│   │
│   └── ...
│
└── package.json                    # Only depends on @oms/toolkit
```

#### src/events/consumers/order-created.consumer.ts
```typescript
import { BaseEvent, logger } from '@oms/toolkit';

// Products service defines what it expects from order.created
// Does NOT import from orders-service!
interface OrderCreatedPayload {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export class OrderCreatedConsumer {
  async handle(event: BaseEvent): Promise<void> {
    const payload = event.data as OrderCreatedPayload;
    logger.info({ orderId: payload.orderId }, 'Processing order created event');

    // Reserve inventory logic
    // Publish inventory-reserved or inventory-insufficient event
  }
}
```

## Orders Service - Independent Example

```
orders-service/
├── src/
│   ├── schemas/                    # OWN schemas
│   │   └── order.schema.ts
│   │
│   ├── events/                     # OWN events
│   │   ├── order-created.event.ts
│   │   ├── order-confirmed.event.ts
│   │   ├── publisher.ts
│   │   └── consumers/
│   │       ├── inventory-reserved.consumer.ts
│   │       └── payment-completed.consumer.ts
│   │
│   └── ...
│
└── package.json                    # Only depends on @oms/toolkit
```

## Benefits

✅ **Each service is a standalone repository**
✅ **Zero cross-service dependencies**
✅ **Each service defines its own contracts**
✅ **Services communicate via generic events**
✅ **Deploy/version independently**
✅ **Change schemas without affecting other services**

## Event Contract Management

Services define **loose contracts** via events:

1. **Publisher** defines what it sends
2. **Consumer** defines what it needs
3. No shared type imports
4. Events are versioned (v1.0, v2.0)
5. Backward compatibility through event versioning

## To Split into Separate Repos

1. Create `oms-toolkit` repo → Publish to npm registry
2. Create separate repo for each service
3. Each service installs `@oms/toolkit` from npm
4. No service imports from another service
5. Each service is independently deployable
