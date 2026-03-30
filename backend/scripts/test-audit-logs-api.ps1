# Smoke test: GET /api/admin/audit-logs (requires admin JWT)
$ErrorActionPreference = 'Stop'
$base = if ($env:API_BASE) { $env:API_BASE.TrimEnd('/') } else { 'http://localhost' }

Write-Host "=== Admin login ===" -ForegroundColor Cyan
$loginBody = '{"email":"admin@fpt.edu.vn","password":"Admin123!"}'
$login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody
$token = $login.data.token
if (-not $token) { $token = $login.data.accessToken }
$h = @{ Authorization = "Bearer $token" }

Write-Host "`n=== GET /api/admin/audit-logs?page=0&size=10 ===" -ForegroundColor Cyan
$uri = "$base/api/admin/audit-logs?page=0&size=10"
$resp = Invoke-RestMethod -Uri $uri -Headers $h
Write-Host "code=$($resp.code) totalElements=$($resp.data.totalElements)"
if ($resp.data.content -and $resp.data.content.Count -gt 0) {
    $resp.data.content | Select-Object -First 8 id, action, entityType, actorType, occurredAt | Format-Table -AutoSize
} else {
    Write-Host "(no rows)"
}
Write-Host "`nDone." -ForegroundColor Green
