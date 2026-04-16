<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS-Cloud-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" />
</p>

<h1 align="center">🛒 SLIFE — Student Life Marketplace</h1>

<p align="center">
  <b>Nền tảng mua bán & cộng đồng dành cho sinh viên</b><br/>
  Real-time chat · Đăng tin · Giao dịch · Cộng đồng · Quản trị
</p>

<p align="center">
  <a href="#-tính-năng-chính">Tính năng</a> •
  <a href="#-kiến-trúc-hệ-thống">Kiến trúc</a> •
  <a href="#-công-nghệ-sử-dụng">Công nghệ</a> •
  <a href="#-cấu-trúc-dự-án">Cấu trúc</a> •
  <a href="#-cài-đặt--chạy-dự-án">Cài đặt</a> •
  <a href="#-api-documentation">API Docs</a> •
  <a href="#-triển-khai-aws">AWS</a>
</p>

---

## 📸 Tổng quan

**SLIFE** là nền tảng marketplace full-stack dành cho sinh viên, cho phép đăng bán sản phẩm, trao đổi trực tiếp qua chat real-time, thương lượng giá, hẹn giao hàng, và tham gia cộng đồng. Hệ thống được thiết kế với kiến trúc microservice-ready, hỗ trợ triển khai trên AWS với auto-scaling và high availability.

---

## ✨ Tính năng chính

### 🔐 Xác thực & Bảo mật
- Đăng ký / Đăng nhập bằng email & mật khẩu
- Đăng nhập bằng Google OAuth 2.0
- Xác minh số điện thoại qua Firebase OTP
- JWT Authentication với refresh token
- Rate limiting trên API nhạy cảm
- Token blacklist khi logout

### 📦 Quản lý tin đăng (Listings)
- CRUD tin đăng với upload nhiều ảnh
- Danh mục phân cấp (Category hierarchy)
- Tìm kiếm & lọc nâng cao
- Yêu thích (Like) & Lưu tin
- Tự động hết hạn tin đăng theo lịch
- Hiển thị vị trí trên bản đồ (VietMap)

### 💬 Chat Real-time
- WebSocket (STOMP/SockJS) cho nhắn tin tức thì
- Gửi ảnh trong chat
- Trích dẫn & trả lời tin nhắn
- Quản lý hội thoại theo tin đăng
- Thông báo tin nhắn mới

### 🤝 Giao dịch (Deals)
- Đề xuất giá & thương lượng
- Trạng thái giao dịch (pending → accepted → completed)
- Nhắc nhở hẹn lấy hàng (Pickup Reminder)
- Đánh giá sau giao dịch
- Xử lý race condition cho giao dịch đồng thời

### 🏘️ Cộng đồng (Community)
- Đăng bài viết cộng đồng
- Bình luận & trả lời bình luận
- Hashtag & tìm kiếm theo hashtag
- Lưu bài viết yêu thích
- Kiểm duyệt nội dung

### 👤 Hồ sơ người dùng
- Trang cá nhân với avatar & ảnh bìa
- Hệ thống uy tín (Reputation)
- Theo dõi (Follow) người dùng
- Chặn người dùng (Block)
- Lịch sử giao dịch

### 🛡️ Quản trị (Admin)
- Dashboard quản trị
- Quản lý người dùng (ban/unban)
- Kiểm duyệt tin đăng & bài viết
- Nhật ký hành động (Audit Logs)
- Cấu hình hệ thống động
- Quản lý báo cáo vi phạm

### 📧 Thông báo
- Email chào mừng người dùng mới
- Thông báo đề xuất giá
- Nhắc nhở giao hàng
- Hỗ trợ SMTP & Firebase Cloud Function relay

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React 19 + Vite + MUI 5                                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │   │
│  │  │   Auth   │ │ Listings │ │   Chat   │ │ Community  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│         HTTP/REST (Axios)          WebSocket (STOMP)            │
└────────────────────────┬──────────────────┬─────────────────────┘
                         │                  │
┌────────────────────────▼──────────────────▼─────────────────────┐
│                        NGINX REVERSE PROXY                      │
│              /api/* → Backend    /* → Frontend                  │
│              /ws/** → WebSocket Upgrade                         │
└────────────────────────┬──────────────────┬─────────────────────┘
                         │                  │
┌────────────────────────▼──────────────────▼─────────────────────┐
│                      BACKEND (Spring Boot 3.3.5)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │Controller│→│ Service  │→│Repository│→│   MySQL 8 (JPA)   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Security │ │Scheduler │ │  Cache   │ │  Redis 7 (Cache)  │  │
│  │  (JWT)   │ │(ShedLock)│ │ Manager  │ │                   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│  ┌──────────┐ ┌──────────────────────────────────────────────┐  │
│  │ Flyway   │ │  AWS S3 (Media Storage)                      │  │
│  │Migration │ │  Firebase (Phone Auth)                       │  │
│  └──────────┘ └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### AWS Production Architecture

```
User → Route 53 → CloudFront (SSL/CDN) → ALB
                                          ├── AZ1: EC2 (Docker) ──┐
                                          └── AZ2: EC2 (Docker) ──┤
                                                                   ├── ElastiCache Redis
                                                                   ├── RDS MySQL (Primary + Read Replica)
                                                                   └── S3 (via VPC Endpoint)
```

---

## 🛠️ Công nghệ sử dụng

### Backend
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| **Java** | 17 | Ngôn ngữ chính |
| **Spring Boot** | 3.3.5 | Framework backend |
| **Spring Security** | 6.x | Xác thực & phân quyền |
| **Spring Data JPA** | 3.x | ORM & truy vấn database |
| **Spring WebSocket** | 3.x | Chat real-time (STOMP) |
| **MySQL** | 8.0 | Cơ sở dữ liệu chính |
| **Redis** | 7 | Cache, session, distributed lock |
| **Flyway** | 10.x | Database migration |
| **ShedLock** | 5.16 | Distributed scheduled tasks |
| **JJWT** | 0.12.6 | JWT token |
| **AWS S3 SDK** | 2.29 | Lưu trữ media |
| **SpringDoc OpenAPI** | 2.6.0 | API documentation |
| **Lombok** | — | Giảm boilerplate code |

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| **React** | 19.2 | UI framework |
| **Vite** | 7.3 | Build tool & dev server |
| **Material-UI** | 5.16 | Component library |
| **React Router** | 6.28 | Client-side routing |
| **Axios** | 1.7 | HTTP client |
| **STOMP.js** | 7.3 | WebSocket client |
| **Firebase** | 12.11 | Phone authentication |
| **VietMap GL** | 6.0 | Bản đồ Việt Nam |
| **React Hook Form** | 7.53 | Form management |
| **date-fns** | 4.1 | Date utilities |

### DevOps & Infrastructure
| Công nghệ | Mục đích |
|---|---|
| **Docker & Docker Compose** | Containerization |
| **Nginx** | Reverse proxy, SSL termination |
| **AWS EC2 + ALB** | Compute & load balancing |
| **AWS RDS MySQL** | Managed MySQL |
| **AWS ElastiCache** | Managed Redis |
| **AWS S3 + CloudFront** | Media storage & CDN |
| **AWS Route 53** | DNS management |
| **Firebase Cloud Functions** | Email relay service |

---

## 📁 Cấu trúc dự án

```
slife/
├── 📂 backend/                    # Spring Boot API Server
│   ├── 📂 src/main/java/com/slife/marketplace/
│   │   ├── 📂 config/            # Cấu hình (Security, WebSocket, Swagger, S3, ...)
│   │   ├── 📂 controller/        # REST API Controllers (25 controllers)
│   │   ├── 📂 dto/               # Data Transfer Objects
│   │   ├── 📂 entity/            # JPA Entities (40+ entities)
│   │   ├── 📂 exception/         # Custom exceptions & global handler
│   │   ├── 📂 repository/        # Spring Data JPA Repositories
│   │   ├── 📂 scheduler/         # Scheduled tasks (expiry, reminders)
│   │   ├── 📂 security/          # JWT filter, token provider, rate limiter
│   │   ├── 📂 service/           # Business logic (30+ services)
│   │   ├── 📂 util/              # Utility classes
│   │   └── SlifeApplication.java # Entry point
│   ├── 📂 src/main/resources/
│   │   ├── 📂 db/migration/      # Flyway SQL migrations (V1 → V25)
│   │   ├── application.properties
│   │   ├── application-dev.properties
│   │   └── application-prod.properties
│   ├── Dockerfile                 # Multi-stage build
│   └── pom.xml
│
├── 📂 frontend/                   # React SPA
│   ├── 📂 src/
│   │   ├── 📂 api/               # API client modules
│   │   ├── 📂 assets/            # Static assets
│   │   ├── 📂 components/        # Reusable UI components
│   │   │   ├── 📂 auth/          # Login, Register, OTP
│   │   │   ├── 📂 common/        # Shared components
│   │   │   ├── 📂 community/     # Community post components
│   │   │   ├── 📂 listing/       # Listing cards, forms
│   │   │   ├── 📂 layout/        # Header, Footer, Sidebar
│   │   │   └── 📂 social/        # Follow, Like, Share
│   │   ├── 📂 context/           # React Context (Auth, Toast, ...)
│   │   ├── 📂 hooks/             # Custom React hooks
│   │   ├── 📂 pages/             # Page components
│   │   │   ├── 📂 admin/         # Admin dashboard
│   │   │   ├── 📂 auth/          # Auth pages
│   │   │   ├── 📂 chat/          # Chat interface
│   │   │   ├── 📂 community/     # Community feed
│   │   │   ├── 📂 deal/          # Deal management
│   │   │   ├── 📂 listing/       # Listing pages
│   │   │   ├── 📂 notification/  # Notifications
│   │   │   └── 📂 profile/       # User profile
│   │   ├── 📂 routes/            # Route definitions
│   │   ├── 📂 theme/             # MUI theme customization
│   │   └── 📂 utils/             # Helper functions
│   └── package.json
│
├── 📂 deploy/                     # Deployment configs
│   ├── docker-compose.dev.yml     # Development (hot reload)
│   ├── docker-compose.prod.yml    # Production (SSL/HTTPS)
│   ├── .env.example               # Environment template
│   ├── 📂 nginx/                 # Nginx configs & SSL certs
│   └── 📂 mysql/                 # MySQL charset config
│
├── 📂 firebase/                   # Firebase Cloud Functions
│   └── 📂 functions/             # Email relay service
│
└── 📂 docs/                      # Documentation & diagrams
```

---

## 🚀 Cài đặt & Chạy dự án

### Yêu cầu hệ thống

- **Docker** >= 24.0 & **Docker Compose** >= 2.20
- **Java** 17+ (nếu chạy ngoài Docker)
- **Node.js** >= 18 (nếu chạy frontend ngoài Docker)
- **Git**

### 1. Clone repository

```bash
git clone https://github.com/your-org/slife.git
cd slife
```

### 2. Cấu hình biến môi trường

```bash
cd deploy
cp .env.example .env
```

Chỉnh sửa file `.env` với các giá trị phù hợp:

```env
# MySQL
MYSQL_DATABASE=slife_db
MYSQL_USER=slife
MYSQL_PASSWORD=your_password
MYSQL_ROOT_PASSWORD=your_root_password

# JWT
JWT_SECRET=your-strong-random-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# (Tùy chọn) AWS S3
# APP_STORAGE_MODE=s3
# AWS_S3_BUCKET=your-bucket
# AWS_REGION=ap-southeast-1
```

### 3a. Chạy Development (Hot Reload)

```bash
cd deploy
docker compose -f docker-compose.dev.yml up --build
```

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost |
| 🔌 API | http://localhost/api |
| 📖 Swagger UI | http://localhost/api/swagger-ui.html |
| 💾 MySQL | localhost:3307 |

> Frontend mount source code trực tiếp, sửa code sẽ hot reload ngay lập tức.

### 3b. Chạy Production

```bash
cd deploy

# Đặt SSL cert vào nginx/certs/
# fullchain.pem & privkey.pem

docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Kiểm tra health:
```bash
docker compose -f docker-compose.prod.yml ps
curl -k https://your-domain/actuator/health
```

### 4. Chạy riêng Backend (không Docker)

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### 5. Chạy riêng Frontend (không Docker)

```bash
cd frontend
npm install
npm run dev
```

---

## 📖 API Documentation

Sau khi chạy dự án, truy cập Swagger UI:

- **Dev:** http://localhost/api/swagger-ui.html
- **Direct:** http://localhost:8080/swagger-ui.html

### Các nhóm API chính

| Nhóm | Endpoint | Mô tả |
|---|---|---|
| 🔐 Auth | `/api/auth/*` | Đăng ký, đăng nhập, refresh token, Google OAuth |
| 📦 Listings | `/api/listings/*` | CRUD tin đăng, tìm kiếm, lọc |
| 💬 Chat | `/api/chat/*`, `/api/conversations/*` | Nhắn tin, quản lý hội thoại |
| 🤝 Deals | `/api/deals/*` | Giao dịch, đề xuất giá |
| 💰 Offers | `/api/offers/*` | Quản lý đề xuất giá |
| 🏘️ Community | `/api/community/*` | Bài viết, bình luận, hashtag |
| 👤 Users | `/api/users/*` | Hồ sơ, follow, block |
| ❤️ Likes | `/api/listings/*/like` | Yêu thích tin đăng |
| 🔖 Saved | `/api/saved-listings/*` | Lưu tin đăng |
| 🔔 Notifications | `/api/notifications/*` | Thông báo |
| 🚨 Reports | `/api/reports/*` | Báo cáo vi phạm |
| 🛡️ Admin | `/api/admin/*` | Quản trị hệ thống |
| 📊 Audit | `/api/admin/audit-logs/*` | Nhật ký hành động |
| 🗂️ Categories | `/api/categories/*` | Danh mục sản phẩm |
| 🔍 Search | `/api/search/*` | Tìm kiếm nâng cao |
| 📍 Location | `/api/locations/*`, `/api/geo/*` | Vị trí & bản đồ |

---

## 🗄️ Database Schema

Hệ thống sử dụng **Flyway** để quản lý database migration tự động (25 phiên bản).

### Các bảng chính

```
┌──────────┐     ┌───────────┐     ┌──────────┐
│  users   │────▶│ listings  │────▶│  deals   │
└──────────┘     └───────────┘     └──────────┘
     │                │                  │
     │           ┌────┴────┐        ┌────┴────┐
     │           │ images  │        │ offers  │
     │           └─────────┘        └─────────┘
     │
     ├──▶ conversations ──▶ messages
     ├──▶ community_posts ──▶ comments
     ├──▶ follows
     ├──▶ blocks
     ├──▶ notifications
     ├──▶ reports
     └──▶ audit_logs
```

### Migration highlights
- `V1` — Schema khởi tạo (users, listings, categories, ...)
- `V3` — Chat system (conversations, messages)
- `V6` — Listing likes
- `V10` — Category hierarchy seeding
- `V13` — Phone verification
- `V18` — Community posts
- `V25` — Deal timeout & review window

---

## ☁️ Triển khai AWS

### Kiến trúc Multi-AZ

```
                    ┌─────────────┐
                    │  Route 53   │
                    │    (DNS)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ CloudFront  │
                    │ (CDN + SSL) │
                    └──────┬──────┘
                           │
                ┌──────────▼──────────┐
                │         ALB         │
                │  (Load Balancer)    │
                └────┬───────────┬────┘
                     │           │
              ┌──────▼──┐  ┌────▼─────┐
              │  AZ 1   │  │   AZ 2   │
              │┌───────┐│  │┌────────┐│
              ││EC2+   ││  ││EC2+    ││
              ││Docker ││  ││Docker  ││
              │└───────┘│  │└────────┘│
              └────┬────┘  └────┬─────┘
                   │            │
         ┌─────────▼────────────▼──────────┐
         │     ElastiCache Redis Cluster   │
         └─────────────────────────────────┘
                        │
         ┌──────────────▼──────────────────┐
         │  RDS MySQL (Primary+Read Replica)│
         └─────────────────────────────────┘
                        │
         ┌──────────────▼──────────────────┐
         │    S3 (via VPC Endpoint)        │
         └─────────────────────────────────┘
```

### Dịch vụ AWS sử dụng

| Dịch vụ | Vai trò |
|---|---|
| **EC2 + Auto Scaling** | Application servers |
| **ALB** | Load balancing & health check |
| **RDS MySQL** | Database (primary + read replica) |
| **ElastiCache Redis** | Caching & distributed lock |
| **S3** | Media storage (ảnh listing, avatar, chat) |
| **CloudFront** | CDN & SSL termination |
| **Route 53** | DNS management |
| **ACM** | SSL certificate management |
| **VPC** | Network isolation |

---

## 🔧 Cấu hình nâng cao

### Storage Mode

```properties
# Local storage (mặc định cho dev)
app.storage.mode=local

# AWS S3 (production)
app.storage.mode=s3
```

### Email Transport

```properties
# SMTP trực tiếp
spring.mail.host=smtp.gmail.com
spring.mail.port=587

# Hoặc qua Firebase Cloud Function
app.mail.transport=http
app.mail.http.url=https://your-project.cloudfunctions.net/sendSlifeMail
```

### Monitoring

Actuator endpoints được expose:
- `/actuator/health` — Health check (liveness & readiness probes)
- `/actuator/info` — Application info
- `/actuator/metrics` — Metrics
- `/actuator/prometheus` — Prometheus scraping

---

## 🧪 Testing

```bash
# Backend unit tests
cd backend
./mvnw test

# Frontend tests
cd frontend
npm run test
```

---

## 👥 Đội ngũ phát triển

| Thành viên |
|---|
| Lã Thanh Hoa |
| Đỗ Thành An |
| Lê Hoàng Tú |
| Trần Thị Ngọc Ánh |
| Lê Đức Việt |

---

## 📄 License

Dự án này được phát triển cho mục đích học tập và nghiên cứu.

---

<p align="center">
  Made with ❤️ by <b>SLIFE Team</b>
</p>
