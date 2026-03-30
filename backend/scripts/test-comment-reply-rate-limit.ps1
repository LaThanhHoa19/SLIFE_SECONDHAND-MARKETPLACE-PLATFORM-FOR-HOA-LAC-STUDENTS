$ErrorActionPreference = 'Stop'
$base = if ($env:API_BASE) { $env:API_BASE.TrimEnd('/') } else { 'http://localhost' }

Write-Host "=== 1) Login listing owner (for reply permission) ===" -ForegroundColor Cyan
$login = Invoke-RestMethod -Uri "$base/api/auth/dev-login?email=admin@fpt.edu.vn" -Method Post
$token = $login.data.token
if (-not $token) { $token = $login.data.accessToken }
$h = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }

Write-Host "=== 2) Get a parent comment id ===" -ForegroundColor Cyan
$comments = Invoke-RestMethod -Uri "$base/api/v1/listings/1/comments" -Method Get
if (-not $comments.data -or $comments.data.Count -eq 0) { throw 'No parent comments found on listing 1.' }
$parentId = $comments.data[0].id
Write-Host "Using parentId=$parentId"

Write-Host "=== 3) Rapid reply test (expect 429 quickly) ===" -ForegroundColor Cyan
$hit429 = $false
for ($i=1; $i -le 10; $i++) {
    $payload = "{`"content`":`"reply spam $i`",`"imageUrls`":[]}"
    try {
        Invoke-WebRequest -Uri "$base/api/v1/comments/$parentId/reply" -Method Post -Headers $h -Body $payload -UseBasicParsing | Out-Null
        Write-Host "Attempt ${i}: HTTP 200"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "Attempt ${i}: HTTP $code"
        if ($code -eq 429) { $hit429 = $true; break }
    }
}
Write-Host "Reply rate limit hit? $hit429"
Write-Host "Done." -ForegroundColor Green
