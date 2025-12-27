FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# RUN npm ci --only=production
RUN npm i

# Copy application code
COPY . .

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]

