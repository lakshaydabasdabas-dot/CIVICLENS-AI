# Use official Node.js runtime
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of the app
COPY . .

# Expose Cloud Run port
EXPOSE 8080

# Start app
CMD ["node", "server.js"]
