FROM node:20-alpine

WORKDIR /app

# Copy all package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install --workspace=shared --workspace=server

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/

# Build shared first, then server
RUN npm run build --workspace=shared
RUN npm run build --workspace=server

# Expose port
EXPOSE 8080

WORKDIR /app/server

# Start server
CMD ["node", "dist/index.js"]
