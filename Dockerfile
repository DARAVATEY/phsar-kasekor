# Stage 1: Build the React application
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy built files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Cloud Run defaults to port 8080
ENV PORT 8080
EXPOSE 8080

# Use envsubst to replace $PORT in the config before starting Nginx
CMD ["sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
