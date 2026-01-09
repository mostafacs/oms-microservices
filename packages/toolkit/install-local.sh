#!/bin/bash

# install-local.sh
# Packages and installs @oms/toolkit to local npm using npm link
# This makes the toolkit available to all services without publishing to a registry

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================"
echo "Installing @oms/toolkit locally"
echo "======================================"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in $SCRIPT_DIR"
    exit 1
fi

# Build the package (if build script exists)
if grep -q '"build"' package.json; then
    echo ""
    echo "📦 Building @oms/toolkit..."
    npm run build
else
    echo ""
    echo "⚠️  No build script found, skipping build step"
fi

# Create npm link
echo ""
echo "🔗 Creating npm link for @oms/toolkit..."
npm link

echo ""
echo "✅ SUCCESS! @oms/toolkit is now available locally"
echo ""
echo "To use it in a service, run:"
echo "  cd services/users-service"
echo "  npm link @oms/toolkit"
echo ""
echo "Or use the link-all-services.sh script to link all services at once."
