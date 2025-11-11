# Overall comment explaining the Dockerfile purpose: Multi-stage build for production
# Start the builder stage using Node.js Alpine image
FROM node:18-alpine as builder

# Set the working directory inside the container
WORKDIR /app

# Copy package files to install dependencies
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm ci

# Copy the entire source code to the container
COPY . .

# Build the application using Vite
RUN npm run build

# Comment for the production stage
# Start the production stage using Nginx Alpine image
FROM nginx:alpine

# Comment explaining the copy operation
# Copy the built dist folder from builder to Nginx's html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Comment for nginx config copy
# Copy custom nginx config to override default
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 for the web server
EXPOSE 8080

# Start Nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]