#!/bin/sh

# Get backend URL from environment variable or use default
export BACKEND_URL=${BACKEND_URL:-http://server:5000}

# Replace environment variables in nginx.conf using envsubst
# This replaces ${BACKEND_URL} with the actual value
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"
