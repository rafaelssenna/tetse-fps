FROM node:20-alpine

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/

# Build shared and server
WORKDIR /app/shared
RUN npm run build

WORKDIR /app/server
RUN npm run build

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "dist/index.js"]
