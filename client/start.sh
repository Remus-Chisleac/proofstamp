#!/bin/sh

# Get backend URL from environment variable or use default
BACKEND_URL=${BACKEND_URL:-http://server:5000}

# Replace the backend URL in nginx.conf
sed -i "s|proxy_pass http://server:5000/api/;|proxy_pass ${BACKEND_URL}/api/;|g" /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"

