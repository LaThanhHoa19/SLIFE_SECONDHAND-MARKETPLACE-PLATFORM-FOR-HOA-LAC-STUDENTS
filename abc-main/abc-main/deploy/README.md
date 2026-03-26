# Production Docker setup (Linux server)

## Cấu trúc thư mục

```text
project-root/
├── backend/
│   ├── Dockerfile
│   └── src/main/resources/application-{dev,prod}.properties
├── frontend/
│   ├── Dockerfile
│   └── nginx/default.conf
└── deploy/
    ├── docker-compose.dev.yml
    ├── docker-compose.prod.yml
    ├── .env.example
    ├── mysql/conf.d/
    └── nginx/
        ├── nginx.conf
        ├── certs/
        │   ├── fullchain.pem
        │   └── privkey.pem
        └── conf.d/
            ├── default.conf
            └── default.dev.conf
```

## Dev mode (localhost không cần port + live reload)

> Dùng mode này khi code UI để luôn nhận bản mới nhất mà không cần rebuild frontend image sau mỗi lần sửa.

```bash
cd deploy
docker compose -f docker-compose.dev.yml up --build
```

Sau khi chạy:
- App: `http://localhost`
- API qua Nginx: `http://localhost/api/*`
- Frontend chạy Vite trong container và mount source `../frontend`, nên sửa code sẽ hot reload ngay.

## Production mode (build image mới khi chạy)


1. Copy biến môi trường:

```bash
cd deploy
cp .env.example .env
nano .env
```

2. Cấu hình SSL certificate:

- Đặt cert thật vào `deploy/nginx/certs/fullchain.pem` và `deploy/nginx/certs/privkey.pem`.
- Có thể dùng Let's Encrypt rồi mount file vào đúng path ở trên.

3. Build và chạy production:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```
`docker-compose.prod.yml` đã bật `pull_policy: build` cho backend/frontend, nên khi bấm run lại compose sẽ ưu tiên build image local mới từ source hiện tại.

4. Kiểm tra health:

```bash
docker compose -f docker-compose.prod.yml ps
curl -k https://<server-domain>/actuator/health
```

## Gợi ý vận hành

- Dùng firewall (UFW/security group) chỉ mở 80/443.
- Backup volume `mysql_data` định kỳ.
- Cập nhật image theo chu kỳ bảo mật.
