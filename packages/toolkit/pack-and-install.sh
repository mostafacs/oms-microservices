#!/bin/bash

# pack-and-install.sh
# Alternative to npm link - creates a tarball and installs it in all services
# Use this if you prefer actual installations over symlinks

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../.."
SERVICES_DIR="$PROJECT_ROOT/services"

cd "$SCRIPT_DIR"

echo "======================================"
echo "Packing and installing @oms/toolkit"
echo "======================================"

# Build the package (if build script exists)
if grep -q '"build"' package.json; then
    echo ""
    echo "📦 Building @oms/toolkit..."
    npm run build
else
    echo ""
    echo "⚠️  No build script found, skipping build step"
fi

# Create tarball
echo ""
echo "📦 Creating tarball..."
TARBALL=$(npm pack)
echo "Created: $TARBALL"

# Get the full path to the tarball
TARBALL_PATH="$SCRIPT_DIR/$TARBALL"

# Counter for installed services
installed_count=0

# Install in all services
echo ""
echo "Installing in services..."

for service_dir in "$SERVICES_DIR"/*; do
    if [ -d "$service_dir" ] && [ -f "$service_dir/package.json" ]; then
        service_name=$(basename "$service_dir")

        # Check if service depends on @oms/toolkit
        if grep -q "@oms/toolkit" "$service_dir/package.json"; then
            echo ""
            echo "📥 Installing in $service_name..."
            cd "$service_dir"
            npm install "$TARBALL_PATH"
            installed_count=$((installed_count + 1))
        else
            echo ""
            echo "⏭️  Skipping $service_name (no @oms/toolkit dependency)"
        fi
    fi
done

# Clean up tarball
echo ""
echo "🧹 Cleaning up tarball..."
rm "$TARBALL_PATH"

echo ""
echo "======================================"
echo "✅ SUCCESS!"
echo "Installed @oms/toolkit in $installed_count service(s)"
echo "======================================"
echo ""
echo "Note: This creates actual installations, not symlinks."
echo "To update toolkit in services, run this script again."
