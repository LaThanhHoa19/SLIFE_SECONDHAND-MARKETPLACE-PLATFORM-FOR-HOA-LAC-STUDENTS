# Gửi email thử nghiệm vào một hộp thư (APP_MAIL_FORCE_TO).
# Yêu cầu: stack dev chạy (docker-compose.dev.yml), AUTH_DEV_LOGIN_ENABLED=true.
#
# Usage (PowerShell, từ thư mục deploy):
#   $env:APP_MAIL_FORCE_TO="andthe180695@fpt.edu.vn"
#   docker compose -f docker-compose.dev.yml up -d --build backend
#   ..\deploy\scripts\dev-send-test-emails.ps1
#
# Hoặc chỉ gọi API nếu backend đã có APP_MAIL_FORCE_TO:
#   Invoke-RestMethod -Uri "http://localhost/api/auth/dev/send-sample-emails" -Method Post

$ErrorActionPreference = "Stop"
$base = if ($env:SLIFE_API_BASE) { $env:SLIFE_API_BASE } else { "http://localhost" }

Write-Host "POST $base/api/auth/dev/send-sample-emails"
$r = Invoke-RestMethod -Uri "$base/api/auth/dev/send-sample-emails" -Method Post
$r | ConvertTo-Json -Depth 6
