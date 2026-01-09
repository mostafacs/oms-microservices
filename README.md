# Order Management System (OMS) - Microservices

Production-ready Order Management System built with microservices architecture using Node.js, Fastify, PostgreSQL, and RabbitMQ.

## 🏗️ Architecture Overview

```
┌─────────────┐                                    ┌──────────────┐
│ Web Client  │                                    │Mobile Client │
└──────┬──────┘                                    └──────┬───────┘
       │ REST                                             │ REST
       ▼                                                  ▼
┌─────────────────┐                            ┌──────────────────┐
│   BFF-Web       │                            │   BFF-Mobile     │
│   Port: 3010    │                            │   Port: 3011     │
└────────┬────────┘                            └────────┬─────────┘
         │                                              │
         │ REST (Aggregation)          REST (Lightweight)│
         │                                              │
         ├──────────────┬──────────────┬────────────────┤
         │              │              │                │
         ▼              ▼              ▼                ▼
  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
  │  Users    │  │ Products  │  │  Orders   │  │ Payments  │
  │ Port:3003 │  │Port: 3002 │  │Port: 3001 │  │Port: 3004 │
  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                       │
                       │ Event-Driven Communication
                       ▼
               ┌───────────────┐
               │   RabbitMQ    │
               │  Port: 5672   │
               └───────────────┘
```

## ✨ Key Features

### Independent Microservices
- ✅ **6 independent services** ready for separate git repositories
- ✅ **Minimal shared code** - Only `@oms/toolkit` with generic utilities
- ✅ **Each service owns** its schemas, events, and business logic
- ✅ **No tight coupling** - Services communicate via REST and events

### Communication Patterns
- 🔄 **REST** - Client → BFF → Services (synchronous)
- ⚡ **Event-Driven** - Service → Service (asynchronous via RabbitMQ)
- 🎯 **BFF Pattern** - Separate backends for web and mobile
- 📊 **Data Aggregation** - BFF combines data from multiple services

### Database Architecture
- 🗄️ **Database per service** - 4 separate PostgreSQL databases
- 🔐 **Separate users** - Each service has its own DB credentials
- 📈 **Batch operations** - Efficient bulk inserts/updates
- 🔄 **Event sourcing** - Order events stored for audit trail

## 📦 Services

| Service | Port | Database | Purpose |
|---------|------|----------|---------|
| **users-service** | 3003 | oms_users_db | Authentication & user management |
| **products-service** | 3002 | oms_products_db | Catalog & inventory management |
| **orders-service** | 3001 | oms_orders_db | Order lifecycle & orchestration |
| **payments-service** | 3004 | oms_payments_db | Payment processing & refunds |
| **bff-web** | 3010 | - | Backend for web clients |
| **bff-mobile** | 3011 | - | Backend for mobile clients |

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- Docker & Docker Compose
- npm >= 10.0.0

### 1. Install Toolkit Package

```bash
cd packages/toolkit
./install-local.sh && ./link-all-services.sh
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Infrastructure

```bash
npm run docker:up
```

### 4. Run Migrations

```bash
npm run migrate:all
```

### 5. Start All Services

```bash
npm run dev
```

Services will be available at:
- Users: http://localhost:3003
- Products: http://localhost:3002
- Orders: http://localhost:3001
- Payments: http://localhost:3004
- BFF-Web: http://localhost:3010
- BFF-Mobile: http://localhost:3011

## 📚 Documentation

### Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - Complete quick start guide
- **[packages/toolkit/INSTALLATION_GUIDE.md](./packages/toolkit/INSTALLATION_GUIDE.md)** - Toolkit installation methods

### Architecture
- **[REFACTORED_ARCHITECTURE.md](./REFACTORED_ARCHITECTURE.md)** - Architecture explanation & principles
- **[SERVICES_OVERVIEW.md](./SERVICES_OVERVIEW.md)** - Detailed service documentation
- **[DATA_FLOW_DIAGRAMS.md](./DATA_FLOW_DIAGRAMS.md)** - Complete data flow diagrams ⭐
- **[COMMUNICATION_MATRIX.md](./COMMUNICATION_MATRIX.md)** - REST vs Event-Driven patterns ⭐

### Migration & Deployment
- **[MIGRATION_TO_SEPARATE_REPOS.md](./MIGRATION_TO_SEPARATE_REPOS.md)** - Guide for splitting into separate repos
- **[REFACTORING_COMPLETE.md](./REFACTORING_COMPLETE.md)** - Refactoring summary
- **[CLEANUP_SUMMARY.md](./CLEANUP_SUMMARY.md)** - What was cleaned up

## 🔄 Data Flow Examples

### User Registration (REST Only)
```
Web Client ──REST──> BFF-Web ──REST──> Users Service
           <────────────────────────────┘
                 { userId, token }

Users Service ──EVENT──> RabbitMQ (user.created)
```

### Order Creation (REST + Events)
```
1. Web Client ──REST──> BFF-Web ──REST──> Orders Service
                                             │
2. Orders ──EVENT──> order.created ──> Products (Reserve inventory)
                                             │
3. Products ──EVENT──> inventory.reserved ──> Orders (Confirm)
                                             │
4. Orders ──EVENT──> order.confirmed ──> Payments (Process)
                                             │
5. Payments ──EVENT──> payment.completed ──> Orders (Complete)
```

See **[DATA_FLOW_DIAGRAMS.md](./DATA_FLOW_DIAGRAMS.md)** for complete flows with detailed diagrams.

## 🛠️ Technology Stack

### Core
- **Runtime:** Node.js 20+
- **Framework:** Fastify 4.28
- **Language:** TypeScript 5.4
- **Validation:** Zod 3.23

### Database
- **RDBMS:** PostgreSQL 16
- **ORM:** Drizzle ORM 0.30
- **Migrations:** Drizzle Kit 0.20
- **Batch Operations:** pg-format 1.0

### Messaging
- **Message Broker:** RabbitMQ 3.12
- **Client:** amqplib 0.10
- **Pattern:** Topic exchanges

### Caching
- **Cache:** Redis 7
- **Client:** ioredis 5.4

### Authentication
- **Strategy:** JWT
- **Hashing:** bcrypt 5.1

### Development
- **Build Tool:** Turborepo
- **Package Manager:** npm workspaces
- **Testing:** Vitest 1.6
- **Logging:** Pino 9.0

## 📁 Project Structure

```
oms-node/
├── packages/
│   └── toolkit/                  # Shared utilities (ONLY generic code)
│       ├── src/
│       │   ├── utils/logger.ts
│       │   ├── errors/
│       │   ├── database/batch.ts
│       │   ├── events/base.ts
│       │   └── rabbitmq/
│       ├── install-local.sh      # Install toolkit locally
│       └── link-all-services.sh  # Link to all services
│
├── services/                     # Independent microservices
│   ├── users-service/
│   │   ├── src/
│   │   │   ├── schemas/          # Own validation schemas
│   │   │   ├── events/           # Own event definitions
│   │   │   ├── database/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   └── package.json          # Only depends on @oms/toolkit
│   │
│   ├── products-service/         # Same structure
│   ├── orders-service/           # Same structure
│   ├── payments-service/         # Same structure
│   ├── bff-web/                  # BFF for web
│   └── bff-mobile/               # BFF for mobile
│
├── infrastructure/
│   ├── docker/postgres/
│   └── rabbitmq/
│
├── docker-compose.yml
├── package.json
└── turbo.json
```

## 🔑 Key Principles

### 1. Minimal Shared Code
- Only `@oms/toolkit` contains shared utilities
- Each service owns its schemas and events
- No service-specific code in shared packages

### 2. Own Your Domain
- Services define their own validation schemas
- Services define their own events
- Services manage their own databases

### 3. Loose Coupling
- Services communicate via generic `BaseEvent`
- No TypeScript imports between services
- Event consumers define their own payload expectations

### 4. Database Per Service
- Each service has its own database
- Separate database users and credentials
- No cross-database queries

### 5. Independent Deployment
- Each service can be deployed separately
- Services can scale independently
- Different teams can own different services

## 📊 Communication Patterns

### Use REST When:
✅ Client to BFF communication
✅ BFF to service data fetching
✅ Synchronous responses needed
✅ Data aggregation required

### Use Events When:
✅ Service to service workflows
✅ Asynchronous processing
✅ Saga patterns (order → inventory → payment)
✅ One-to-many notifications
✅ Eventual consistency acceptable

See **[COMMUNICATION_MATRIX.md](./COMMUNICATION_MATRIX.md)** for complete details.

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific service
cd services/users-service && npm test

# Integration tests
npm run test:integration
```

## 📈 Batch Operations

Efficient bulk operations included in `@oms/toolkit`:

```typescript
import { batchInsert, batchUpdate } from '@oms/toolkit';

// Bulk insert 10,000 products
await batchInsert(db, 'products', ['name', 'sku', 'price'], products, {
  batchSize: 1000,
  onBatchComplete: (count) => logger.info(`Inserted ${count}`)
});

// Bulk update inventory
await batchUpdate(db, 'inventory', updates, 'id', ['quantity']);
```

## 🔐 Environment Variables

Each service uses `.env` files:

```bash
# Users Service
PORT=3003
DATABASE_URL=postgres://users_user:users_pass@localhost:5432/oms_users_db
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
JWT_SECRET=your-secret-key

# Products Service
PORT=3002
DATABASE_URL=postgres://products_user:products_pass@localhost:5432/oms_products_db
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# ... etc
```

## 🐳 Docker Services

```bash
# Start all infrastructure
npm run docker:up

# View logs
npm run docker:logs

# Stop infrastructure
npm run docker:down

# Clean up volumes
npm run docker:clean
```

Infrastructure includes:
- PostgreSQL (port 5432)
- RabbitMQ (ports 5672, 15672)
- Redis (port 6379)

## 📖 API Documentation

Each service has Swagger UI:
- Users: http://localhost:3003/docs
- Products: http://localhost:3002/docs
- Orders: http://localhost:3001/docs
- Payments: http://localhost:3004/docs
- BFF-Web: http://localhost:3010/docs
- BFF-Mobile: http://localhost:3011/docs

## 🚢 Deployment

### Option 1: Monorepo (Current)
Deploy all services together using Docker Compose or Kubernetes.

### Option 2: Separate Repositories
Follow **[MIGRATION_TO_SEPARATE_REPOS.md](./MIGRATION_TO_SEPARATE_REPOS.md)** to:
1. Publish `@oms/toolkit` to npm registry
2. Split each service into its own git repository
3. Deploy services independently

## 🤝 Contributing

1. Each service follows the same structure
2. Use `@oms/toolkit` for shared utilities only
3. Services own their schemas and events
4. No cross-service TypeScript imports
5. Communicate via REST (BFF) or Events (services)

## 📝 Scripts Reference

```bash
# Development
npm run dev              # Start all services in dev mode
npm run build            # Build all services
npm test                 # Run all tests

# Docker
npm run docker:up        # Start infrastructure
npm run docker:down      # Stop infrastructure
npm run docker:logs      # View logs
npm run docker:clean     # Clean up volumes

# Database
npm run migrate:all      # Run all migrations
npm run migrate:users    # Migrate users service
npm run migrate:products # Migrate products service
npm run migrate:orders   # Migrate orders service
npm run migrate:payments # Migrate payments service

# Formatting
npm run format           # Format all code
npm run format:check     # Check formatting
```

## 🎯 Benefits of This Architecture

1. ✅ **True Independence** - Services can be developed/deployed separately
2. ✅ **Minimal Coupling** - Only generic utilities shared
3. ✅ **Scalability** - Scale services independently
4. ✅ **Resilience** - Service failures don't cascade
5. ✅ **Flexibility** - Easy to add new services/consumers
6. ✅ **Team Autonomy** - Different teams own different services
7. ✅ **Clean Separation** - Clear boundaries between services
8. ✅ **Production Ready** - Batch ops, error handling, logging included

## 📊 Performance

- **Batch Operations**: Insert/update thousands of records efficiently
- **Event-Driven**: High throughput via RabbitMQ queuing
- **Caching**: Redis for frequently accessed data
- **Database**: Separate databases for parallel query execution
- **Connection Pooling**: PostgreSQL connection pools per service

## 🔒 Security

- JWT authentication at BFF layer
- Password hashing with bcrypt
- Rate limiting per service
- Input validation with Zod
- Parameterized queries (SQL injection prevention)
- CORS configuration
- Helmet.js security headers

## 📞 Support & Issues

For issues or questions, check the documentation:
- [QUICK_START.md](./QUICK_START.md)
- [SERVICES_OVERVIEW.md](./SERVICES_OVERVIEW.md)
- [DATA_FLOW_DIAGRAMS.md](./DATA_FLOW_DIAGRAMS.md)
- [COMMUNICATION_MATRIX.md](./COMMUNICATION_MATRIX.md)

## 📄 License

MIT

---

**Built with ❤️ using Node.js, Fastify, PostgreSQL, and RabbitMQ**
