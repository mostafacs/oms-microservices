# Refactored Services Overview

Quick reference for all refactored independent services.

## Service Summary

| Service | Port | Database | Own Schemas | Own Events | Event Consumers |
|---------|------|----------|-------------|------------|-----------------|
| **Users** | 3003 | oms_users_db | ✅ | ✅ (2) | ❌ |
| **Products** | 3002 | oms_products_db | ✅ | ✅ (4) | ✅ (2) |
| **Orders** | 3001 | oms_orders_db | ✅ | ✅ (4) | ✅ (4) |
| **Payments** | 3004 | oms_payments_db | ✅ | ✅ (4) | ✅ (2) |
| **BFF-Web** | 3010 | None | ✅ | ❌ | ❌ |
| **BFF-Mobile** | 3011 | None | ✅ | ❌ | ❌ |

## Users Service

```
services/users-service/
├── src/
│   ├── schemas/
│   │   └── user.schema.ts
│   │       • registerUserSchema
│   │       • loginSchema
│   │       • updateUserSchema
│   │       • getUserSchema
│   │       • listUsersSchema
│   │       • changePasswordSchema
│   │
│   └── events/
│       ├── user-created.event.ts
│       ├── user-updated.event.ts
│       └── publisher.ts
│
└── package.json
    dependencies:
      • @oms/toolkit: ^1.0.0  ← ONLY dependency
      • fastify: ^4.28.0
      • drizzle-orm: ^0.30.0
      • zod: ^3.23.8
      • bcrypt: ^5.1.1
```

**Events Published**:
- `user.created`
- `user.updated`

**Events Consumed**: None

---

## Products Service

```
services/products-service/
├── src/
│   ├── schemas/
│   │   └── product.schema.ts
│   │       • createProductSchema
│   │       • updateProductSchema
│   │       • listProductsSchema
│   │       • updateInventorySchema
│   │       • reserveInventorySchema
│   │       • releaseInventorySchema
│   │       • batchCreateProductsSchema
│   │       • batchUpdateInventorySchema
│   │
│   └── events/
│       ├── product-created.event.ts
│       ├── product-updated.event.ts
│       ├── inventory-reserved.event.ts
│       ├── inventory-insufficient.event.ts
│       ├── publisher.ts
│       └── consumers/
│           ├── order-created.consumer.ts
│           └── order-cancelled.consumer.ts
│
└── package.json
    dependencies:
      • @oms/toolkit: ^1.0.0  ← ONLY dependency
      • fastify: ^4.28.0
      • drizzle-orm: ^0.30.0
      • zod: ^3.23.8
```

**Events Published**:
- `product.created`
- `product.updated`
- `inventory.reserved`
- `inventory.insufficient`

**Events Consumed**:
- `order.created` → Reserves inventory
- `order.cancelled` → Releases inventory

---

## Orders Service

```
services/orders-service/
├── src/
│   ├── schemas/
│   │   └── order.schema.ts
│   │       • createOrderSchema
│   │       • updateOrderSchema
│   │       • listOrdersSchema
│   │       • cancelOrderSchema
│   │       • confirmOrderSchema
│   │       • getUserOrdersSchema
│   │
│   └── events/
│       ├── order-created.event.ts
│       ├── order-confirmed.event.ts
│       ├── order-cancelled.event.ts
│       ├── order-shipped.event.ts
│       ├── publisher.ts
│       └── consumers/
│           ├── inventory-reserved.consumer.ts
│           ├── inventory-insufficient.consumer.ts
│           ├── payment-completed.consumer.ts
│           └── payment-failed.consumer.ts
│
└── package.json
    dependencies:
      • @oms/toolkit: ^1.0.0  ← ONLY dependency
      • fastify: ^4.28.0
      • drizzle-orm: ^0.30.0
      • zod: ^3.23.8
```

**Events Published**:
- `order.created`
- `order.confirmed`
- `order.cancelled`
- `order.shipped`

**Events Consumed**:
- `inventory.reserved` → Confirms order
- `inventory.insufficient` → Cancels order
- `payment.completed` → Moves to processing
- `payment.failed` → Cancels order

---

## Payments Service

```
services/payments-service/
├── src/
│   ├── schemas/
│   │   └── payment.schema.ts
│   │       • createPaymentSchema
│   │       • getPaymentSchema
│   │       • getPaymentsByOrderSchema
│   │       • listPaymentsSchema
│   │       • createRefundSchema
│   │       • listRefundsSchema
│   │
│   └── events/
│       ├── payment-initiated.event.ts
│       ├── payment-completed.event.ts
│       ├── payment-failed.event.ts
│       ├── refund-created.event.ts
│       ├── publisher.ts
│       └── consumers/
│           ├── order-confirmed.consumer.ts
│           └── order-cancelled.consumer.ts
│
└── package.json
    dependencies:
      • @oms/toolkit: ^1.0.0  ← ONLY dependency
      • fastify: ^4.28.0
      • drizzle-orm: ^0.30.0
      • zod: ^3.23.8
```

**Events Published**:
- `payment.initiated`
- `payment.completed`
- `payment.failed`
- `refund.created`

**Events Consumed**:
- `order.confirmed` → Initiates payment
- `order.cancelled` → Creates refund

---

## BFF-Web Service

```
services/bff-web/
├── src/
│   ├── schemas/
│   │   └── request.schema.ts
│   │       • checkoutSchema
│   │       • getOrderDetailsSchema
│   │       • getUserDashboardSchema
│   │       • searchProductsSchema
│   │       • registerUserSchema
│   │       • loginSchema
│   │
│   └── services/
│       └── aggregation.service.ts
│           • getOrderDetails()
│           • getUserDashboard()
│           • checkout()
│
└── package.json
    dependencies:
      • @oms/toolkit: ^1.0.0  ← ONLY dependency
      • fastify: ^4.28.0
      • @fastify/jwt: ^7.2.4
      • zod: ^3.23.8
      • ioredis: ^5.4.1
```

**Features**:
- Aggregates data from Orders, Products, Users, Payments
- Full checkout orchestration
- Web-optimized responses (complete data)
- JWT authentication
- Redis caching

**No Database**: Calls microservices via HTTP

---

## BFF-Mobile Service

```
services/bff-mobile/
├── src/
│   ├── schemas/
│   │   └── request.schema.ts
│   │       • checkoutSchema (simplified with saved address/payment)
│   │       • getOrderSummarySchema
│   │       • getUserProfileSchema
│   │       • listOrdersSchema
│   │       • searchProductsSchema
│   │       • quickRegisterSchema
│   │       • loginSchema (with device info)
│   │
│   └── services/
│       └── aggregation.service.ts
│           • getOrderSummary() (lightweight)
│           • getUserProfile() (minimal)
│           • listUserOrders() (paginated, lightweight)
│           • searchProducts() (minimal)
│           • getProductDetails()
│           • checkout() (with saved preferences)
│
└── package.json
    dependencies:
      • @oms/toolkit: ^1.0.0  ← ONLY dependency
      • fastify: ^4.28.0
      • @fastify/jwt: ^7.2.4
      • zod: ^3.23.8
      • ioredis: ^5.4.1
```

**Features**:
- Lightweight responses (bandwidth optimization)
- Smaller pagination limits (10 vs 20)
- Quick checkout with saved address/payment
- Device token support
- Push notification ready
- Aggressive caching

**No Database**: Calls microservices via HTTP

---

## Event Flow Example: Order Creation

```
1. BFF-Web receives checkout request
   ↓
2. BFF-Web → Orders Service: POST /api/v1/orders
   ↓
3. Orders Service creates order
   Orders Service → RabbitMQ: publish order.created
   ↓
4. Products Service ← RabbitMQ: consume order.created
   Products Service reserves inventory
   Products Service → RabbitMQ: publish inventory.reserved
   ↓
5. Orders Service ← RabbitMQ: consume inventory.reserved
   Orders Service confirms order
   Orders Service → RabbitMQ: publish order.confirmed
   ↓
6. Payments Service ← RabbitMQ: consume order.confirmed
   Payments Service processes payment
   Payments Service → RabbitMQ: publish payment.completed
   ↓
7. Orders Service ← RabbitMQ: consume payment.completed
   Orders Service updates status to 'processing'
```

**Key Point**: Services communicate via generic events, NOT shared TypeScript types!

---

## Package Dependencies Comparison

### ❌ Before (Coupled)

```json
{
  "dependencies": {
    "@oms/common": "workspace:*",
    "@oms/database": "workspace:*",
    "@oms/messaging": "workspace:*",
    "@oms/validation": "workspace:*",
    "fastify": "^4.28.0",
    "drizzle-orm": "^0.30.0"
  }
}
```

### ✅ After (Independent)

```json
{
  "dependencies": {
    "@oms/toolkit": "^1.0.0",
    "fastify": "^4.28.0",
    "drizzle-orm": "^0.30.0",
    "zod": "^3.23.8"
  }
}
```

---

## Shared Package: @oms/toolkit

```
packages/toolkit/
├── src/
│   ├── utils/
│   │   └── logger.ts           ← Pino wrapper
│   │
│   ├── errors/
│   │   ├── base.error.ts       ← Generic error classes
│   │   ├── validation.error.ts
│   │   └── not-found.error.ts
│   │
│   ├── database/
│   │   ├── client.ts           ← PostgreSQL connection
│   │   └── batch.ts            ← Batch operations
│   │       • batchInsert()
│   │       • batchUpdate()
│   │       • batchUpsert()
│   │       • batchDelete()
│   │       • streamQuery()
│   │
│   ├── rabbitmq/
│   │   ├── client.ts           ← RabbitMQ connection
│   │   ├── publisher.ts        ← Generic publisher
│   │   └── consumer.ts         ← Generic consumer
│   │
│   ├── events/
│   │   └── base.ts             ← BaseEvent interface ONLY
│   │       • BaseEvent
│   │       • createEvent()
│   │
│   └── types/
│       └── pagination.ts       ← Pagination types
│
└── package.json
    dependencies:
      • pino: ^9.0.0
      • pg: ^8.12.0
      • pg-format: ^1.0.4
      • amqplib: ^0.10.4
```

**Important**: @oms/toolkit contains ONLY generic utilities, NO service-specific code!

---

## Ready for Separate Repositories

All services are ready to be moved to separate git repositories:

```
GitHub Organization: your-org/
├── oms-toolkit (published to npm)
├── users-service
├── products-service
├── orders-service
├── payments-service
├── bff-web
└── bff-mobile
```

Each service can be:
- Developed independently
- Tested independently
- Deployed independently
- Versioned independently
- Owned by different teams

---

## Key Principles Followed

1. ✅ **Minimal Shared Code** - Only truly generic utilities
2. ✅ **Own Your Schemas** - Each service defines its own validation
3. ✅ **Own Your Events** - Each service defines what it publishes/consumes
4. ✅ **Generic Communication** - Use BaseEvent, not specific types
5. ✅ **Independent Deployment** - Each service has own CI/CD
6. ✅ **Loose Coupling** - Services don't know about each other's internals
