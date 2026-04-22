# SLIFE — AWS Infrastructure Guide

## Mục lục

- [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
- [Chi tiết từng AWS Service](#chi-tiết-từng-aws-service)
- [CloudFormation Stack](#cloudformation-stack)
- [Lệnh Deploy](#lệnh-deploy)
- [Sau khi deploy](#sau-khi-deploy)
- [Frontend (S3)](#frontend-s3)
- [Chi phí ước tính](#chi-phí-ước-tính)
- [Tạm dừng để tiết kiệm chi phí](#tạm-dừng-để-tiết-kiệm-chi-phí)
- [Khởi động lại](#khởi-động-lại)
- [Xóa toàn bộ stack](#xóa-toàn-bộ-stack)

---

## Tổng quan kiến trúc

```
User truy cập https://slife.click
         │
    ┌────▼─────┐
    │ Route 53 │  DNS: slife.click → CloudFront
    └────┬─────┘
         │
    ┌────▼──────────┐
    │  CloudFront   │  CDN + SSL (HTTPS)
    │  (CDN)        │  ACM Certificate: *.slife.click
    └──┬────┬────┬──┘
       │    │    │
       │    │    └──── /media/*  → S3 Media Bucket (ảnh listing, avatar, chat)
       │    │
       │    └───────── /api/*    → ALB → EC2 #1 hoặc EC2 #2 (Spring Boot)
       │                /chat*   → ALB → EC2 #1 hoặc EC2 #2 (WebSocket)
       │
       └────────────── /*        → S3 Frontend (React SPA)

    ┌─────────────────────────────────────────────┐
    │              ALB (Load Balancer)             │
    │         slife-alb (port 80 + 443)           │
    └──────┬──────────────────┬───────────────────┘
           │                  │
    ┌──────▼──────┐    ┌──────▼──────┐
    │  EC2 #1     │    │  EC2 #2     │
    │  AZ1c       │    │  AZ1a       │
    │  t3.micro   │    │  t3.micro   │
    │  Docker:    │    │  Docker:    │
    │  Spring Boot│    │  Spring Boot│
    │  (port 8080)│    │  (port 8080)│
    └──────┬──────┘    └──────┬──────┘
           │                  │
           └────────┬─────────┘
                    │
    ┌───────────────▼───────────────┐
    │     ElastiCache Redis         │
    │     slife-redis               │
    │     cache.t3.micro            │
    │     (cache + distributed lock)│
    └───────────────────────────────┘
                    │
    ┌───────────────▼───────────────┐
    │     RDS MySQL 8.4             │
    │     database-1                │
    │     db.t4g.micro              │
    │     (database chính)          │
    └───────────────────────────────┘
                    │
    ┌───────────────▼───────────────┐
    │     S3 Media Bucket           │
    │     slife-media-prod          │
    │     (ảnh listing, avatar,     │
    │      chat images)             │
    └───────────────────────────────┘
```

---

## Chi tiết từng AWS Service

### 1. Route 53 — DNS

| | |
|---|---|
| **Vai trò** | Quản lý tên miền `slife.click`, trỏ về CloudFront |
| **Với SLIFE** | User gõ `slife.click` → Route 53 resolve → CloudFront distribution |
| **Chi phí** | ~$0.50/tháng cho hosted zone + $12/năm cho domain |

### 2. CloudFront — CDN + SSL

| | |
|---|---|
| **Distribution ID** | `E1CDV47LE8AY0A` |
| **Domain** | `d2kmitf5oxoa2e.cloudfront.net` → `slife.click` |
| **Vai trò** | CDN toàn cầu, SSL termination (HTTPS), routing request |
| **Với SLIFE** | Nhận mọi request từ user, phân phối đến đúng origin |

**Cache Behaviors (routing rules):**

| Path Pattern | Origin | Mô tả |
|---|---|---|
| `/*` (default) | S3 Frontend | React SPA (index.html, JS, CSS) |
| `/api/*` | ALB Backend | REST API (Spring Boot) |
| `/chat*` | ALB Backend | WebSocket SockJS (real-time chat) |
| `/media/*` | S3 Media | Ảnh listing, avatar, chat images |

**SSL:** ACM Certificate `arn:aws:acm:us-east-1:...:certificate/be65250c-...` (phải ở us-east-1 cho CloudFront)

### 3. ALB — Application Load Balancer

| | |
|---|---|
| **Tên** | `slife-alb` |
| **DNS** | `slife-alb-1698605089.ap-southeast-1.elb.amazonaws.com` |
| **Vai trò** | Phân tải request giữa 2 EC2, health check, sticky session |
| **Với SLIFE** | CloudFront gửi `/api/*` và `/chat*` → ALB → EC2 #1 hoặc #2 |

**Target Group:** `slife-backend-tg`
- Port: 8080
- Health check: `GET /actuator/health` (mỗi 30s)
- Sticky session: enabled (cookie 24h) — đảm bảo WebSocket chat không bị đổi server giữa chừng
- 2 targets: EC2 #1 + EC2 #2

**Listeners:**
- Port 80 (HTTP) → redirect 301 → HTTPS 443
- Port 443 (HTTPS) → forward → Target Group (ACM cert `arn:aws:acm:ap-southeast-1:...:certificate/d26e2108-...`)

### 4. EC2 — Application Servers

| | EC2 #1 (có sẵn) | EC2 #2 (CloudFormation tạo) |
|---|---|---|
| **Instance ID** | `i-0319401b37391c67f` | `i-01a348af5b8e52ffe` |
| **Type** | t3.micro (1 vCPU, 1GB RAM) | t3.micro (1 vCPU, 1GB RAM) |
| **AZ** | ap-southeast-1c | ap-southeast-1a |
| **Public IP** | 52.76.233.218 | 54.255.201.13 |
| **Vai trò** | Chạy Spring Boot backend | Chạy Spring Boot backend |

**Mỗi EC2 chạy:**
- Docker container `slife-be`: Spring Boot app (port 8080)
- Kết nối RDS MySQL, ElastiCache Redis, S3

**Env vars quan trọng:**
- `SPRING_DATASOURCE_URL` → RDS MySQL
- `REDIS_HOST` → ElastiCache Redis endpoint
- `JWT_SECRET` → cùng giá trị trên cả 2 EC2 (để user login ở EC2 #1 vẫn valid ở EC2 #2)
- `APP_STORAGE_MODE=s3` → upload ảnh lên S3
- `VIETMAP_TILE_KEY` → bản đồ VietMap

### 5. RDS MySQL — Database

| | |
|---|---|
| **Identifier** | `database-1` |
| **Engine** | MySQL 8.4 |
| **Instance** | db.t4g.micro (2 vCPU, 1GB RAM) |
| **Endpoint** | `database-1.cz44844gu32x.ap-southeast-1.rds.amazonaws.com:3306` |
| **Database** | `slife_db` |
| **Vai trò** | Lưu trữ toàn bộ dữ liệu: users, listings, deals, messages, community posts, ... |
| **Với SLIFE** | Cả 2 EC2 đều kết nối cùng 1 RDS → dữ liệu đồng bộ |

**Flyway migrations:** 26 phiên bản (V1 → V26), tự động chạy khi backend khởi động.

### 6. ElastiCache Redis — Cache & Distributed Lock

| | |
|---|---|
| **Cluster** | `slife-redis` |
| **Engine** | Redis 7.1 |
| **Node type** | cache.t3.micro |
| **Endpoint** | `slife-redis.3vmqxm.0001.apse1.cache.amazonaws.com:6379` |
| **Vai trò** | Cache dữ liệu, distributed lock (ShedLock), rate limiting |

**Với SLIFE:**
- **Cache:** Giảm tải query RDS cho dữ liệu đọc nhiều (categories, listings phổ biến)
- **ShedLock:** Đảm bảo scheduled tasks (hết hạn listing, nhắc pickup) chỉ chạy trên 1 EC2, không bị duplicate
- **Rate limiting:** Giới hạn số lần gọi API nhạy cảm (login, comment, ...)

### 7. S3 — Storage

**a) S3 Frontend: `slife-frontend`**

| | |
|---|---|
| **Vai trò** | Host React SPA (static website) |
| **Với SLIFE** | CloudFront default behavior → S3 → trả index.html, JS, CSS |
| **Build** | `npm run build` → `aws s3 sync dist/ s3://slife-frontend/` |

**b) S3 Media: `slife-media-storage-2026`**

| | |
|---|---|
| **Vai trò** | Lưu ảnh upload (listing images, avatars, chat images) |
| **Với SLIFE** | Backend upload ảnh lên S3 qua AWS SDK, FE hiển thị qua CloudFront `/media/*` |
| **CORS** | Cho phép `https://slife.click` |

### 8. IAM Role — Quyền truy cập

| | |
|---|---|
| **Role** | `slife-ec2-role` |
| **Instance Profile** | `slife-ec2-profile` |
| **Vai trò** | Cho phép EC2 truy cập S3 (upload/download ảnh) mà không cần access key |
| **Policies** | S3 PutObject, GetObject, DeleteObject, ListBucket + SSM (remote management) |

### 9. Security Groups — Firewall rules

| SG | Cho phép | Mô tả |
|---|---|---|
| `slife-alb-sg` | 0.0.0.0/0 → port 80, 443 | Internet → ALB |
| `slife-ec2-sg` | ALB → port 8080, 80; 0.0.0.0/0 → port 22 | ALB → EC2, SSH |
| `slife-rds-from-ec2-sg` | EC2 SG → port 3306 | EC2 → RDS MySQL |
| `slife-redis-sg` | EC2 SG → port 6379 | EC2 → ElastiCache Redis |

### 10. ACM — SSL Certificates

| Certificate | Region | Dùng cho |
|---|---|---|
| `be65250c-...` | us-east-1 | CloudFront (bắt buộc us-east-1) |
| `d26e2108-...` | ap-southeast-1 | ALB HTTPS listener |

---

## CloudFormation Stack

**Stack name:** `slife-infra`

**Tạo những gì:**
- ✅ EC2 #2 (t3.micro, Amazon Linux 2023, Docker + Docker Compose)
- ✅ ALB + Target Group + Listeners (HTTP redirect + HTTPS)
- ✅ ElastiCache Redis (cache.t3.micro)
- ✅ S3 Media Bucket (`slife-media-prod`)
- ✅ 4 Security Groups (ALB, EC2, RDS, Redis)
- ✅ IAM Role + Instance Profile (EC2 → S3)

**KHÔNG tạo (đã có sẵn):**
- ❌ EC2 #1
- ❌ RDS MySQL
- ❌ CloudFront
- ❌ Route 53
- ❌ S3 Frontend

---

## Lệnh Deploy

### Yêu cầu
```bash
# AWS CLI v2 đã login
aws configure set region ap-southeast-1
aws login
```

### Deploy stack
```bash
aws cloudformation deploy \
  --stack-name slife-infra \
  --template-file deploy/cloudformation/slife-infra.yaml \
  --region ap-southeast-1 \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ExistingVpcId=vpc-06d1bb6ce5d257c7c \
    PublicSubnet1Id=subnet-0448203f5fedc81b9 \
    PublicSubnet2Id=subnet-0789049b78584d105 \
    ExistingEC2InstanceId=i-0319401b37391c67f \
    ExistingRDSEndpoint=database-1.cz44844gu32x.ap-southeast-1.rds.amazonaws.com \
    EC2KeyPairName=slife-ssh-key \
    ACMCertificateArn=arn:aws:acm:ap-southeast-1:753932002951:certificate/d26e2108-12ca-43ff-874a-73923dfc0bc5 \
  --tags Project=slife
```

### Xem outputs
```bash
aws cloudformation describe-stacks \
  --stack-name slife-infra \
  --region ap-southeast-1 \
  --query "Stacks[0].Outputs" \
  --output table
```

---

## Sau khi deploy

### 1. Attach Security Group + IAM vào EC2 #1

```bash
# Lấy SG hiện tại của EC2 #1
aws ec2 describe-instances --instance-ids i-0319401b37391c67f \
  --query "Reservations[0].Instances[0].SecurityGroups[*].GroupId" --output text

# Thêm SG mới (giữ SG cũ)
aws ec2 modify-instance-attribute \
  --instance-id i-0319401b37391c67f \
  --groups <sg-cũ> <sg-ec2-mới-từ-output>

# Attach IAM Instance Profile
aws ec2 associate-iam-instance-profile \
  --instance-id i-0319401b37391c67f \
  --iam-instance-profile Name=slife-ec2-profile
```

### 2. Attach RDS Security Group

```bash
# Lấy SG hiện tại của RDS
aws rds describe-db-instances --db-instance-identifier database-1 \
  --query "DBInstances[0].VpcSecurityGroups[*].VpcSecurityGroupId" --output text

# Thêm SG mới
aws rds modify-db-instance \
  --db-instance-identifier database-1 \
  --vpc-security-group-ids <sg-cũ> <sg-rds-mới-từ-output> \
  --apply-immediately
```

### 3. Setup EC2 #2

SSH hoặc SSM vào EC2 #2, sửa `.env`, build Docker backend.

### 4. Trỏ CloudFront origin → ALB

Thay origin `Backend-SLIFE` từ EC2 IP sang ALB DNS.
Thêm cache behavior `/chat*` → ALB (cho WebSocket).

---

## Frontend (S3)

### Build và deploy frontend

```bash
# Build với biến môi trường production
cd frontend
npm run build

# Upload lên S3
aws s3 sync dist/ s3://slife-frontend/ --delete --region ap-southeast-1

# Invalidate CloudFront cache (bắt buộc sau mỗi lần deploy FE)
aws cloudfront create-invalidation \
  --distribution-id E1CDV47LE8AY0A \
  --paths "/*"
```

### File `.env.production` (frontend)

```env
VITE_API_BASE_URL=/api
VITE_WS_URL=/chat
VITE_VIETMAP_TILE_KEY=b0168f754f2278ab2cdd5d100bdd678afa53b5eaae079649
```

---

## Chi phí ước tính

| Service | Loại | Chi phí/tháng (USD) | Ghi chú |
|---|---|---|---|
| EC2 #1 | t3.micro | ~$7.50 | Hoặc free tier 12 tháng đầu |
| EC2 #2 | t3.micro | ~$7.50 | CloudFormation tạo |
| RDS | db.t4g.micro | ~$12.00 | 20GB gp3 storage |
| ElastiCache | cache.t3.micro | ~$12.00 | Redis 7.1 |
| ALB | Application LB | ~$16.00 | + $0.008/LCU-hour |
| S3 | Storage | ~$0.50 | Tùy dung lượng ảnh |
| CloudFront | CDN | ~$1.00 | 1TB free tier/tháng |
| Route 53 | DNS | ~$0.50 | Hosted zone |
| **Tổng** | | **~$57/tháng** | |

> Khi không dùng, stop EC2 + RDS + ElastiCache để giảm xuống ~$1/tháng (chỉ còn S3 + Route 53).

---

## Tạm dừng để tiết kiệm chi phí

Khi không cần demo hoặc không dùng, chạy các lệnh sau để **stop tạm thời** những service tốn tiền:

### Stop tất cả (1 script)

```bash
# === STOP TẤT CẢ ĐỂ TIẾT KIỆM ===

# 1. Stop EC2 #1
aws ec2 stop-instances --instance-ids i-0319401b37391c67f --region ap-southeast-1
echo "EC2 #1 stopping..."

# 2. Stop EC2 #2
aws ec2 stop-instances --instance-ids i-01a348af5b8e52ffe --region ap-southeast-1
echo "EC2 #2 stopping..."

# 3. Stop RDS (mất ~5 phút)
aws rds stop-db-instance --db-instance-identifier database-1 --region ap-southeast-1
echo "RDS stopping..."

# 4. Delete ElastiCache Redis (không có stop, chỉ có delete)
# ⚠️ Dữ liệu cache sẽ mất, nhưng cache có thể rebuild từ DB
aws elasticache delete-cache-cluster --cache-cluster-id slife-redis --region ap-southeast-1
echo "ElastiCache deleting..."

echo ""
echo "=== Sau khi stop ==="
echo "Còn tốn tiền: ALB (~$16/mo), S3 (~$0.50), Route 53 (~$0.50)"
echo "Muốn tiết kiệm thêm: xóa ALB bằng cách delete CloudFormation stack"
```

### Chi tiết từng service

#### EC2 (tiết kiệm ~$15/tháng)
```bash
# Stop cả 2 EC2
aws ec2 stop-instances \
  --instance-ids i-0319401b37391c67f i-01a348af5b8e52ffe \
  --region ap-southeast-1

# Kiểm tra trạng thái
aws ec2 describe-instances \
  --instance-ids i-0319401b37391c67f i-01a348af5b8e52ffe \
  --query "Reservations[*].Instances[*].[InstanceId,State.Name]" \
  --output table --region ap-southeast-1
```
> ℹ️ EC2 stopped không tốn tiền compute, chỉ tốn EBS storage (~$1.60/tháng cho 20GB gp3).

#### RDS MySQL (tiết kiệm ~$12/tháng)
```bash
# Stop RDS (tự động start lại sau 7 ngày nếu không stop lại)
aws rds stop-db-instance \
  --db-instance-identifier database-1 \
  --region ap-southeast-1

# Kiểm tra trạng thái
aws rds describe-db-instances \
  --db-instance-identifier database-1 \
  --query "DBInstances[0].[DBInstanceIdentifier,DBInstanceStatus]" \
  --output table --region ap-southeast-1
```
> ⚠️ **Lưu ý:** AWS tự động start RDS sau 7 ngày. Cần stop lại nếu vẫn chưa dùng.

#### ElastiCache Redis (tiết kiệm ~$12/tháng)
```bash
# ElastiCache KHÔNG có stop — chỉ có delete
# Dữ liệu cache sẽ mất (không sao, cache rebuild từ DB)
aws elasticache delete-cache-cluster \
  --cache-cluster-id slife-redis \
  --region ap-southeast-1
```
> Khi cần lại, tạo mới bằng cách update CloudFormation stack.

#### ALB (tiết kiệm ~$16/tháng)
```bash
# Nếu muốn tiết kiệm triệt để, xóa cả stack:
aws cloudformation delete-stack --stack-name slife-infra --region ap-southeast-1
```
> ⚠️ Xóa stack sẽ xóa: EC2 #2, ALB, ElastiCache, S3 media bucket, SGs, IAM role.
> EC2 #1, RDS, CloudFront KHÔNG bị ảnh hưởng (không do stack quản lý).

---

## Khởi động lại

Khi cần dùng lại sau khi đã stop:

### Start tất cả (1 script)

```bash
# === START LẠI TẤT CẢ ===

# 1. Start EC2 #1
aws ec2 start-instances --instance-ids i-0319401b37391c67f --region ap-southeast-1
echo "EC2 #1 starting..."

# 2. Start EC2 #2
aws ec2 start-instances --instance-ids i-01a348af5b8e52ffe --region ap-southeast-1
echo "EC2 #2 starting..."

# 3. Start RDS
aws rds start-db-instance --db-instance-identifier database-1 --region ap-southeast-1
echo "RDS starting..."

# 4. Đợi EC2 running
aws ec2 wait instance-running \
  --instance-ids i-0319401b37391c67f i-01a348af5b8e52ffe \
  --region ap-southeast-1
echo "EC2 instances running!"

# 5. Đợi RDS available (~5 phút)
aws rds wait db-instance-available \
  --db-instance-identifier database-1 \
  --region ap-southeast-1
echo "RDS available!"

# 6. Kiểm tra ALB health
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups --names slife-backend-tg \
    --region ap-southeast-1 --query "TargetGroups[0].TargetGroupArn" --output text) \
  --region ap-southeast-1 \
  --query "TargetHealthDescriptions[*].[Target.Id,TargetHealth.State]" \
  --output table

echo "=== Xong! Truy cập https://slife.click ==="
```

### Nếu đã xóa ElastiCache, tạo lại:
```bash
# Update CloudFormation stack (sẽ tạo lại ElastiCache)
aws cloudformation deploy \
  --stack-name slife-infra \
  --template-file deploy/cloudformation/slife-infra.yaml \
  --region ap-southeast-1 \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ExistingVpcId=vpc-06d1bb6ce5d257c7c \
    PublicSubnet1Id=subnet-0448203f5fedc81b9 \
    PublicSubnet2Id=subnet-0789049b78584d105 \
    ExistingEC2InstanceId=i-0319401b37391c67f \
    ExistingRDSEndpoint=database-1.cz44844gu32x.ap-southeast-1.rds.amazonaws.com \
    EC2KeyPairName=slife-ssh-key \
    ACMCertificateArn=arn:aws:acm:ap-southeast-1:753932002951:certificate/d26e2108-12ca-43ff-874a-73923dfc0bc5

# Sau đó update REDIS_HOST trong .env trên cả 2 EC2 với endpoint mới
```

### Nếu đã xóa cả stack, deploy lại từ đầu:
Xem phần [Lệnh Deploy](#lệnh-deploy) và [Sau khi deploy](#sau-khi-deploy).

---

## Xóa toàn bộ stack

Khi không cần nữa hoàn toàn:

```bash
# 1. Xóa S3 media objects (bucket phải rỗng trước khi xóa)
aws s3 rm s3://slife-media-prod --recursive --region ap-southeast-1

# 2. Xóa CloudFormation stack
aws cloudformation delete-stack --stack-name slife-infra --region ap-southeast-1

# 3. Đợi xóa xong
aws cloudformation wait stack-delete-complete --stack-name slife-infra --region ap-southeast-1

# 4. (Tùy chọn) Stop EC2 #1 và RDS
aws ec2 stop-instances --instance-ids i-0319401b37391c67f --region ap-southeast-1
aws rds stop-db-instance --db-instance-identifier database-1 --region ap-southeast-1
```

> ⚠️ Xóa stack sẽ xóa EC2 #2 (terminate vĩnh viễn), ALB, ElastiCache, S3 media bucket, SGs, IAM role.
> Dữ liệu ảnh trong S3 media sẽ **mất vĩnh viễn** nếu không backup trước.

---

## Thông tin tham khảo nhanh

| Resource | ID / Endpoint |
|---|---|
| VPC | `vpc-06d1bb6ce5d257c7c` |
| EC2 #1 | `i-0319401b37391c67f` (52.76.233.218) |
| EC2 #2 | `i-01a348af5b8e52ffe` (54.255.201.13) |
| RDS | `database-1.cz44844gu32x.ap-southeast-1.rds.amazonaws.com` |
| ElastiCache | `slife-redis.3vmqxm.0001.apse1.cache.amazonaws.com` |
| ALB | `slife-alb-1698605089.ap-southeast-1.elb.amazonaws.com` |
| CloudFront | `E1CDV47LE8AY0A` (`d2kmitf5oxoa2e.cloudfront.net`) |
| S3 Frontend | `slife-frontend` |
| S3 Media | `slife-media-storage-2026` |
| SSH Key | `slife-ssh-key` |
| Domain | `slife.click` |
| Region | `ap-southeast-1` (Singapore) |
