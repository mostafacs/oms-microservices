# Users Service

## Independent Microservice

This service is **completely independent** and can be deployed as a separate repository.

### Dependencies

**Only one shared dependency:**
- `@oms/toolkit` - Generic utilities (logger, errors, batch operations, base event types)

**All other dependencies are standard libraries:**
- Fastify (web framework)
- Drizzle ORM (database)
- Zod (validation)
- bcrypt (password hashing)

### What This Service Owns

✅ **Own validation schemas** - `src/schemas/`
- No dependency on other services' schemas
- Defines its own validation rules

✅ **Own event definitions** - `src/events/`
- Defines what events it publishes
- No imports from other services

✅ **Own database schema** - `src/database/schema.ts`
- Complete ownership of data model

✅ **Own business logic** - `src/services/`
- Independent service layer

### Events Published

- `user.created` - When a new user registers
- `user.updated` - When user information changes
- `user.deleted` - When a user is deleted (soft delete)

### Events Consumed

None - Users service doesn't need to consume events from other services.

### API Endpoints

**Authentication:**
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/change-password` - Change password

**User Management:**
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users` - List users (paginated)
- `PATCH /api/v1/users/:id` - Update user

**Health:**
- `GET /health` - Health check

### Environment Variables

```bash
NODE_ENV=development
PORT=3003
LOG_LEVEL=info
DATABASE_URL=postgres://users_user:users_pass@localhost:5432/oms_users_db
RABBITMQ_URL=amqp://rabbitmq:rabbitmq@localhost:5672
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### Running Standalone

```bash
# Install dependencies
npm install

# Run database migrations
npm run migrate

# Development
npm run dev

# Production
npm run build
npm start
```

### Docker

```bash
docker build -t users-service .
docker run -p 3003:3000 \
  -e DATABASE_URL=... \
  -e RABBITMQ_URL=... \
  -e JWT_SECRET=... \
  users-service
```

### Separating to Own Repository

To move this to a separate repository:

1. **Publish `@oms/toolkit` to npm registry** (GitHub Packages or Verdaccio)

2. **Create new repository:**
   ```bash
   git init users-service
   cp -r services-refactored/users-service/* users-service/
   cd users-service
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **Update package.json** to use published toolkit:
   ```json
   {
     "dependencies": {
       "@oms/toolkit": "^1.0.0"  // From npm registry
     }
   }
   ```

4. **Independent deployment:**
   - Own CI/CD pipeline
   - Own version numbering
   - Independent releases

### No Cross-Service Dependencies

This service does NOT depend on:
- ❌ Orders service schemas
- ❌ Products service types
- ❌ Payments service events
- ❌ Any other service code

It only depends on:
- ✅ Generic toolkit utilities
- ✅ Standard npm packages
- ✅ Its own code

### Communication with Other Services

Other services can:
- Call this service's REST API
- Consume events this service publishes
- Send events this service might consume (in future)

All communication is via **generic contracts** (BaseEvent, REST API), not shared TypeScript types.
