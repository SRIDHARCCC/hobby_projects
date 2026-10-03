FROM nginx:alpine

ENV PORT=8080

RUN rm -rf /etc/nginx/conf.d/*

COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY *.js /usr/share/nginx/html/

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
