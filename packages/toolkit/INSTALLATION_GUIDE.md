# @oms/toolkit Installation Guide

Complete guide for installing and managing the toolkit package locally.

## Available Installation Methods

### Method 1: npm link (Recommended for Development) ⭐

Creates symlinks between toolkit and services. Changes are immediately available.

**Pros:**
- ✅ Instant updates - changes to toolkit immediately available in all services
- ✅ No rebuild/reinstall needed after changes
- ✅ Perfect for active development
- ✅ Easy to set up

**Cons:**
- ⚠️ Uses symlinks (not real installations)
- ⚠️ May behave slightly differently than production

### Method 2: npm pack (Real Installations)

Creates tarball and installs in each service like a published package.

**Pros:**
- ✅ Real installations, not symlinks
- ✅ Closer to production behavior
- ✅ Good for testing before publishing

**Cons:**
- ⚠️ Must reinstall after every toolkit change
- ⚠️ Slower development iteration

### Method 3: npm Registry (Production)

Publish to npm registry (GitHub Packages, Verdaccio, or npmjs.com).

**Pros:**
- ✅ Production-ready
- ✅ Version management
- ✅ Works across different machines/projects

**Cons:**
- ⚠️ Requires registry setup
- ⚠️ Must publish for every change

---

## Installation Scripts

All scripts are located in `packages/toolkit/`:

| Script | Purpose |
|--------|---------|
| `install-local.sh` | Build and create npm link |
| `link-all-services.sh` | Link toolkit to all services |
| `pack-and-install.sh` | Pack and install as tarball |
| `unlink-all.sh` | Remove all npm links |

---

## Method 1: Using npm link

### Step 1: Install and Link Toolkit

```bash
cd packages/toolkit
./install-local.sh
```

**What it does:**
1. Builds the toolkit (if build script exists)
2. Creates a global npm link: `npm link`
3. Makes `@oms/toolkit` available globally on your system

**Output:**
```
======================================
Installing @oms/toolkit locally
======================================

📦 Building @oms/toolkit...

🔗 Creating npm link for @oms/toolkit...

✅ SUCCESS! @oms/toolkit is now available locally

To use it in a service, run:
  cd services/users-service
  npm link @oms/toolkit

Or use the link-all-services.sh script to link all services at once.
```

### Step 2: Link to All Services

```bash
./link-all-services.sh
```

**What it does:**
1. Finds all services in `services/` directory
2. For each service with `@oms/toolkit` dependency:
   - Runs `npm link @oms/toolkit`
   - Creates symlink from service's `node_modules/@oms/toolkit` to global link

**Output:**
```
======================================
Linking @oms/toolkit to all services
======================================

🔗 Linking @oms/toolkit to users-service...
🔗 Linking @oms/toolkit to products-service...
🔗 Linking @oms/toolkit to orders-service...
🔗 Linking @oms/toolkit to payments-service...
🔗 Linking @oms/toolkit to bff-web...
🔗 Linking @oms/toolkit to bff-mobile...

======================================
✅ SUCCESS!
Linked @oms/toolkit to 6 service(s)
======================================

Services are now using the local @oms/toolkit package.
Any changes to toolkit will be immediately available to all services.
```

### Step 3: Verify

```bash
# Check if toolkit is linked in a service
cd ../../services/users-service
ls -la node_modules/@oms/toolkit
# Should show: lrwxr-xr-x ... node_modules/@oms/toolkit -> ...
```

### Making Changes to Toolkit

```bash
# 1. Edit toolkit code
cd packages/toolkit/src
# ... make changes ...

# 2. Rebuild
cd ..
npm run build

# 3. Changes are immediately available in all services!
# No need to reinstall
```

### Unlinking (Cleanup)

```bash
cd packages/toolkit
./unlink-all.sh
```

**What it does:**
1. Unlinks toolkit from all services
2. Removes global npm link
3. Services return to using npm registry version (if installed)

---

## Method 2: Using npm pack

### Pack and Install

```bash
cd packages/toolkit
./pack-and-install.sh
```

**What it does:**
1. Builds the toolkit
2. Creates tarball: `npm pack` → `oms-toolkit-1.0.0.tgz`
3. Installs tarball in each service: `npm install <tarball>`
4. Cleans up tarball

**Output:**
```
======================================
Packing and installing @oms/toolkit
======================================

📦 Building @oms/toolkit...

📦 Creating tarball...
Created: oms-toolkit-1.0.0.tgz

Installing in services...

📥 Installing in users-service...
📥 Installing in products-service...
📥 Installing in orders-service...
📥 Installing in payments-service...
📥 Installing in bff-web...
📥 Installing in bff-mobile...

🧹 Cleaning up tarball...

======================================
✅ SUCCESS!
Installed @oms/toolkit in 6 service(s)
======================================

Note: This creates actual installations, not symlinks.
To update toolkit in services, run this script again.
```

### Making Changes to Toolkit

```bash
# 1. Edit toolkit code
cd packages/toolkit/src
# ... make changes ...

# 2. Rebuild and reinstall
cd ..
./pack-and-install.sh
```

**Note:** Must run `pack-and-install.sh` after every change!

---

## Method 3: Publishing to Registry

### Option A: GitHub Packages

**1. Update package.json:**
```json
{
  "name": "@your-org/oms-toolkit",
  "version": "1.0.0",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/oms-toolkit.git"
  }
}
```

**2. Create `.npmrc` in each service:**
```
@your-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

**3. Authenticate:**
```bash
npm login --registry=https://npm.pkg.github.com
```

**4. Publish:**
```bash
cd packages/toolkit
npm run build
npm publish
```

**5. Install in services:**
```bash
cd services/users-service
npm install @your-org/oms-toolkit@^1.0.0
```

### Option B: Verdaccio (Private Registry)

**1. Install and start Verdaccio:**
```bash
npm install -g verdaccio
verdaccio
# Runs on http://localhost:4873
```

**2. Publish toolkit:**
```bash
cd packages/toolkit
npm run build
npm publish --registry http://localhost:4873
```

**3. Configure services to use Verdaccio:**

Create `.npmrc` in each service:
```
registry=http://localhost:4873
```

**4. Install in services:**
```bash
cd services/users-service
npm install @oms/toolkit@^1.0.0
```

### Option C: npmjs.com (Public)

**1. Update package.json:**
```json
{
  "name": "@your-username/oms-toolkit",
  "version": "1.0.0"
}
```

**2. Login to npm:**
```bash
npm login
```

**3. Publish:**
```bash
cd packages/toolkit
npm run build
npm publish --access public
```

**4. Install in services:**
```bash
npm install @your-username/oms-toolkit@^1.0.0
```

---

## Comparison Table

| Feature | npm link | npm pack | Registry |
|---------|----------|----------|----------|
| Setup complexity | Easy | Easy | Medium |
| Install speed | Fast | Medium | Medium |
| Real installation | ❌ Symlink | ✅ Yes | ✅ Yes |
| Auto-updates | ✅ Yes | ❌ No | ❌ No |
| Version management | ❌ No | ❌ No | ✅ Yes |
| Works across machines | ❌ No | ❌ No | ✅ Yes |
| Best for | Development | Testing | Production |

---

## Recommended Workflow

### For Local Development
1. Use `npm link` for fast iteration
2. Make changes, rebuild, test immediately

### Before Committing
1. Test with `npm pack` to ensure packaging works
2. Verify all services work with packed version

### For Production
1. Publish to registry (GitHub Packages or Verdaccio)
2. Services install specific versions
3. Use semantic versioning

---

## Troubleshooting

### "Cannot find module '@oms/toolkit'"

**If using npm link:**
```bash
cd packages/toolkit
./install-local.sh
./link-all-services.sh
```

**If using npm pack:**
```bash
cd packages/toolkit
./pack-and-install.sh
```

### "Module not found" after toolkit changes

**If using npm link:**
```bash
cd packages/toolkit
npm run build
# Changes should be available immediately
```

**If using npm pack:**
```bash
cd packages/toolkit
./pack-and-install.sh
# Must reinstall after every change
```

### Symlink issues on Windows

npm link may have issues on Windows. Use npm pack instead:
```bash
cd packages/toolkit
./pack-and-install.sh
```

### Clean slate

```bash
# 1. Unlink everything
cd packages/toolkit
./unlink-all.sh

# 2. Remove node_modules from all services
rm -rf ../../services/*/node_modules

# 3. Fresh install
npm install  # In each service

# 4. Relink
./install-local.sh
./link-all-services.sh
```

---

## Quick Reference

```bash
# Initial setup
cd packages/toolkit
./install-local.sh && ./link-all-services.sh

# After toolkit changes (with npm link)
npm run build

# After toolkit changes (with npm pack)
./pack-and-install.sh

# Cleanup
./unlink-all.sh
```
