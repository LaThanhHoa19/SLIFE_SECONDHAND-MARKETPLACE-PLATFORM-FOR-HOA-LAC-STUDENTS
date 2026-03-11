# SLIFE backend skeleton

Xem `application.properties` và chạy `./mvnw spring-boot:run`.

## Chạy full môi trường dev (backend + frontend Vite live reload)

Từ thư mục `backend`, chạy:

```bash
docker compose up --build
```

Sau khi lên xong:
- Backend API: `http://localhost:8080`
- Frontend Vite (live reload): `http://localhost:5173`
