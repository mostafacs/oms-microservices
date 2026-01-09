# OMS Data Flow Diagrams

Complete data flow diagrams showing communication patterns between services.

## Legend

```
[Service]           → Service/Component
────────>           → REST API Call (HTTP)
========>           → Event-Driven Communication (RabbitMQ)
- - - - >           → Response
```

---

## Architecture Overview

```
┌─────────────┐                                    ┌──────────────┐
│ Web Client  │                                    │Mobile Client │
└──────┬──────┘                                    └──────┬───────┘
       │                                                  │
       │ REST                                             │ REST
       ▼                                                  ▼
┌─────────────────┐                            ┌──────────────────┐
│   BFF-Web       │                            │   BFF-Mobile     │
│   Port: 3010    │                            │   Port: 3011     │
└────────┬────────┘                            └────────┬─────────┘
         │                                              │
         │ REST (Aggregation)                           │ REST (Lightweight)
         │                                              │
         ├──────────────────────────┬───────────────────┼────────────┐
         │                          │                   │            │
         ▼                          ▼                   ▼            ▼
  ┌─────────────┐          ┌──────────────┐    ┌──────────────┐  ┌──────────────┐
  │   Users     │          │   Products   │    │    Orders    │  │   Payments   │
  │ Port: 3003  │          │  Port: 3002  │    │  Port: 3001  │  │  Port: 3004  │
  │             │          │              │    │              │  │              │
  │ DB: users   │          │ DB: products │    │  DB: orders  │  │ DB: payments │
  └─────┬───────┘          └──────┬───────┘    └──────┬───────┘  └──────┬───────┘
        │                         │                    │                 │
        │                         │                    │                 │
        └─────────────────────────┴────────────────────┴─────────────────┘
                                  │
                                  │ Event-Driven Communication
                                  ▼
                          ┌───────────────┐
                          │   RabbitMQ    │
                          │  Port: 5672   │
                          │               │
                          │  Exchanges:   │
                          │  - users      │
                          │  - products   │
                          │  - orders     │
                          │  - payments   │
                          └───────────────┘
```

---

## Flow 1: User Registration

**Communication Pattern:** REST Only

```
┌─────────────┐
│ Web Client  │
└──────┬──────┘
       │
       │ POST /api/v1/auth/register
       │ (email, password, firstName, lastName)
       │ REST
       ▼
┌─────────────────┐
│   BFF-Web       │ 1. Validate request
│   Port: 3010    │ 2. Forward to Users Service
└────────┬────────┘
         │
         │ POST /api/v1/users/register
         │ REST
         ▼
  ┌─────────────┐
  │   Users     │ 1. Hash password (bcrypt)
  │ Port: 3003  │ 2. Store in users_db
  │             │ 3. Generate JWT token
  └─────┬───────┘
        │
        │ Publish: user.created
        │ { userId, email, firstName, lastName }
        │ EVENT
        ════════>
                ┌───────────────┐
                │   RabbitMQ    │
                │ Exchange:     │
                │   'users'     │
                └───────────────┘
                        │
                        │ (No consumers for this event yet)
                        │ (Could be used for email verification, analytics, etc.)

Response Flow:
  Users ─ ─ ─ ─ ─ ─> BFF-Web ─ ─ ─ ─ ─ ─> Web Client
  { userId, email, token }
```

**Summary:**
- **REST:** Web Client → BFF-Web → Users Service
- **Events:** Users Service publishes `user.created` (for future consumers)

---

## Flow 2: Product Creation with Inventory

**Communication Pattern:** REST Only

```
┌─────────────┐
│ Web Client  │
└──────┬──────┘
       │
       │ POST /api/v1/products
       │ { name, sku, price, description }
       │ REST
       ▼
┌─────────────────┐
│   BFF-Web       │ 1. Validate request
│   Port: 3010    │ 2. Forward to Products Service
└────────┬────────┘
         │
         │ POST /api/v1/products
         │ REST
         ▼
  ┌──────────────┐
  │   Products   │ 1. Validate SKU is unique
  │  Port: 3002  │ 2. Insert into products table
  │              │ 3. Create inventory record
  └──────┬───────┘
         │
         │ Publish: product.created
         │ { productId, name, sku, price }
         │ EVENT
         ════════>
                 ┌───────────────┐
                 │   RabbitMQ    │
                 │ Exchange:     │
                 │  'products'   │
                 └───────────────┘

Response Flow:
  Products ─ ─ ─ ─ ─> BFF-Web ─ ─ ─ ─ ─> Web Client
  { productId, name, sku, price }
```

**Summary:**
- **REST:** Web Client → BFF-Web → Products Service
- **Events:** Products Service publishes `product.created`

---

## Flow 3: Order Creation (Complete Flow)

**Communication Pattern:** REST + Event-Driven (Complex Orchestration)

```
Step 1: Create Order
═══════════════════

┌─────────────┐
│ Web Client  │
└──────┬──────┘
       │
       │ POST /api/v1/checkout
       │ { userId, items[], shippingAddress, paymentMethod }
       │ REST
       ▼
┌─────────────────┐
│   BFF-Web       │ 1. Fetch product prices
│   Port: 3010    │ 2. Calculate total amount
└────────┬────────┘ 3. Orchestrate order creation
         │
         ├────────────────────────┐
         │                        │
         │ GET /api/v1/products/:id (for each item)
         │ REST                   │
         ▼                        ▼
  ┌──────────────┐        ┌─────────────┐
  │   Products   │        │   Users     │
  │  Port: 3002  │        │ Port: 3003  │
  └──────────────┘        └─────────────┘
         │
         │ Response: product details with prices
         ▼
┌─────────────────┐
│   BFF-Web       │ Total calculated: $99.98
└────────┬────────┘
         │
         │ POST /api/v1/orders
         │ { userId, items, totalAmount, shippingAddress }
         │ REST
         ▼
    ┌──────────────┐
    │    Orders    │ 1. Create order (status: 'pending')
    │  Port: 3001  │ 2. Store order items
    │              │ 3. Store order in orders_db
    └──────┬───────┘
           │
           │ Publish: order.created
           │ { orderId, userId, items[], totalAmount }
           │ EVENT
           ════════>
                   ┌───────────────┐
                   │   RabbitMQ    │
                   │ Exchange:     │
                   │   'orders'    │
                   │ Routing Key:  │
                   │ 'order.created'│
                   └───────┬───────┘
                           │
                           │ Topic Exchange Routes to:
                           ├─────────────────┐
                           │                 │
                           ▼                 ▼
                    ┌──────────────┐  ┌─────────────┐
                    │   Products   │  │   Payments  │
                    │   Service    │  │   Service   │
                    │              │  │             │
                    │ CONSUMER:    │  │ (Waits for  │
                    │ order.created│  │ confirmation)│
                    └──────┬───────┘  └─────────────┘
                           │
                           │
═══════════════════════════════════════════════════════════
Step 2: Reserve Inventory
═══════════════════════════════════════════════════════════
                           │
                    ┌──────┴───────┐
                    │   Products   │ 1. Receive order.created event
                    │   Service    │ 2. For each item:
                    │              │    - Check available quantity
                    └──────┬───────┘    - Reserve inventory
                           │
                           ├─────────────────────────┐
                           │                         │
                           │ SUCCESS PATH            │ FAILURE PATH
                           │                         │
                           │ All items reserved      │ Insufficient inventory
                           │                         │
                           │ Publish:                │ Publish:
                           │ inventory.reserved      │ inventory.insufficient
                           │ EVENT                   │ EVENT
                           ════════>                 ════════>
                                   ┌───────────────┐
                                   │   RabbitMQ    │
                                   │ Exchange:     │
                                   │  'products'   │
                                   └───────┬───────┘
                                           │
                           ┌───────────────┴──────────────────┐
                           │                                  │
                           ▼ SUCCESS                          ▼ FAILURE
                    ┌──────────────┐                   ┌──────────────┐
                    │    Orders    │                   │    Orders    │
                    │   Service    │                   │   Service    │
                    │              │                   │              │
                    │ CONSUMER:    │                   │ CONSUMER:    │
                    │ inventory.   │                   │ inventory.   │
                    │ reserved     │                   │ insufficient │
                    └──────┬───────┘                   └──────┬───────┘
                           │                                  │
                           │                                  │
═══════════════════════════════════════════════════════════════════════
Step 3A: Confirm Order (SUCCESS PATH)
═══════════════════════════════════════════════════════════════════════
                           │
                    ┌──────┴───────┐
                    │    Orders    │ 1. Update status: 'confirmed'
                    │   Service    │ 2. Log event in order_events
                    └──────┬───────┘
                           │
                           │ Publish: order.confirmed
                           │ { orderId, userId, totalAmount }
                           │ EVENT
                           ════════>
                                   ┌───────────────┐
                                   │   RabbitMQ    │
                                   │ Exchange:     │
                                   │   'orders'    │
                                   └───────┬───────┘
                                           │
                                           ▼
                                   ┌──────────────┐
                                   │   Payments   │
                                   │   Service    │
                                   │              │
                                   │ CONSUMER:    │
                                   │ order.       │
                                   │ confirmed    │
                                   └──────┬───────┘
                                          │
═══════════════════════════════════════════════════════════════════════
Step 4: Process Payment
═══════════════════════════════════════════════════════════════════════
                                          │
                                   ┌──────┴───────┐
                                   │   Payments   │ 1. Initiate payment
                                   │   Service    │ 2. Call payment gateway
                                   │              │ 3. Store payment record
                                   └──────┬───────┘
                                          │
                           ┌──────────────┴─────────────────┐
                           │                                │
                           │ PAYMENT SUCCESS                │ PAYMENT FAILURE
                           │                                │
                           │ Publish:                       │ Publish:
                           │ payment.completed              │ payment.failed
                           │ EVENT                          │ EVENT
                           ════════>                        ════════>
                                   ┌───────────────┐
                                   │   RabbitMQ    │
                                   │ Exchange:     │
                                   │  'payments'   │
                                   └───────┬───────┘
                                           │
                           ┌───────────────┴──────────────────┐
                           │                                  │
                           ▼ SUCCESS                          ▼ FAILURE
                    ┌──────────────┐                   ┌──────────────┐
                    │    Orders    │                   │    Orders    │
                    │   Service    │                   │   Service    │
                    │              │                   │              │
                    │ CONSUMER:    │                   │ CONSUMER:    │
                    │ payment.     │                   │ payment.     │
                    │ completed    │                   │ failed       │
                    └──────┬───────┘                   └──────┬───────┘
                           │                                  │
                           │ Update status:                   │ Update status:
                           │ 'processing'                     │ 'cancelled'
                           │                                  │
                           │ Publish:                         │ Publish:
                           │ order.shipped                    │ order.cancelled
                           │ (later)                          │ EVENT
                           │                                  ════════>
                           │                                         │
                           │                                         ▼
                           │                                  ┌──────────────┐
                           │                                  │   Products   │
                           │                                  │   Service    │
                           │                                  │              │
                           │                                  │ CONSUMER:    │
                           │                                  │ order.       │
                           │                                  │ cancelled    │
                           │                                  └──────┬───────┘
                           │                                         │
                           │                                         │ Release
                           │                                         │ reserved
                           │                                         │ inventory
                           │
                           ▼
                   Final Response to Client
                   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─>
                   BFF-Web ─ ─ ─ ─ ─> Web Client
                   { orderId, status, totalAmount }


═══════════════════════════════════════════════════════════════════════
Step 3B: Cancel Order (FAILURE PATH - Insufficient Inventory)
═══════════════════════════════════════════════════════════════════════

                    ┌──────────────┐
                    │    Orders    │ 1. Update status: 'cancelled'
                    │   Service    │ 2. Log cancellation reason
                    └──────┬───────┘
                           │
                           │ Publish: order.cancelled
                           │ { orderId, items[], reason }
                           │ EVENT
                           ════════>
                                   ┌───────────────┐
                                   │   RabbitMQ    │
                                   │ Exchange:     │
                                   │   'orders'    │
                                   └───────┬───────┘
                                           │
                                           ▼
                                   ┌──────────────┐
                                   │   Products   │
                                   │   Service    │
                                   │              │
                                   │ CONSUMER:    │
                                   │ order.       │
                                   │ cancelled    │
                                   └──────┬───────┘
                                          │
                                          │ Release any
                                          │ reserved inventory
                                          ▼
                                    (No action needed -
                                     inventory was never
                                     reserved)

                   Final Response to Client
                   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─>
                   BFF-Web ─ ─ ─ ─ ─> Web Client
                   { error: "Insufficient inventory" }
```

**Summary:**
- **REST:** Web Client → BFF-Web → Orders Service
- **Events:**
  1. Orders → `order.created` → Products, Payments
  2. Products → `inventory.reserved` OR `inventory.insufficient` → Orders
  3. Orders → `order.confirmed` → Payments
  4. Payments → `payment.completed` OR `payment.failed` → Orders
  5. Orders → `order.cancelled` → Products (if needed)

---

## Flow 4: Get Order Details (BFF Aggregation)

**Communication Pattern:** REST Only (Parallel Requests)

```
┌─────────────┐
│ Web Client  │
└──────┬──────┘
       │
       │ GET /api/v1/orders/:orderId/details
       │ REST
       ▼
┌─────────────────┐
│   BFF-Web       │ Aggregation Service
│   Port: 3010    │ Orchestrates multiple service calls
└────────┬────────┘
         │
         │ Parallel REST Calls:
         │
         ├──────────────┬───────────────┬──────────────┐
         │              │               │              │
         ▼              ▼               ▼              ▼
  ┌──────────┐  ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ Orders   │  │ Users    │   │ Products │   │ Payments │
  │ Service  │  │ Service  │   │ Service  │   │ Service  │
  └────┬─────┘  └────┬─────┘   └────┬─────┘   └────┬─────┘
       │             │               │               │
       │ GET /orders/:id             │               │
       │             │ GET /users/:userId            │
       │             │               │ GET /products/:id (for each item)
       │             │               │               │ GET /payments/order/:orderId
       │             │               │               │
       ▼             ▼               ▼               ▼
     Order         User          Products         Payments
     Data          Data           Data             Data
       │             │               │               │
       └─────────────┴───────────────┴───────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │   BFF-Web       │ Merge all data:
                  │                 │ { order, user, products, payments }
                  └────────┬────────┘
                           │
                           │ REST Response
                           ▼
                    ┌─────────────┐
                    │ Web Client  │ Complete order details
                    └─────────────┘
```

**Summary:**
- **REST:** All communication is REST
- **Pattern:** Fan-out (parallel requests) + Aggregation
- **Services Called:** Orders, Users, Products, Payments

---

## Flow 5: Mobile Checkout (Lightweight)

**Communication Pattern:** REST + Event-Driven

```
┌──────────────┐
│Mobile Client │
└──────┬───────┘
       │
       │ POST /api/v1/checkout
       │ { userId, items[], addressId, paymentMethodId }
       │ (Uses saved address and payment method)
       │ REST
       ▼
┌──────────────────┐
│   BFF-Mobile     │ 1. Fetch saved address
│   Port: 3011     │ 2. Fetch saved payment method
└────────┬─────────┘ 3. Fetch product prices
         │          4. Calculate total
         │          5. Create order
         │
         ├──────────────────┬──────────────────┬─────────────┐
         │                  │                  │             │
         │ GET /users/:userId/addresses/:addressId           │
         │ REST             │                  │             │
         ▼                  │                  │             │
  ┌─────────────┐          │                  │             │
  │   Users     │          │                  │             │
  │   Service   │          │                  │             │
  └─────────────┘          │                  │             │
                           │                  │             │
                           │ GET /payment-methods/:id       │
                           │ REST             │             │
                           ▼                  │             │
                    ┌──────────────┐         │             │
                    │   Payments   │         │             │
                    │   Service    │         │             │
                    └──────────────┘         │             │
                                             │             │
                                             │ GET /products/:id
                                             │ REST        │
                                             ▼             │
                                      ┌──────────────┐    │
                                      │   Products   │    │
                                      │   Service    │    │
                                      └──────────────┘    │
                                                          │
                                             │ POST /orders
                                             │ REST
                                             ▼
                                      ┌──────────────┐
                                      │    Orders    │
                                      │   Service    │
                                      └──────┬───────┘
                                             │
                                             │ Publish: order.created
                                             │ EVENT
                                             ════════>
                                                     │
                                             (Same event flow as
                                              regular checkout)

Response Flow (Lightweight for Mobile):
  BFF-Mobile ─ ─ ─ ─ ─> Mobile Client
  { orderId, status, totalAmount }
  (Minimal response to save bandwidth)
```

**Summary:**
- **REST:** Mobile Client → BFF-Mobile → Multiple Services
- **Events:** Same as regular checkout flow
- **Optimization:** Uses saved preferences, returns lightweight response

---

## Communication Patterns Summary

### REST API Calls (Synchronous)

| Source | Target | Endpoint | Purpose |
|--------|--------|----------|---------|
| Web Client | BFF-Web | POST /checkout | Initiate checkout |
| Mobile Client | BFF-Mobile | POST /checkout | Initiate checkout (mobile) |
| BFF-Web | Users | POST /users/register | Create user |
| BFF-Web | Products | GET /products/:id | Get product details |
| BFF-Web | Orders | POST /orders | Create order |
| BFF-Web | Payments | POST /payments | Create payment |
| BFF-Web | Users | GET /users/:id | Get user details |
| BFF-Mobile | Users | GET /users/:id/addresses/:id | Get saved address |
| BFF-Mobile | Payments | GET /payment-methods/:id | Get payment method |

**Pattern:** Request-Response, Immediate feedback required

---

### Event-Driven Communication (Asynchronous)

| Publisher | Event | Consumer(s) | Purpose |
|-----------|-------|-------------|---------|
| Users | `user.created` | (None yet) | User lifecycle notifications |
| Products | `product.created` | (None yet) | Product catalog updates |
| Products | `product.updated` | (None yet) | Product changes |
| **Orders** | **`order.created`** | **Products, Payments** | **Trigger inventory reservation** |
| **Products** | **`inventory.reserved`** | **Orders** | **Confirm inventory available** |
| **Products** | **`inventory.insufficient`** | **Orders** | **Cancel order (no inventory)** |
| **Orders** | **`order.confirmed`** | **Payments** | **Trigger payment processing** |
| **Payments** | **`payment.completed`** | **Orders** | **Move order to processing** |
| **Payments** | **`payment.failed`** | **Orders** | **Cancel order (payment failed)** |
| **Orders** | **`order.cancelled`** | **Products, Payments** | **Release inventory, refund** |
| Orders | `order.shipped` | (None yet) | Shipping notifications |
| Payments | `refund.created` | Orders | Refund processed |

**Pattern:** Fire-and-forget, Eventual consistency, Saga orchestration

---

## When to Use REST vs Events

### Use REST When:
✅ **Synchronous response needed** - User is waiting for immediate feedback
✅ **Data retrieval** - Getting user, product, order details
✅ **BFF aggregation** - Combining data from multiple services
✅ **Client-to-BFF** - All client communication uses REST

### Use Events When:
✅ **Asynchronous workflows** - Order processing, payment, inventory
✅ **Service decoupling** - Services don't need to know about each other
✅ **Saga patterns** - Multi-step transactions (order → inventory → payment)
✅ **Eventual consistency** - Changes don't need to be immediate
✅ **One-to-many** - One event, multiple consumers

---

## Event Flow Patterns

### Pattern 1: Publish-Subscribe
```
Orders Service ════> order.created ════> Products Service (subscribe)
                                    ════> Payments Service (subscribe)
                                    ════> Analytics Service (subscribe)
```

### Pattern 2: Request-Reply via Events (Saga Pattern)
```
Orders ════> order.created ════> Products
                                     │
                                     ▼
                              Reserve Inventory
                                     │
                                     ▼
Products ════> inventory.reserved ════> Orders
                                          │
                                          ▼
                                   Update Status
                                          │
                                          ▼
Orders ════> order.confirmed ════> Payments
                                       │
                                       ▼
                                Process Payment
                                       │
                                       ▼
Payments ════> payment.completed ════> Orders
```

### Pattern 3: Compensating Transactions
```
Orders ════> order.created ════> Products
                                     │
                                     ▼
                            Insufficient Inventory
                                     │
                                     ▼
Products ════> inventory.insufficient ════> Orders
                                              │
                                              ▼
                                        Cancel Order
                                              │
                                              ▼
Orders ════> order.cancelled ════> Products (release reserved inventory)
```

---

## Database Transactions vs Distributed Transactions

### Local Transactions (Within Service)
```
┌──────────────┐
│   Orders     │
│   Service    │   BEGIN TRANSACTION
│              │   1. INSERT INTO orders
│   orders_db  │   2. INSERT INTO order_items
│              │   3. INSERT INTO order_events
│              │   COMMIT
└──────────────┘
```

### Distributed Saga (Across Services)
```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Orders     │      │   Products   │      │   Payments   │
│              │      │              │      │              │
│ 1. Create    │      │              │      │              │
│    Order     │      │              │      │              │
│    (Local TX)│      │              │      │              │
│              │      │              │      │              │
│ 2. Publish ══════> │              │      │              │
│    Event     │      │ 3. Reserve   │      │              │
│              │      │    Inventory │      │              │
│              │      │    (Local TX)│      │              │
│              │      │              │      │              │
│ 5. Update  <══════ │ 4. Publish   │      │              │
│    Status    │      │    Event     │      │              │
│    (Local TX)│      │              │      │              │
│              │      │              │      │              │
│ 6. Publish ══════════════════════════> │              │
│    Event     │      │              │      │ 7. Process   │
│              │      │              │      │    Payment   │
│              │      │              │      │    (Local TX)│
│              │      │              │      │              │
│ 9. Complete <══════════════════════════ │ 8. Publish   │
│    Order     │      │              │      │    Event     │
│    (Local TX)│      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘

Each service maintains its own database consistency.
Cross-service consistency is eventual via events.
```

---

## Summary

### Client → BFF
- **Always REST** (HTTP/JSON)
- BFF provides unified API

### BFF → Services
- **Always REST** (Synchronous calls)
- BFF aggregates responses

### Service → Service
- **REST:** For direct data queries (rare)
- **Events:** For workflows, sagas, notifications (primary pattern)

### Services → Database
- **Local transactions** within each service
- **Eventual consistency** across services via events

### Key Benefits of This Architecture:
1. **Loose Coupling** - Services don't directly depend on each other
2. **Scalability** - Services can scale independently
3. **Resilience** - Service failures don't cascade
4. **Flexibility** - Easy to add new consumers to existing events
5. **Traceability** - Event logs provide audit trail
