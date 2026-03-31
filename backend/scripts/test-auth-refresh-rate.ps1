$ErrorActionPreference = 'Stop'
$base = if ($env:API_BASE) { $env:API_BASE.TrimEnd('/') } else { 'http://localhost' }

Write-Host "=== 1) Login (expect 200 + refreshToken) ===" -ForegroundColor Cyan
$body = '{"email":"admin@fpt.edu.vn","password":"Admin123!"}'
$login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body $body
$access = $login.data.accessToken
$refresh = $login.data.refreshToken
Write-Host "access? $([bool]$access) refresh? $([bool]$refresh)"

Write-Host "`n=== 2) Refresh with refreshToken (expect 200) ===" -ForegroundColor Cyan
$refreshBody = "{`"refreshToken`":`"$refresh`"}"
$r2 = Invoke-RestMethod -Uri "$base/api/auth/refresh" -Method Post -ContentType 'application/json' -Body $refreshBody
$access2 = $r2.data.accessToken
$refresh2 = $r2.data.refreshToken
Write-Host "new access? $([bool]$access2) new refresh? $([bool]$refresh2)"

Write-Host "`n=== 3) Reuse old refresh token (expect 401) ===" -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri "$base/api/auth/refresh" -Method Post -ContentType 'application/json' -Body $refreshBody -UseBasicParsing | Out-Null
    Write-Host "Unexpected: old refresh still works"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP $code (expected 401)"
}

Write-Host "`n=== 4) Logout with access + refresh2 (expect revoke) ===" -ForegroundColor Cyan
$logoutBody = "{`"refreshToken`":`"$refresh2`"}"
Invoke-RestMethod -Uri "$base/api/auth/logout" -Method Post -Headers @{ Authorization = "Bearer $access2" } -ContentType 'application/json' -Body $logoutBody | Out-Null
Write-Host "Logout OK"

Write-Host "`n=== 5) Refresh with refresh2 after logout (expect 401) ===" -ForegroundColor Cyan
$refreshBody2 = "{`"refreshToken`":`"$refresh2`"}"
try {
    Invoke-WebRequest -Uri "$base/api/auth/refresh" -Method Post -ContentType 'application/json' -Body $refreshBody2 -UseBasicParsing | Out-Null
    Write-Host "Unexpected: refresh2 still works"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP $code (expected 401)"
}

Write-Host "`n=== 6) Dev-login guard in non-dev mode (expect 403 if disabled) ===" -ForegroundColor Cyan
try {
    $d = Invoke-RestMethod -Uri "$base/api/auth/dev-login?email=admin@fpt.edu.vn" -Method Post
    Write-Host "dev-login returned code=$($d.code) (dev mode likely enabled)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP $code"
}

Write-Host "`n=== 7) Login brute-force rate limit smoke (wrong password) ===" -ForegroundColor Cyan
$wrong = '{"email":"admin@fpt.edu.vn","password":"wrong-pass"}'
$limited = $false
for ($i=1; $i -le 12; $i++) {
    try {
        Invoke-WebRequest -Uri "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body $wrong -UseBasicParsing | Out-Null
        Write-Host "Attempt ${i}: unexpected success"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "Attempt ${i}: HTTP $code"
        if ($code -eq 429) { $limited = $true; break }
    }
}
Write-Host "Rate limit hit? $limited"
Write-Host "`nDone." -ForegroundColor Green

