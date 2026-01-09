#!/bin/bash

# unlink-all.sh
# Removes npm link from all services and the global link
# Use this to clean up npm links

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/../.."
SERVICES_DIR="$PROJECT_ROOT/services"

echo "======================================"
echo "Unlinking @oms/toolkit"
echo "======================================"

# Counter for unlinked services
unlinked_count=0

# Unlink from all services
echo ""
echo "Unlinking from services..."

for service_dir in "$SERVICES_DIR"/*; do
    if [ -d "$service_dir" ] && [ -f "$service_dir/package.json" ]; then
        service_name=$(basename "$service_dir")

        # Check if service depends on @oms/toolkit
        if grep -q "@oms/toolkit" "$service_dir/package.json"; then
            echo ""
            echo "🔓 Unlinking from $service_name..."
            cd "$service_dir"
            npm unlink @oms/toolkit 2>/dev/null || echo "  (already unlinked)"
            unlinked_count=$((unlinked_count + 1))
        fi
    fi
done

# Remove global link
echo ""
echo "🔓 Removing global npm link..."
cd "$SCRIPT_DIR"
npm unlink 2>/dev/null || echo "  (already unlinked)"

echo ""
echo "======================================"
echo "✅ SUCCESS!"
echo "Unlinked @oms/toolkit from $unlinked_count service(s)"
echo "======================================"
echo ""
echo "To reinstall dependencies normally, run 'npm install' in each service."
