FROM nginx:alpine

# Cloud Run defaults PORT to 8080
ENV PORT=8080

# Remove default configuration
RUN rm -rf /etc/nginx/conf.d/*

# Copy configuration template so nginx's envsubst startup script dynamically binds to $PORT
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy web assets
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
