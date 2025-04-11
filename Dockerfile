FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install Python for scripts
RUN apk add --no-cache python3 g++ make

# Copy package files first (for better caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["npm", "start"]