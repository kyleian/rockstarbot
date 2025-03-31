# Use Node.js v22 as the base image
FROM node:22

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the application port (if needed)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
