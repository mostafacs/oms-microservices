# Quick Start Guide

Get your OMS microservices up and running quickly.

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker and Docker Compose

## Initial Setup

### 1. Install @oms/toolkit Locally

The toolkit package contains shared utilities needed by all services.

```bash
# Install and link toolkit
cd packages/toolkit
./install-local.sh

# Link to all services
./link-all-services.sh
```

This creates symlinks so any changes to toolkit are immediately available to all services.

### 2. Install Service Dependencies

```bash
# Return to root
cd ../..

# Install dependencies for all services
npm install

# Or manually for each service
cd services/users-service && npm install
cd ../products-service && npm install
cd ../orders-service && npm install
cd ../payments-service && npm install
cd ../bff-web && npm install
cd ../bff-mobile && npm install
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL, RabbitMQ, and Redis
npm run docker:up

# Verify services are running
npm run docker:ps
```

Wait for all services to be healthy (about 30 seconds).

### 4. Run Database Migrations

```bash
# Run migrations for all services
npm run migrate:all

# Or individually
npm run migrate:users
npm run migrate:products
npm run migrate:orders
npm run migrate:payments
```

### 5. Start All Services

```bash
# Development mode with hot reload
npm run dev
```

This starts all 6 services:
- Users Service: http://localhost:3003
- Products Service: http://localhost:3002
- Orders Service: http://localhost:3001
- Payments Service: http://localhost:3004
- BFF-Web: http://localhost:3010
- BFF-Mobile: http://localhost:3011

## Verify Everything Works

### Check Service Health

```bash
# Users Service
curl http://localhost:3003/health

# Products Service
curl http://localhost:3002/health

# Orders Service
curl http://localhost:3001/health

# Payments Service
curl http://localhost:3004/health

# BFF-Web
curl http://localhost:3010/health

# BFF-Mobile
curl http://localhost:3011/health
```

### Access Infrastructure

**RabbitMQ Management UI:**
- URL: http://localhost:15672
- Username: `admin`
- Password: `admin123`

**PostgreSQL:**
```bash
docker exec -it oms-postgres psql -U postgres

# Connect to specific database
\c oms_users_db
\c oms_products_db
\c oms_orders_db
\c oms_payments_db

# List tables
\dt
```

**Redis:**
```bash
docker exec -it oms-redis redis-cli
```

## API Documentation

Each service has Swagger UI available:

- Users: http://localhost:3003/docs
- Products: http://localhost:3002/docs
- Orders: http://localhost:3001/docs
- Payments: http://localhost:3004/docs
- BFF-Web: http://localhost:3010/docs
- BFF-Mobile: http://localhost:3011/docs

## Common Commands

### Development

```bash
# Start all services in dev mode
npm run dev

# Start specific service
cd services/users-service && npm run dev

# Build all services
npm run build

# Run tests
npm run test

# Format code
npm run format
```

### Docker

```bash
# Start infrastructure
npm run docker:up

# Stop infrastructure
npm run docker:down

# View logs
npm run docker:logs

# Restart services
npm run docker:restart

# Clean up (removes volumes)
npm run docker:clean

# Rebuild and start
npm run docker:up:all
```

### Toolkit Development

```bash
# After making changes to toolkit
cd packages/toolkit
npm run build

# If using npm link (recommended)
# Changes are automatically available

# If using npm pack
./pack-and-install.sh
```

## Project Structure

```
oms-node/
├── packages/
│   └── toolkit/              # Shared utilities (ONLY generic code)
│
├── services/                 # Independent microservices
│   ├── users-service/
│   ├── products-service/
│   ├── orders-service/
│   ├── payments-service/
│   ├── bff-web/
│   └── bff-mobile/
│
├── infrastructure/           # Docker config
│   ├── docker/postgres/
│   └── rabbitmq/
│
├── docker-compose.yml
└── package.json
```

## Environment Variables

Each service uses environment variables. Default values are in `.env` files.

**Example for Users Service** (`services/users-service/.env`):
```bash
PORT=3003
NODE_ENV=development
DATABASE_URL=postgres://users_user:users_pass@localhost:5432/oms_users_db
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
JWT_SECRET=your-secret-key
```

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9
```

### Database Connection Error

```bash
# Restart PostgreSQL
docker restart oms-postgres

# Check PostgreSQL logs
docker logs oms-postgres
```

### RabbitMQ Connection Error

```bash
# Restart RabbitMQ
docker restart oms-rabbitmq

# Check RabbitMQ logs
docker logs oms-rabbitmq
```

### Toolkit Not Found

```bash
# Relink toolkit
cd packages/toolkit
./unlink-all.sh
./install-local.sh
./link-all-services.sh
```

### Clean Start

```bash
# Stop everything
npm run docker:down

# Clean Docker volumes
docker-compose down -v

# Remove node_modules
rm -rf node_modules services/*/node_modules packages/*/node_modules

# Reinstall
npm install
cd packages/toolkit && ./install-local.sh && ./link-all-services.sh

# Start fresh
cd ../..
npm run docker:up
npm run migrate:all
npm run dev
```

## Next Steps

- Read [SERVICES_OVERVIEW.md](./SERVICES_OVERVIEW.md) for detailed service documentation
- Read [REFACTORED_ARCHITECTURE.md](./REFACTORED_ARCHITECTURE.md) to understand the architecture
- Read [MIGRATION_TO_SEPARATE_REPOS.md](./MIGRATION_TO_SEPARATE_REPOS.md) for splitting into separate repos

## Testing the Full Flow

### 1. Register a User

```bash
curl -X POST http://localhost:3003/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. Create a Product

```bash
curl -X POST http://localhost:3002/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "A test product",
    "sku": "TEST-001",
    "price": 29.99
  }'
```

### 3. Create an Order (via BFF-Web)

```bash
curl -X POST http://localhost:3010/api/v1/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-id>",
    "items": [
      {
        "productId": "<product-id>",
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94105",
      "country": "US"
    },
    "paymentMethod": "credit_card"
  }'
```

## Support

For issues, check the documentation files:
- [REFACTORED_ARCHITECTURE.md](./REFACTORED_ARCHITECTURE.md)
- [REFACTORING_COMPLETE.md](./REFACTORING_COMPLETE.md)
- [SERVICES_OVERVIEW.md](./SERVICES_OVERVIEW.md)
- [CLEANUP_SUMMARY.md](./CLEANUP_SUMMARY.md)
