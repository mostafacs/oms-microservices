# BFF-Web Service

Backend for Frontend service optimized for web clients.

## Purpose

- **Aggregates data** from multiple microservices
- **Orchestrates workflows** like checkout
- **Provides web-optimized responses** with complete data structures
- **Handles authentication** and session management
- **Implements caching** for frequently accessed data

## Key Responsibilities

1. **Data Aggregation**: Combine data from Orders, Products, Users, and Payments services
2. **Workflow Orchestration**: Handle complex flows like checkout that involve multiple services
3. **Response Transformation**: Format responses optimized for web clients
4. **Caching**: Reduce load on backend services with Redis caching
5. **Authentication**: JWT-based authentication for web clients

## No Direct Database Access

This service does NOT have its own database. It communicates with backend services via HTTP APIs.

## Example Endpoints

- `POST /api/v1/checkout` - Complete checkout flow
- `GET /api/v1/orders/:orderId/details` - Get order with user, products, and payment info
- `GET /api/v1/users/:userId/dashboard` - User dashboard with recent orders
- `GET /api/v1/products/search` - Search products with filters
- `POST /api/v1/auth/register` - Register new user (delegates to Users service)
- `POST /api/v1/auth/login` - Login (delegates to Users service)

## Environment Variables

```bash
PORT=3010
NODE_ENV=production

# Microservices URLs
ORDERS_SERVICE_URL=http://orders-service:3001
PRODUCTS_SERVICE_URL=http://products-service:3002
USERS_SERVICE_URL=http://users-service:3003
PAYMENTS_SERVICE_URL=http://payments-service:3004

# Redis for caching
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

## Running the Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Independent Deployment

This service can be deployed independently of other services:

```bash
docker build -t bff-web .
docker run -p 3010:3010 bff-web
```
