FROM nginx
RUN rm /etc/nginx/nginx.conf
COPY /dist/Malawi_IMS /usr/share/nginx/html

COPY sslconfig/nginx.conf /etc/nginx/
COPY sslconfig/tandt-application.conf /etc/nginx/conf.d/
COPY sslconfig/nginx.conf /usr/share/nginx/html/images/
