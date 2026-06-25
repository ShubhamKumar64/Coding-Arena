FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy rest of application code
COPY . .

# Expose the port the app runs on (default 3000)
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start"]
