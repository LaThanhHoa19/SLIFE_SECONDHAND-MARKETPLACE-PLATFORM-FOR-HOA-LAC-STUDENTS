# Gửi bộ email mẫu qua POST /api/auth/dev/send-sample-emails (dev profile).
# Yêu cầu: stack dev chạy, AUTH_DEV_LOGIN_ENABLED=true.
# Mail gửi tới đúng địa chỉ trong template (hoặc cấu hình riêng trên Spring nếu có).

$ErrorActionPreference = "Stop"
$base = if ($env:SLIFE_API_BASE) { $env:SLIFE_API_BASE } else { "http://localhost" }

Write-Host "POST $base/api/auth/dev/send-sample-emails"
$r = Invoke-RestMethod -Uri "$base/api/auth/dev/send-sample-emails" -Method Post
$r | ConvertTo-Json -Depth 6
