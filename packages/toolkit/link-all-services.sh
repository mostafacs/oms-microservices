#!/bin/bash

# link-all-services.sh
# Links @oms/toolkit to all services in the project
# Run this AFTER running install-local.sh

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../.."
SERVICES_DIR="$PROJECT_ROOT/services"

echo "======================================"
echo "Linking @oms/toolkit to all services"
echo "======================================"

# Check if services directory exists
if [ ! -d "$SERVICES_DIR" ]; then
    echo "❌ Error: services directory not found at $SERVICES_DIR"
    exit 1
fi

# Counter for linked services
linked_count=0

# Loop through all service directories
for service_dir in "$SERVICES_DIR"/*; do
    if [ -d "$service_dir" ] && [ -f "$service_dir/package.json" ]; then
        service_name=$(basename "$service_dir")

        # Check if service depends on @oms/toolkit
        if grep -q "@oms/toolkit" "$service_dir/package.json"; then
            echo ""
            echo "🔗 Linking @oms/toolkit to $service_name..."
            cd "$service_dir"
            npm link @oms/toolkit
            linked_count=$((linked_count + 1))
        else
            echo ""
            echo "⏭️  Skipping $service_name (no @oms/toolkit dependency)"
        fi
    fi
done

echo ""
echo "======================================"
echo "✅ SUCCESS!"
echo "Linked @oms/toolkit to $linked_count service(s)"
echo "======================================"
echo ""
echo "Services are now using the local @oms/toolkit package."
echo "Any changes to toolkit will be immediately available to all services."
