# Migration Guide: Monorepo → Separate Repositories

## Current Problem

The existing architecture has **tight coupling** through shared packages:

```
❌ Current (Coupled):
packages/validation/
  ├── order.schema.ts      ← Orders service schemas
  ├── product.schema.ts    ← Products service schemas
  ├── user.schema.ts       ← Users service schemas
  └── payment.schema.ts    ← Payments service schemas

Result: ALL services depend on ALL other services' schemas!
```

## Solution: Minimal Shared Code

```
✅ Refactored (Independent):
@oms/toolkit/                      ← ONE shared package (generic only)
  ├── logger/
  ├── errors/
  ├── database/batch.ts
  ├── events/base.ts
  └── rabbitmq/client.ts

users-service/                     ← Own schemas
  └── src/schemas/user.schema.ts

products-service/                  ← Own schemas
  └── src/schemas/product.schema.ts

orders-service/                    ← Own schemas
  └── src/schemas/order.schema.ts
```

## Step-by-Step Migration

### Step 1: Create Minimal Toolkit Package

**Create `@oms/toolkit` repository:**

```bash
mkdir oms-toolkit
cd oms-toolkit
npm init -y
```

**Copy only generic utilities:**
- ✅ Logger (pino wrapper)
- ✅ Generic error classes
- ✅ Batch database utilities
- ✅ BaseEvent interface
- ✅ RabbitMQ client
- ✅ Pagination utilities

**Publish to npm registry:**

```bash
# Option A: GitHub Packages
npm publish --registry https://npm.pkg.github.com

# Option B: Verdaccio (private registry)
npm publish --registry http://localhost:4873

# Option C: npmjs.com (if public)
npm publish
```

---

### Step 2: Refactor Each Service

For each service (users, products, orders, payments):

#### 2.1 Move schemas INTO the service

**Before:**
```
packages/validation/src/schemas/user.schema.ts
```

**After:**
```
users-service/src/schemas/user.schema.ts
```

#### 2.2 Define own events

**Before (shared):**
```typescript
// In packages/messaging/src/events/user.events.ts
export interface UserCreatedEvent extends BaseEvent {
  eventType: 'user.created';
  data: { userId: string; email: string; ... };
}
```

**After (in service):**
```typescript
// In users-service/src/events/user-created.event.ts
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

#### 2.3 Update package.json

**Before:**
```json
{
  "dependencies": {
    "@oms/common": "workspace:*",
    "@oms/database": "workspace:*",
    "@oms/messaging": "workspace:*",
    "@oms/validation": "workspace:*"
  }
}
```

**After:**
```json
{
  "dependencies": {
    "@oms/toolkit": "^1.0.0",  // Only one shared dependency
    "fastify": "^4.28.0",
    "drizzle-orm": "^0.30.0",
    "zod": "^3.23.8"           // Service defines own schemas
  }
}
```

---

### Step 3: Event Communication Pattern

Services communicate via **generic events**, not typed imports.

**Publisher (Orders Service):**
```typescript
// orders-service/src/events/order-created.event.ts
import { BaseEvent, createEvent } from '@oms/toolkit';

export interface OrderCreatedData {
  orderId: string;
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export function createOrderCreatedEvent(data: OrderCreatedData): BaseEvent {
  return createEvent('order.created', 'orders-service', data);
}

// Publish
const event = createOrderCreatedEvent({ orderId, userId, items });
await publisher.publishEvent(event, 'order.created');
```

**Consumer (Products Service):**
```typescript
// products-service/src/events/consumers/order-created.consumer.ts
import { BaseEvent, logger } from '@oms/toolkit';

// Products service defines what IT expects from order.created
// Does NOT import from orders-service!
interface ExpectedOrderPayload {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
  // Only fields THIS service needs
}

export class OrderCreatedConsumer {
  async handle(event: BaseEvent): Promise<void> {
    const payload = event.data as ExpectedOrderPayload;
    logger.info({ orderId: payload.orderId }, 'Reserving inventory');

    // Reserve inventory
    await this.inventoryService.reserve(payload.items);
  }
}
```

**Key Point:** No shared TypeScript types between services!

---

### Step 4: Split into Separate Repositories

#### 4.1 Create repositories

```bash
# Toolkit (shared)
git init oms-toolkit

# Services (independent)
git init users-service
git init products-service
git init orders-service
git init payments-service
git init bff-web
git init bff-mobile
```

#### 4.2 Copy files

```bash
# Toolkit
cp -r packages/toolkit/* oms-toolkit/

# Services
cp -r services/users-service/* users-service/
cp -r services/products-service/* products-service/
# ... repeat for all services
```

#### 4.3 Update imports

Each service updates imports:

```typescript
// Before
import { logger } from '@oms/common';
import { OrderSchema } from '@oms/validation';

// After
import { logger } from '@oms/toolkit';
import { OrderSchema } from './schemas/order.schema';  // Own schema!
```

---

### Step 5: Deployment Strategy

#### Independent CI/CD for each service

**users-service/.github/workflows/deploy.yml:**
```yaml
name: Deploy Users Service

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - run: npm ci
      - run: npm run build
      - run: npm test

      - name: Build Docker image
        run: docker build -t users-service:${{ github.sha }} .

      - name: Deploy to Kubernetes
        run: kubectl apply -f k8s/
```

Each service deploys independently!

---

## Comparison: Before vs After

### Before (Monorepo with Tight Coupling)

```
Dependency Graph:
users-service → @oms/validation → {user, order, product, payment schemas}
products-service → @oms/validation → {user, order, product, payment schemas}
orders-service → @oms/validation → {user, order, product, payment schemas}
payments-service → @oms/validation → {user, order, product, payment schemas}

Problem: Changing order schema requires updating ALL services!
```

### After (Independent Services)

```
Dependency Graph:
users-service → @oms/toolkit (generic only)
products-service → @oms/toolkit (generic only)
orders-service → @oms/toolkit (generic only)
payments-service → @oms/toolkit (generic only)

Benefit: Changing order schema only affects orders-service!
```

---

## Repository Structure

```
GitHub Organization: your-org/
├── oms-toolkit                    ← Published to npm
├── users-service                  ← Separate repo
├── products-service               ← Separate repo
├── orders-service                 ← Separate repo
├── payments-service               ← Separate repo
├── bff-web                        ← Separate repo
├── bff-mobile                     ← Separate repo
└── infrastructure                 ← Docker Compose, K8s manifests
```

---

## Key Principles

1. **Minimal Shared Code** - Only truly generic utilities
2. **Own Your Schemas** - Each service defines its own validation
3. **Own Your Events** - Each service defines what it publishes/consumes
4. **Generic Communication** - Use BaseEvent, not specific types
5. **Independent Deployment** - Each service has own CI/CD
6. **Loose Coupling** - Services don't know about each other's internals

---

## Testing Strategy

### Unit Tests (within each service)
```bash
cd users-service
npm test
```

### Integration Tests (across services)
```bash
# Use contract testing
npm install --save-dev pact

# Define contracts
# Verify each service honors its contracts
```

### E2E Tests (separate repo)
```
e2e-tests/
  ├── checkout-flow.test.ts
  └── order-creation.test.ts
```

---

## Checklist: Ready for Separate Repos?

- [ ] `@oms/toolkit` published to npm registry
- [ ] Each service has own validation schemas
- [ ] Each service defines own events
- [ ] No cross-service TypeScript imports
- [ ] Services use generic BaseEvent
- [ ] Each service has own package.json with only @oms/toolkit
- [ ] Each service can run independently
- [ ] CI/CD pipelines configured
- [ ] Documentation updated

---

## Result

✅ **Truly independent microservices**
✅ **Deploy services separately**
✅ **Version services independently**
✅ **Change schemas without affecting others**
✅ **Different teams can own different services**
✅ **Minimal shared dependencies**
