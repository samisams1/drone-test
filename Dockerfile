# Use official lightweight Node.js Linux image
FROM node:20-alpine

# Create app directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy your application files
COPY dashboard-server.js drone-simulator.js index.html ./

# Expose the web dashboard port
EXPOSE 3000

# Default startup command
CMD ["node", "dashboard-server.js"]
