#!/bin/sh

# Get backend URL from environment variable or use default
BACKEND_URL=${BACKEND_URL:-http://server:5000}

# Remove trailing slash if present
BACKEND_URL=$(echo "$BACKEND_URL" | sed 's|/$||')

# Export for envsubst
export BACKEND_URL

# Debug: Print the backend URL (remove in production if needed)
echo "Using BACKEND_URL: $BACKEND_URL"

# Ensure template exists
if [ ! -f /etc/nginx/conf.d/default.conf.template ]; then
    echo "ERROR: Template file not found!"
    exit 1
fi

# Remove any existing default.conf to avoid conflicts
rm -f /etc/nginx/conf.d/default.conf

# Replace environment variables in nginx.conf using envsubst
# This replaces ${BACKEND_URL} with the actual value
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Verify the replacement worked
if ! grep -q "$BACKEND_URL" /etc/nginx/conf.d/default.conf; then
    echo "ERROR: Failed to replace BACKEND_URL in nginx config"
    echo "Generated config:"
    cat /etc/nginx/conf.d/default.conf
    exit 1
fi

# Test nginx configuration
nginx -t || {
    echo "ERROR: Nginx configuration test failed"
    echo "Generated config:"
    cat /etc/nginx/conf.d/default.conf
    exit 1
}

# Start nginx
exec nginx -g "daemon off;"
