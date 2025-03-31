FROM oven/bun:latest

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the TypeScript code
RUN bun run build

# Create necessary directories
RUN mkdir -p cache output

# Set environment variables (these will be overridden by container ENV)
ENV NODE_ENV=production

# Run as a service
CMD ["bun", "start"]
