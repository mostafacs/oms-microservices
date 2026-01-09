# @oms/toolkit

Minimal shared utilities package for OMS microservices.

## What's Included

This package contains **ONLY generic utilities** - no service-specific code:

- **Logger** - Pino-based structured logging
- **Errors** - Generic error classes
- **Database** - Batch operations (insert, update, upsert, delete, streaming)
- **Events** - BaseEvent interface for event-driven communication
- **RabbitMQ** - Client, publisher, and consumer abstractions
- **Types** - Common types like pagination

## Philosophy

This package follows the principle of **minimal shared code**:
- ✅ Generic utilities that ALL services need
- ❌ NO service-specific schemas
- ❌ NO service-specific event types
- ❌ NO business logic
- ❌ NO domain models

Each microservice owns its own:
- Validation schemas
- Event definitions
- Business logic
- Database models

## Local Development Installation

### Option 1: Using npm link (Recommended for Development)

This creates symlinks, so changes to toolkit are immediately available in all services.

```bash
# 1. Install and link the toolkit
cd packages/toolkit
./install-local.sh

# 2. Link to all services
./link-all-services.sh

# Now all services use the local toolkit via symlink
```

**Benefits:**
- Changes to toolkit are immediately reflected in all services
- No need to rebuild/reinstall after toolkit changes
- Perfect for active development

**To unlink:**
```bash
cd packages/toolkit
./unlink-all.sh
```

### Option 2: Using npm pack (Alternative)

This creates actual installations using a tarball.

```bash
# Build, pack, and install in all services
cd packages/toolkit
./pack-and-install.sh

# After making changes to toolkit, run again to update services
./pack-and-install.sh
```

**Benefits:**
- Real installations, not symlinks
- Closer to production behavior
- Good for testing packaging

**Drawbacks:**
- Must re-run script after every toolkit change
- Slower development iteration

## Publishing to npm Registry

### Option A: GitHub Packages (Private)

```bash
# 1. Update package.json with repository info
{
  "name": "@your-org/toolkit",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}

# 2. Authenticate with GitHub
npm login --registry=https://npm.pkg.github.com

# 3. Publish
npm publish
```

### Option B: Verdaccio (Private Registry)

```bash
# 1. Start Verdaccio
npm install -g verdaccio
verdaccio

# 2. Publish to Verdaccio
npm publish --registry http://localhost:4873
```

### Option C: npmjs.com (Public)

```bash
# 1. Login to npm
npm login

# 2. Publish
npm publish --access public
```

## Usage in Services

Once installed (via link, pack, or npm registry), import utilities:

```typescript
// Logger
import { logger } from '@oms/toolkit';

logger.info({ userId: '123' }, 'User created');
logger.error({ error }, 'Operation failed');

// Errors
import { ValidationError, NotFoundError } from '@oms/toolkit';

throw new ValidationError('Invalid input');
throw new NotFoundError('User not found');

// Batch operations
import { batchInsert, batchUpdate } from '@oms/toolkit';

await batchInsert(db, 'products', ['name', 'price'], products, {
  batchSize: 1000,
  onBatchComplete: (count) => logger.info(`Inserted ${count} records`),
});

// Events
import { BaseEvent, createEvent } from '@oms/toolkit';

const event = createEvent('user.created', 'users-service', {
  userId: '123',
  email: 'user@example.com',
});

// RabbitMQ
import { RabbitMQClient } from '@oms/toolkit';

const client = RabbitMQClient.getInstance(process.env.RABBITMQ_URL);
await client.connect();
```

## Scripts in This Package

- **`install-local.sh`** - Build and create npm link for local development
- **`link-all-services.sh`** - Link toolkit to all services
- **`pack-and-install.sh`** - Pack tarball and install in all services
- **`unlink-all.sh`** - Remove all npm links

## Development Workflow

### Making Changes to Toolkit

1. **If using npm link:**
   ```bash
   cd packages/toolkit
   # Make your changes
   npm run build
   # Changes are immediately available in all services
   ```

2. **If using npm pack:**
   ```bash
   cd packages/toolkit
   # Make your changes
   ./pack-and-install.sh  # Rebuilds and reinstalls in all services
   ```

## Package Structure

```
packages/toolkit/
├── src/
│   ├── utils/
│   │   └── logger.ts
│   ├── errors/
│   │   ├── base.error.ts
│   │   ├── validation.error.ts
│   │   └── not-found.error.ts
│   ├── database/
│   │   ├── client.ts
│   │   └── batch.ts
│   ├── rabbitmq/
│   │   ├── client.ts
│   │   ├── publisher.ts
│   │   └── consumer.ts
│   ├── events/
│   │   └── base.ts
│   └── types/
│       └── pagination.ts
├── package.json
├── tsconfig.json
├── install-local.sh
├── link-all-services.sh
├── pack-and-install.sh
├── unlink-all.sh
└── README.md
```

## Version Management

When publishing to a registry:

```bash
# Update version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Publish
npm publish
```

Services can then update their dependency:
```json
{
  "dependencies": {
    "@oms/toolkit": "^1.1.0"
  }
}
```

## Dependencies

This package has minimal dependencies:
- `pino` - Logging
- `pg` - PostgreSQL client
- `pg-format` - Safe SQL formatting
- `amqplib` - RabbitMQ client

## License

MIT
