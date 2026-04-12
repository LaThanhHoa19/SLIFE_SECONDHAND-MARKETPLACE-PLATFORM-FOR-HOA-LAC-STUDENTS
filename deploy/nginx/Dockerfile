# Image Nginx cho Docker Compose (upstream backend + frontend — chỉ dùng trong mạng compose).
# EC2 đơn lẻ: dùng Dockerfile.ec2 → tag :ec2 + --add-host=host.docker.internal:host-gateway
#
# Build: cd deploy/nginx && docker build -t anan49/slife-nginx:v1 .
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf
