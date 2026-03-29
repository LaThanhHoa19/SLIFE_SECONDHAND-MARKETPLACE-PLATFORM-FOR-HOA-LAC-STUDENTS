# Test SCRUM-229: ban user + JWT tv / token_revision revoke
# Set API_BASE e.g. http://localhost (nginx) or http://localhost:8080 (direct Spring)
# Windows PowerShell 5+

$ErrorActionPreference = 'Stop'
$base = if ($env:API_BASE) { $env:API_BASE.TrimEnd('/') } else { 'http://localhost:8080' }

Write-Host "=== 1) Admin login ===" -ForegroundColor Cyan
$adminBody = '{"email":"admin@fpt.edu.vn","password":"Admin123!"}'
$adminRes = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body $adminBody
$adminToken = $adminRes.data.token
if (-not $adminToken) { $adminToken = $adminRes.data.accessToken }
Write-Host "Admin token (truncated): $($adminToken.Substring(0, [Math]::Min(40, $adminToken.Length)))..."

Write-Host "`n=== 2) User dev-login (seed user id 2) ===" -ForegroundColor Cyan
$userRes = Invoke-RestMethod -Uri "$base/api/auth/dev-login?email=andthe180695@fpt.edu.vn" -Method Post
$userToken = $userRes.data.token
if (-not $userToken) { $userToken = $userRes.data.accessToken }
Write-Host "User token (truncated): $($userToken.Substring(0, [Math]::Min(40, $userToken.Length)))..."

Write-Host "`n=== 3) GET /api/users/me (expect 200) ===" -ForegroundColor Cyan
$h = @{ Authorization = "Bearer $userToken" }
try {
    $me = Invoke-RestMethod -Uri "$base/api/users/me" -Headers $h
    Write-Host "OK email=$($me.data.email)"
} catch {
    Write-Host "FAIL: $_"
}

Write-Host "`n=== 4) PATCH ban user 2 (ADMIN) ===" -ForegroundColor Cyan
$patch = '{"status":"BANNED"}'
$headers = @{
    Authorization = "Bearer $adminToken"
    'Content-Type' = 'application/json'
}
Invoke-RestMethod -Uri "$base/api/admin/users/2/status" -Method Patch -Headers $headers -Body $patch | Out-Null
Write-Host "Ban OK"

Write-Host "`n=== 5) GET /api/users/me with OLD token (expect 401 or 403) ===" -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri "$base/api/users/me" -Headers $h -UseBasicParsing | Select-Object StatusCode
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP $code (expected 401 or 403)"
}

Write-Host "`n=== 6) dev-login user 2 again (expect USER_BANNED) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/api/auth/dev-login?email=andthe180695@fpt.edu.vn" -Method Post
} catch {
    $r = $_.ErrorDetails.Message
    Write-Host "Error body: $r"
}

Write-Host "`n=== 7) Unban user 2 ===" -ForegroundColor Cyan
$un = '{"status":"ACTIVE"}'
Invoke-RestMethod -Uri "$base/api/admin/users/2/status" -Method Patch -Headers $headers -Body $un | Out-Null
Write-Host "Unban OK (token_revision bumped; need fresh dev-login)."

Write-Host "`n=== 8) dev-login after unban (expect 200) ===" -ForegroundColor Cyan
$again = Invoke-RestMethod -Uri "$base/api/auth/dev-login?email=andthe180695@fpt.edu.vn" -Method Post
$tok = $again.data.token; if (-not $tok) { $tok = $again.data.accessToken }
$h2 = @{ Authorization = "Bearer $tok" }
$me2 = Invoke-RestMethod -Uri "$base/api/users/me" -Headers $h2
Write-Host "OK email=$($me2.data.email)"

Write-Host "`nDone." -ForegroundColor Green
