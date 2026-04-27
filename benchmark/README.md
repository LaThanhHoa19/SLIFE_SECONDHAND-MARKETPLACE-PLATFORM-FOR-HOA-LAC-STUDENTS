# SLIFE Benchmark — JMeter Test Plan

## Cài JMeter

### Cách 1: Download trực tiếp
1. Tải từ https://jmeter.apache.org/download_jmeter.cgi
2. Giải nén, thêm `bin/` vào PATH

### Cách 2: Chocolatey (Windows)
```powershell
choco install jmeter
```

### Cách 3: Homebrew (Mac)
```bash
brew install jmeter
```

## Chạy Benchmark

### GUI Mode (xem kết quả trực quan)
```powershell
jmeter -t benchmark/slife-benchmark.jmx
```
Bấm nút Play (▶) để chạy. Xem kết quả ở Summary Report và Aggregate Report.

### CLI Mode (không cần GUI, nhanh hơn)
```powershell
# Tạo thư mục kết quả
mkdir benchmark/results

# Chạy test
jmeter -n -t benchmark/slife-benchmark.jmx -l benchmark/results/results.jtl -e -o benchmark/results/html-report

# Mở report HTML
start benchmark/results/html-report/index.html
```

## Test Plan gồm 6 Thread Groups

| # | Tên | Threads | Ramp-up | Duration | Endpoint | Mục đích |
|---|-----|---------|---------|----------|----------|----------|
| 1 | Health Check | 10 | 5s | 30s | `GET /actuator/health` | Baseline, lightweight |
| 2 | Categories (Cache) | 20 | 10s | 30s | `GET /api/categories` | Redis cache hit |
| 3 | Listings (DB) | 20 | 10s | 30s | `GET /api/listings?page=0&size=10` | MySQL query |
| 4 | Search (Heavy DB) | 10 | 5s | 30s | `GET /api/search?keyword=tai nghe` | Full-text search |
| 5 | Community Posts | 15 | 5s | 30s | `GET /api/community/posts?size=10` | Cursor pagination |
| 6 | Stress Test | 50 | 30s | 60s | `GET /api/listings` | Tìm giới hạn server |

## Đổi target URL

Mặc định test qua ALB trực tiếp (HTTP). Muốn test qua CloudFront (HTTPS):

1. Mở file `slife-benchmark.jmx` trong JMeter GUI
2. Click vào "SLIFE Benchmark" (Test Plan)
3. Đổi biến:
   - `BASE_URL` = `slife.click`
   - `PROTOCOL` = `https`

## Đọc kết quả

### Summary Report
- **Samples**: Tổng số request
- **Average**: Thời gian phản hồi trung bình (ms)
- **Min/Max**: Nhanh nhất / chậm nhất
- **Error %**: Tỷ lệ lỗi (mục tiêu < 1%)
- **Throughput**: Số request/giây server xử lý được

### Mục tiêu benchmark cho t3.micro (1 vCPU, 1GB RAM)

| Metric | Tốt | Chấp nhận | Cần cải thiện |
|--------|-----|-----------|---------------|
| Avg response time | < 200ms | < 500ms | > 1000ms |
| Error rate | 0% | < 1% | > 5% |
| Throughput | > 20 req/s | > 10 req/s | < 5 req/s |
| P95 response time | < 500ms | < 1000ms | > 2000ms |
