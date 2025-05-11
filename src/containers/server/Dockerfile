# Use Node.js LTS as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install TypeScript types, js-yaml, and module-alias for path resolution
RUN npm install --save-dev @types/node @types/uuid js-yaml
RUN npm install --save module-alias

# Copy TypeScript config
COPY tsconfig.json ./

# Copy source code (except common directory, which will be mounted)
COPY . .

# Create data directories
RUN mkdir -p /app/data/sessions

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Start the app with debugging information
CMD ["sh", "-c", "npm run build && \
     echo '{\"_moduleAliases\": {\"@common\": \"../src/common\"}}' > dist/package.json && \
     ls -la dist && \
     ls -la src/common && \
     ls -la . && \
     node dist/index.js"]
