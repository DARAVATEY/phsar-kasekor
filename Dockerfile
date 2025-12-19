# Stage 1: Build the React/Vite app
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:stable-alpine
# Copy the built files from the first stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom nginx config as a template
COPY nginx.conf /etc/nginx/conf.d/configfile.template

# Cloud Run defaults to port 8080
ENV PORT 8080
ENV HOST 0.0.0.0
EXPOSE 8080

# Substitute $PORT in the template and start Nginx
CMD ["sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/configfile.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
