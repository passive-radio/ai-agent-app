# Use Node.js LTS as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

RUN npx expo install @expo/metro-runtime

# Install Metro bundler and related packages
RUN npm install metro metro-core metro-runtime metro-babel-transformer metro-react-native-babel-transformer

# Copy source code
COPY . .

# Build the app
RUN npx expo export --platform web

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Start the app
CMD ["npx", "expo", "start", "--web", "--lan", "--port", "3000"]
