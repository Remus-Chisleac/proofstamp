# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# RUN npm ci
RUN npm i

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose port
EXPOSE 80

# Start nginx with dynamic backend URL
CMD ["/start.sh"]

