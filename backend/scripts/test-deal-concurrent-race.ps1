<#
.SYNOPSIS
    Kiểm tra race: chốt đơn song song (2 buyer) và chấp nhận song song (cùng buyer).

.DESCRIPTION
    Yêu cầu: Spring dev profile + dev-login bật (mặc định), DB seed alice/bob/charlie (@example.com).
    Nginx: http://localhost  |  Backend trực tiếp: http://127.0.0.1:8080 (nếu map port).

.PARAMETER BaseUrl
    Ví dụ: http://localhost hoặc http://127.0.0.1:8080

.PARAMETER CleanDeals
    Chạy docker exec mysql xóa deal của tin "iPhone 12 64GB cu" để test được (tin seed có sẵn deal CONFIRMED).

.EXAMPLE
    .\test-deal-concurrent-race.ps1 -BaseUrl http://localhost -CleanDeals
#>

[CmdletBinding()]
param(
    [string] $BaseUrl = $(if ($env:API_BASE) { $env:API_BASE.TrimEnd('/') } else { 'http://localhost' }),
    [switch] $CleanDeals
)

$ErrorActionPreference = 'Stop'

function Get-DevToken([string] $email) {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/auth/dev-login?email=$([uri]::EscapeDataString($email))" -Method Post
    $t = $r.data.token
    if (-not $t) { $t = $r.data.accessToken }
    if (-not $t) { throw "dev-login failed for $email : $($r | ConvertTo-Json -Compress)" }
    return $t
}

function Get-MeId([string] $token) {
    $h = @{ Authorization = "Bearer $token" }
    $me = Invoke-RestMethod -Uri "$BaseUrl/api/users/me" -Headers $h -Method Get
    return [long]$me.data.id
}

function Get-FirstListingIdByQuery([string] $q) {
    $enc = [uri]::EscapeDataString($q)
    $s = Invoke-RestMethod -Uri "$BaseUrl/api/search?q=$enc&page=0&size=5" -Method Get
    if (-not $s.data.content -or $s.data.content.Count -eq 0) { throw "No listings for q=$q" }
    return [long]$s.data.content[0].id
}

Write-Host "Base: $BaseUrl" -ForegroundColor Cyan

if ($CleanDeals) {
    Write-Host "`n=== Clean deals for iPhone listing (docker mysql) ===" -ForegroundColor Yellow
    $sql = "DELETE FROM deals WHERE listing_id = (SELECT listing_id FROM listings WHERE title = 'iPhone 12 64GB cu' LIMIT 1);"
    $prevEa = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    docker exec slife-dev-mysql mysql -uroot -p123456 -e "USE slife_db; $sql" 2>&1 | Out-Null
    $ErrorActionPreference = $prevEa
}

Write-Host "`n=== Login (seed users) ===" -ForegroundColor Cyan
$aliceEmail = 'alice@example.com'
$bobEmail = 'bob@example.com'
$charlieEmail = 'charlie@example.com'

$tokAlice = Get-DevToken $aliceEmail
$tokBob = Get-DevToken $bobEmail
$tokCharlie = Get-DevToken $charlieEmail

$idAlice = Get-MeId $tokAlice
$idBob = Get-MeId $tokBob
$idCharlie = Get-MeId $tokCharlie
Write-Host "alice=$idAlice bob=$idBob charlie=$idCharlie"

$listingId = Get-FirstListingIdByQuery 'iPhone'
Write-Host "Using listingId=$listingId (iPhone seed)"

# Chat session cho Charlie (Bob đã có conversation trong seed)
Write-Host "`n=== Ensure chat session Charlie + listing ===" -ForegroundColor Cyan
$hCharlie = @{ Authorization = "Bearer $tokCharlie"; 'Content-Type' = 'application/json' }
Invoke-RestMethod -Uri "$BaseUrl/api/v1/chats/session?listingId=$listingId" -Method Post -Headers $hCharlie | Out-Null

$hAlice = @{
    Authorization = "Bearer $tokAlice"
    'Content-Type' = 'application/json'
}

$bodyBob = (@{
        listingId = $listingId
        buyerId   = $idBob
        price     = 8000000
    } | ConvertTo-Json -Compress)

$bodyCharlie = (@{
        listingId = $listingId
        buyerId   = $idCharlie
        price     = 7900000
    } | ConvertTo-Json -Compress)

Write-Host "`n=== TEST 1: Two POST /api/deals/seller-seal at once (Alice: Bob vs Charlie) ===" -ForegroundColor Green
$job1 = Start-Job -ScriptBlock {
    param($B, $T, $Body)
    try {
        $r = Invoke-RestMethod -Uri "$B/api/deals/seller-seal" -Method Post -Headers @{
            Authorization  = "Bearer $T"
            'Content-Type' = 'application/json'
        } -Body $Body -TimeoutSec 60
        return @{ ok = $true; code = $r.code; message = $r.message; dataStatus = $r.data.status }
    }
    catch {
        $resp = $_.ErrorDetails.Message
        if (-not $resp) { $resp = $_.Exception.Message }
        return @{ ok = $false; error = $resp }
    }
} -ArgumentList $BaseUrl, $tokAlice, $bodyBob

$job2 = Start-Job -ScriptBlock {
    param($B, $T, $Body)
    try {
        $r = Invoke-RestMethod -Uri "$B/api/deals/seller-seal" -Method Post -Headers @{
            Authorization  = "Bearer $T"
            'Content-Type' = 'application/json'
        } -Body $Body -TimeoutSec 60
        return @{ ok = $true; code = $r.code; message = $r.message; dataStatus = $r.data.status }
    }
    catch {
        $resp = $_.ErrorDetails.Message
        if (-not $resp) { $resp = $_.Exception.Message }
        return @{ ok = $false; error = $resp }
    }
} -ArgumentList $BaseUrl, $tokAlice, $bodyCharlie

Wait-Job $job1, $job2 | Out-Null
$r1 = Receive-Job $job1
$r2 = Receive-Job $job2
Remove-Job $job1, $job2

Write-Host "Seal job Bob:     $($r1 | ConvertTo-Json -Compress)"
Write-Host "Seal job Charlie: $($r2 | ConvertTo-Json -Compress)"

Write-Host "`n=== TEST 2: Many parallel PUT accept (Bob and Charlie) ===" -ForegroundColor Green
# After seal race only one buyer keeps PENDING; mixed parallel accepts.
$hBob = @{ Authorization = "Bearer $tokBob"; 'Content-Type' = 'application/json' }
$hCh = @{ Authorization = "Bearer $tokCharlie"; 'Content-Type' = 'application/json' }

$acceptUri = "$BaseUrl/api/listings/$listingId/deals/pending/accept"
$jobs = @()
1..16 | ForEach-Object {
    $iterationToken = if ($_ % 2 -eq 0) { $tokBob } else { $tokCharlie }
    $jobs += Start-Job -ScriptBlock {
        param($Uri, $Token)
        try {
            $r = Invoke-RestMethod -Uri $Uri -Method Put -Headers @{
                Authorization  = "Bearer $Token"
                'Content-Type' = 'application/json'
            } -Body '{}' -TimeoutSec 60
            return @{ ok = $true; code = $r.code; dealStatus = $r.data.status }
        }
        catch {
            $resp = $_.ErrorDetails.Message
            if (-not $resp) { $resp = $_.Exception.Message }
            return @{ ok = $false; error = $resp }
        }
    } -ArgumentList $acceptUri, $iterationToken
}
Wait-Job $jobs | Out-Null
$acceptResults = $jobs | ForEach-Object { Receive-Job $_ }
Remove-Job $jobs

$ok = ($acceptResults | Where-Object { $_.ok -eq $true }).Count
$fail = ($acceptResults | Where-Object { $_.ok -eq $false }).Count
Write-Host "Accept parallel: SUCCESS=$ok FAIL=$fail (expect ~1 COMPLETED, rest errors)"
$acceptResults | ForEach-Object { Write-Host "  $($_.ok) $($_.dealStatus) $($_.error)" }

Write-Host "`nDone." -ForegroundColor Green
