# SLIFE Frontend Skeleton (React + Vite + MUI v5)

## Mục tiêu
Bộ khung frontend để team/AI tiếp tục triển khai UI, state management, gọi API và tích hợp realtime cho SLIFE.

## API contract mẫu
- `GET /api/listings` trả về:
```json
{
  "content": [
    { "listingId": 123, "title": "...", "price": 1200000, "isGiveaway": false, "seller": { "userId": 2, "fullName": "Alice" }, "images": ["..."] }
  ],
  "page": 0,
  "size": 10,
  "totalElements": 100,
  "totalPages": 10
}
```
- `POST /api/listings` nhận metadata JSON trước.
- `POST /api/listings/{id}/images` upload ảnh bằng `multipart/form-data`.

## Realtime & notification
- Ưu tiên `socket.io-client` với token auth từ `AuthContext`.
- Fallback polling 30s tại `useNotifications`.

## Validation
- Khuyến nghị dùng `react-hook-form`.
- Bổ sung check từ `/api/configurations` hoặc `/api/banned_keywords` trước submit listing.

## Build & deploy
- Dev: `npm run dev`
- Build: `npm run build`
- Deploy static: Nginx hoặc copy vào Spring Boot static resources.
