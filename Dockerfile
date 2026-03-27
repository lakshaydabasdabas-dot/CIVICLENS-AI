# Use Node
FROM node:20-alpine

# Set working dir
WORKDIR /app

# Copy root files
COPY package*.json ./
RUN npm install --production

# Copy everything
COPY . .

# -------- BUILD FRONTEND --------
WORKDIR /app/FRONTEND
RUN npm install && npm run build

# -------- BACK TO ROOT --------
WORKDIR /app

# Expose port
EXPOSE 8080

# Start backend
CMD ["node", "server.js"]