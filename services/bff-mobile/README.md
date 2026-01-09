# BFF-Mobile Service

Backend for Frontend service optimized for mobile clients (iOS & Android).

## Purpose

- **Provides lightweight responses** optimized for mobile bandwidth
- **Aggregates data** from multiple microservices
- **Handles mobile-specific features** like push notifications, device management
- **Implements aggressive caching** for mobile performance
- **Supports offline-first patterns** where possible

## Key Differences from BFF-Web

1. **Smaller Payloads**: Returns only essential fields to minimize data transfer
2. **Pagination Limits**: Smaller default page sizes (10 vs 20)
3. **Saved Preferences**: Uses saved addresses and payment methods for faster checkout
4. **Mobile Authentication**: Supports device tokens and push notifications
5. **Aggressive Caching**: More aggressive Redis caching for mobile performance

## No Direct Database Access

This service does NOT have its own database. It communicates with backend services via HTTP APIs.

## Example Endpoints

- `POST /api/v1/checkout` - Quick checkout with saved address/payment
- `GET /api/v1/orders/:orderId/summary` - Lightweight order summary
- `GET /api/v1/users/:userId/profile` - Minimal user profile
- `GET /api/v1/users/:userId/orders` - Paginated order list (lightweight)
- `GET /api/v1/products/search` - Product search with minimal data
- `GET /api/v1/products/:productId` - Product details with availability
- `POST /api/v1/auth/register` - Quick registration with device token
- `POST /api/v1/auth/login` - Login with device info

## Response Optimization

### Web Response (Full):
```json
{
  "id": "...",
  "userId": "...",
  "status": "confirmed",
  "items": [
    {
      "productId": "...",
      "productName": "...",
      "productDescription": "Long description...",
      "productImage": "...",
      "quantity": 2,
      "unitPrice": 29.99,
      ...
    }
  ],
  "user": { "id": "...", "email": "...", "firstName": "...", ... },
  "shippingAddress": { ... },
  "billingAddress": { ... },
  "payment": { ... },
  ...
}
```

### Mobile Response (Lightweight):
```json
{
  "id": "...",
  "status": "confirmed",
  "totalAmount": 59.98,
  "itemCount": 2,
  "createdAt": "2024-01-15T10:30:00Z",
  "estimatedDelivery": "2024-01-20"
}
```

## Environment Variables

```bash
PORT=3011
NODE_ENV=production

# Microservices URLs
ORDERS_SERVICE_URL=http://orders-service:3001
PRODUCTS_SERVICE_URL=http://products-service:3002
USERS_SERVICE_URL=http://users-service:3003
PAYMENTS_SERVICE_URL=http://payments-service:3004

# Redis for aggressive caching
REDIS_URL=redis://localhost:6379
CACHE_TTL_MOBILE=300  # 5 minutes (shorter than web)

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=30d  # Longer for mobile (remember me)

# Push Notifications (optional)
FCM_SERVER_KEY=your-firebase-key  # For Android
APNS_KEY_ID=your-apns-key         # For iOS
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

This service can be deployed independently:

```bash
docker build -t bff-mobile .
docker run -p 3011:3011 bff-mobile
```

## Mobile-Specific Features

1. **Device Token Management**: Stores device tokens for push notifications
2. **Location-Based Features**: Warehouse-based inventory availability
3. **Offline Support**: Returns cache-friendly responses with ETags
4. **Bandwidth Optimization**: Compression, minimal payloads
5. **Mobile Analytics**: Tracks device info, platform, version
