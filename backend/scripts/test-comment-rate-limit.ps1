$ErrorActionPreference = 'Stop'
$base = if ($env:API_BASE) { $env:API_BASE.TrimEnd('/') } else { 'http://localhost' }

Write-Host "=== 1) Login test user ===" -ForegroundColor Cyan
$login = Invoke-RestMethod -Uri "$base/api/auth/dev-login?email=andthe180695@fpt.edu.vn" -Method Post
$token = $login.data.token
if (-not $token) { $token = $login.data.accessToken }
$h = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }

Write-Host "=== 2) Find a listing id ===" -ForegroundColor Cyan
$listings = Invoke-RestMethod -Uri "$base/api/listings?page=0&size=1" -Method Get
$listingId = $listings.data.content[0].id
if (-not $listingId) { throw 'No listing found to comment on.' }
Write-Host "Using listingId=$listingId"

Write-Host "=== 3) Fast burst comment test (expect 429 quickly) ===" -ForegroundColor Cyan
$hit429 = $false
for ($i=1; $i -le 10; $i++) {
    $payload = "{`"listingId`":$listingId,`"content`":`"spam test $i`",`"imageUrls`":[]}"
    try {
        Invoke-WebRequest -Uri "$base/api/v1/comments" -Method Post -Headers $h -Body $payload -UseBasicParsing | Out-Null
        Write-Host "Attempt ${i}: HTTP 200"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "Attempt ${i}: HTTP $code"
        if ($code -eq 429) { $hit429 = $true; break }
    }
}
Write-Host "Rate limit hit? $hit429"
Write-Host "Done." -ForegroundColor Green
