# Communication Matrix

Quick reference for all service-to-service communication patterns.

## Communication Pattern Legend

- **REST** = Synchronous HTTP API call (request-response)
- **EVENT** = Asynchronous message via RabbitMQ (fire-and-forget)

---

## Service Communication Matrix

### Who Talks to Whom?

```
FROM ↓ / TO →    │ Users  │ Products │ Orders │ Payments │ BFF-Web │ BFF-Mobile │
─────────────────┼────────┼──────────┼────────┼──────────┼─────────┼────────────┤
Web Client       │   -    │    -     │   -    │    -     │  REST   │     -      │
Mobile Client    │   -    │    -     │   -    │    -     │    -    │   REST     │
─────────────────┼────────┼──────────┼────────┼──────────┼─────────┼────────────┤
BFF-Web          │  REST  │   REST   │  REST  │   REST   │    -    │     -      │
BFF-Mobile       │  REST  │   REST   │  REST  │   REST   │    -    │     -      │
─────────────────┼────────┼──────────┼────────┼──────────┼─────────┼────────────┤
Users            │   -    │    -     │   -    │    -     │    -    │     -      │
                 │        │          │        │          │         │            │
Products         │   -    │    -     │  EVENT │    -     │    -    │     -      │
                 │        │          │   ↑    │          │         │            │
Orders           │   -    │   EVENT  │   -    │  EVENT   │    -    │     -      │
                 │        │    ↓     │        │    ↓     │         │            │
Payments         │   -    │    -     │  EVENT │    -     │    -    │     -      │
                 │        │          │   ↑    │          │         │            │
```

**Key:**
- `-` = No direct communication
- `REST` = HTTP API calls
- `EVENT ↓` = Publishes events
- `EVENT ↑` = Consumes events

---

## Detailed Communication Breakdown

### 1. Client Layer → BFF Layer

#### Web Client → BFF-Web
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/auth/register` | POST | User registration |
| `/api/v1/auth/login` | POST | User login |
| `/api/v1/checkout` | POST | Complete checkout flow |
| `/api/v1/orders/:id/details` | GET | Get aggregated order details |
| `/api/v1/users/:id/dashboard` | GET | Get user dashboard |
| `/api/v1/products/search` | GET | Search products |

**Pattern:** REST (HTTP/JSON)

#### Mobile Client → BFF-Mobile
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/auth/register` | POST | Quick registration |
| `/api/v1/auth/login` | POST | Login with device info |
| `/api/v1/checkout` | POST | Checkout with saved data |
| `/api/v1/orders/:id/summary` | GET | Lightweight order summary |
| `/api/v1/users/:id/profile` | GET | Minimal user profile |
| `/api/v1/products/search` | GET | Product search (minimal) |

**Pattern:** REST (HTTP/JSON, lightweight responses)

---

### 2. BFF Layer → Service Layer

#### BFF-Web → Users Service
| Endpoint | Method | Purpose | When |
|----------|--------|---------|------|
| `/api/v1/users/register` | POST | Create user | User registration |
| `/api/v1/users/login` | POST | Authenticate | User login |
| `/api/v1/users/:id` | GET | Get user details | Order details aggregation |

**Pattern:** REST (Synchronous)

#### BFF-Web → Products Service
| Endpoint | Method | Purpose | When |
|----------|--------|---------|------|
| `/api/v1/products` | GET | List products | Product browsing |
| `/api/v1/products/:id` | GET | Get product | Checkout (price fetch) |
| `/api/v1/products/search` | GET | Search | Product search |

**Pattern:** REST (Synchronous)

#### BFF-Web → Orders Service
| Endpoint | Method | Purpose | When |
|----------|--------|---------|------|
| `/api/v1/orders` | POST | Create order | Checkout |
| `/api/v1/orders/:id` | GET | Get order | Order details |
| `/api/v1/orders` | GET | List orders | User dashboard |

**Pattern:** REST (Synchronous)

#### BFF-Web → Payments Service
| Endpoint | Method | Purpose | When |
|----------|--------|---------|------|
| `/api/v1/payments` | POST | Create payment | (Optional) Direct payment |
| `/api/v1/payments/order/:id` | GET | Get payments | Order details aggregation |

**Pattern:** REST (Synchronous)

---

### 3. Service Layer → Service Layer (Event-Driven)

#### Orders Service → Products Service

**Via Events:**

| Event Published | Event Consumed | Flow |
|----------------|----------------|------|
| `order.created` | → `order.created` | Orders publishes → Products consumes → Reserve inventory |
| `order.cancelled` | → `order.cancelled` | Orders publishes → Products consumes → Release inventory |

**No Direct REST Calls**

---

#### Products Service → Orders Service

**Via Events:**

| Event Published | Event Consumed | Flow |
|----------------|----------------|------|
| `inventory.reserved` | → `inventory.reserved` | Products publishes → Orders consumes → Confirm order |
| `inventory.insufficient` | → `inventory.insufficient` | Products publishes → Orders consumes → Cancel order |

**No Direct REST Calls**

---

#### Orders Service → Payments Service

**Via Events:**

| Event Published | Event Consumed | Flow |
|----------------|----------------|------|
| `order.confirmed` | → `order.confirmed` | Orders publishes → Payments consumes → Process payment |
| `order.cancelled` | → `order.cancelled` | Orders publishes → Payments consumes → Process refund |

**No Direct REST Calls**

---

#### Payments Service → Orders Service

**Via Events:**

| Event Published | Event Consumed | Flow |
|----------------|----------------|------|
| `payment.completed` | → `payment.completed` | Payments publishes → Orders consumes → Move to processing |
| `payment.failed` | → `payment.failed` | Payments publishes → Orders consumes → Cancel order |

**No Direct REST Calls**

---

## Event Publishing & Consumption Matrix

### Users Service
**Publishes:**
- `user.created` (when user registers)
- `user.updated` (when user profile changes)

**Consumes:**
- (None currently)

**RabbitMQ Exchange:** `users`

---

### Products Service
**Publishes:**
- `product.created` (when product is added)
- `product.updated` (when product changes)
- `inventory.reserved` (when inventory reserved successfully)
- `inventory.insufficient` (when not enough inventory)

**Consumes:**
- `order.created` (from Orders) → Reserve inventory
- `order.cancelled` (from Orders) → Release inventory

**RabbitMQ Exchange:** `products`

---

### Orders Service
**Publishes:**
- `order.created` (when order is created)
- `order.confirmed` (when inventory reserved)
- `order.cancelled` (when order cancelled)
- `order.shipped` (when order shipped)

**Consumes:**
- `inventory.reserved` (from Products) → Confirm order
- `inventory.insufficient` (from Products) → Cancel order
- `payment.completed` (from Payments) → Move to processing
- `payment.failed` (from Payments) → Cancel order

**RabbitMQ Exchange:** `orders`

---

### Payments Service
**Publishes:**
- `payment.initiated` (when payment starts)
- `payment.completed` (when payment succeeds)
- `payment.failed` (when payment fails)
- `refund.created` (when refund processed)

**Consumes:**
- `order.confirmed` (from Orders) → Process payment
- `order.cancelled` (from Orders) → Process refund

**RabbitMQ Exchange:** `payments`

---

## REST vs Events Decision Tree

```
                    Need to communicate between services?
                                   │
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
              Is it from a                  Is it service-to-
              BFF to a service?              service communication?
                    │                             │
                    │                             │
                   YES                           YES
                    │                             │
                    ▼                             │
              ╔═══════════╗                       │
              ║  USE REST ║                       │
              ╚═══════════╝                       │
              (Synchronous                        │
               data fetch)                        │
                                                  │
                                   ┌──────────────┴──────────────┐
                                   │                             │
                            Does user need            Is it a workflow/
                            immediate response?       saga pattern?
                                   │                             │
                                   │                             │
                                  YES                           YES
                                   │                             │
                                   ▼                             ▼
                            ╔═══════════╗               ╔═════════════╗
                            ║  USE REST ║               ║  USE EVENTS ║
                            ╚═══════════╝               ╚═════════════╝
                            (via BFF)                   (Asynchronous)

                                                   Examples:
                                                   • Order processing
                                                   • Inventory reservation
                                                   • Payment processing
                                                   • Notifications
```

---

## Communication Principles

### ✅ DO Use REST When:

1. **Client to BFF**
   - Web/Mobile clients ALWAYS use REST
   - User needs immediate feedback

2. **BFF to Services**
   - Fetching data for aggregation
   - Synchronous operations
   - Data retrieval (GET requests)

3. **Queries**
   - Getting user details
   - Getting product information
   - Getting order status

### ✅ DO Use Events When:

1. **Service to Service**
   - Workflow orchestration
   - Multi-step processes (sagas)
   - Order → Inventory → Payment flow

2. **Eventual Consistency**
   - Changes don't need to be immediate
   - Can tolerate brief inconsistency

3. **Decoupling**
   - Services shouldn't know about each other
   - One event, multiple consumers

4. **Notifications**
   - Broadcasting changes
   - Audit logs
   - Analytics

### ❌ DON'T:

1. **Don't use REST between services** (except via BFF)
   - Creates tight coupling
   - Violates microservices principles

2. **Don't use events for client responses**
   - Clients can't consume RabbitMQ events
   - Use WebSockets or polling if needed

3. **Don't use events for immediate responses**
   - If user is waiting, use REST via BFF
   - Events are asynchronous

---

## Data Flow Summary

### Synchronous Flow (REST)
```
Client ─REST─> BFF ─REST─> Service
       <─────────────────────────
           Immediate Response
```

### Asynchronous Flow (Events)
```
Service A ─EVENT─> RabbitMQ ─EVENT─> Service B
                      │
                      └─EVENT─> Service C
                      │
                      └─EVENT─> Service D

(Fire and forget, eventual consistency)
```

### Hybrid Flow (Checkout Example)
```
Client ─REST─> BFF ─REST─> Orders Service
                              │
                              └─EVENT─> Products (Reserve)
                                          │
                                          └─EVENT─> Orders (Confirmed)
                                                      │
                                                      └─EVENT─> Payments (Process)
                                                                  │
                                                                  └─EVENT─> Orders (Complete)

BFF <─REST─ Orders (Final Status)
  │
  └─REST─> Client (Response)
```

---

## RabbitMQ Exchange Configuration

### Exchange Per Service (Topic Exchanges)

```
Exchange: 'users'
  Topic: user.created
  Topic: user.updated

Exchange: 'products'
  Topic: product.created
  Topic: product.updated
  Topic: inventory.reserved
  Topic: inventory.insufficient

Exchange: 'orders'
  Topic: order.created
  Topic: order.confirmed
  Topic: order.cancelled
  Topic: order.shipped

Exchange: 'payments'
  Topic: payment.initiated
  Topic: payment.completed
  Topic: payment.failed
  Topic: refund.created
```

### Routing Pattern
```
Service publishes to its own exchange
Consumers subscribe to other services' exchanges

Example:
  Orders Service publishes to 'orders' exchange
  Products Service subscribes to 'orders.order.created'
  Payments Service subscribes to 'orders.order.confirmed'
```

---

## Performance Considerations

### REST (Synchronous)
- **Latency:** Immediate (ms)
- **Throughput:** Limited by network and service capacity
- **Failure:** Immediate error to client
- **Retry:** Client responsibility
- **Use for:** Data retrieval, queries, BFF aggregation

### Events (Asynchronous)
- **Latency:** Eventual (seconds)
- **Throughput:** High (queuing)
- **Failure:** Retry with backoff, dead letter queues
- **Retry:** Automatic (RabbitMQ)
- **Use for:** Workflows, sagas, notifications

---

## Error Handling

### REST Errors
```
BFF ─REST─> Service (FAILS)
  │
  └─> Return HTTP 500/400/404 to client immediately
```

### Event Errors
```
Service A ─EVENT─> Service B (FAILS)
              │
              └─> Retry (3 times)
                    │
                    └─> Dead Letter Queue
                          │
                          └─> Manual intervention or compensation
```

### Saga Compensation
```
Order Created → Inventory Reserved → Payment FAILS
                                        │
                                        ▼
                                  Publish: payment.failed
                                        │
                                        ▼
                                  Order Cancelled
                                        │
                                        ▼
                                  Publish: order.cancelled
                                        │
                                        ▼
                                  Inventory Released
```
