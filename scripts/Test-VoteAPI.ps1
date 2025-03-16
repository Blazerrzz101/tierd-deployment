# Test-VoteAPI.ps1
# PowerShell script to test the Tier'd voting API

$baseUrl = "http://localhost:3001"
$productId = "9dd2bfe2-6eef-40de-ae12-c35ff1975914" # Logitech G502 HERO
$clientId = "test-client-" + -join ((48..57) + (97..122) | Get-Random -Count 10 | % {[char]$_})

function Write-ColoredHeading($text) {
    Write-Host "`n"
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host (" " * [Math]::Floor((60 - $text.Length) / 2) + $text) -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host "`n"
}

function Format-Json([string]$json) {
    try {
        $obj = ConvertFrom-Json $json -ErrorAction Stop
        return ($obj | ConvertTo-Json -Depth 10)
    } catch {
        return $json
    }
}

# Start the tests
Write-ColoredHeading "VOTE API TEST"
Write-Host "Testing with:"
Write-Host "- Product ID: $productId"
Write-Host "- Client ID: $clientId"

# Test 1: Check initial vote status
Write-ColoredHeading "TEST 1: Check Initial Vote Status"
Write-Host "Executing: GET $baseUrl/api/vote?productId=$productId&clientId=$clientId" -ForegroundColor Yellow
$initialStatus = Invoke-RestMethod -Uri "$baseUrl/api/vote?productId=$productId&clientId=$clientId" -Method Get -ContentType "application/json"
Write-Host "Response:" -ForegroundColor Green
$initialStatus | ConvertTo-Json -Depth 5

# Test 2: Submit an upvote
Write-ColoredHeading "TEST 2: Submit Upvote"
$upvoteBody = @{
    productId = $productId
    voteType = 1
    clientId = $clientId
} | ConvertTo-Json

Write-Host "Executing: POST $baseUrl/api/vote" -ForegroundColor Yellow
Write-Host "Body: $upvoteBody" -ForegroundColor Yellow
$upvoteResult = Invoke-RestMethod -Uri "$baseUrl/api/vote" -Method Post -Body $upvoteBody -ContentType "application/json"
Write-Host "Response:" -ForegroundColor Green
$upvoteResult | ConvertTo-Json -Depth 5

# Test 3: Check vote status after upvote
Write-ColoredHeading "TEST 3: Check Vote Status After Upvote"
Write-Host "Executing: GET $baseUrl/api/vote?productId=$productId&clientId=$clientId" -ForegroundColor Yellow
$statusAfterUpvote = Invoke-RestMethod -Uri "$baseUrl/api/vote?productId=$productId&clientId=$clientId" -Method Get -ContentType "application/json"
Write-Host "Response:" -ForegroundColor Green
$statusAfterUpvote | ConvertTo-Json -Depth 5

# Test 4: Toggle upvote (submit upvote again)
Write-ColoredHeading "TEST 4: Toggle Vote (Upvote Again)"
Write-Host "Executing: POST $baseUrl/api/vote" -ForegroundColor Yellow
Write-Host "Body: $upvoteBody" -ForegroundColor Yellow
$toggleResult = Invoke-RestMethod -Uri "$baseUrl/api/vote" -Method Post -Body $upvoteBody -ContentType "application/json"
Write-Host "Response:" -ForegroundColor Green
$toggleResult | ConvertTo-Json -Depth 5

# Test 5: Check vote status after toggle
Write-ColoredHeading "TEST 5: Check Vote Status After Toggle"
Write-Host "Executing: GET $baseUrl/api/vote?productId=$productId&clientId=$clientId" -ForegroundColor Yellow
$statusAfterToggle = Invoke-RestMethod -Uri "$baseUrl/api/vote?productId=$productId&clientId=$clientId" -Method Get -ContentType "application/json"
Write-Host "Response:" -ForegroundColor Green
$statusAfterToggle | ConvertTo-Json -Depth 5

# Test 6: Submit a downvote
Write-ColoredHeading "TEST 6: Submit Downvote"
$downvoteBody = @{
    productId = $productId
    voteType = -1
    clientId = $clientId
} | ConvertTo-Json

Write-Host "Executing: POST $baseUrl/api/vote" -ForegroundColor Yellow
Write-Host "Body: $downvoteBody" -ForegroundColor Yellow
$downvoteResult = Invoke-RestMethod -Uri "$baseUrl/api/vote" -Method Post -Body $downvoteBody -ContentType "application/json"
Write-Host "Response:" -ForegroundColor Green
$downvoteResult | ConvertTo-Json -Depth 5

# Test 7: Check vote status after downvote
Write-ColoredHeading "TEST 7: Check Vote Status After Downvote"
Write-Host "Executing: GET $baseUrl/api/vote?productId=$productId&clientId=$clientId" -ForegroundColor Yellow
$statusAfterDownvote = Invoke-RestMethod -Uri "$baseUrl/api/vote?productId=$productId&clientId=$clientId" -Method Get -ContentType "application/json"
Write-Host "Response:" -ForegroundColor Green
$statusAfterDownvote | ConvertTo-Json -Depth 5

# Test 8: Check remaining votes
Write-ColoredHeading "TEST 8: Check Remaining Votes"
Write-Host "Executing: GET $baseUrl/api/vote/remaining-votes?clientId=$clientId" -ForegroundColor Yellow
$remainingVotes = Invoke-RestMethod -Uri "$baseUrl/api/vote/remaining-votes?clientId=$clientId" -Method Get -ContentType "application/json"
Write-Host "Response:" -ForegroundColor Green
$remainingVotes | ConvertTo-Json -Depth 5

# Summary
Write-ColoredHeading "TEST SUMMARY"

$initialUpvotes = if ($initialStatus.upvotes -ne $null) { $initialStatus.upvotes } else { 0 }
$initialDownvotes = if ($initialStatus.downvotes -ne $null) { $initialStatus.downvotes } else { 0 }
$initialVoteType = if ($initialStatus.voteType -eq $null) { "None" } else { $initialStatus.voteType }

Write-Host "Initial Status:" -ForegroundColor Cyan
Write-Host "- Upvotes: $initialUpvotes"
Write-Host "- Downvotes: $initialDownvotes"
Write-Host "- User Vote: $initialVoteType"

$upvoteSuccess = if ($upvoteResult.success) { "Yes" } else { "No" }
Write-Host "`nAfter Upvote:" -ForegroundColor Cyan
Write-Host "- Success: $upvoteSuccess"
Write-Host "- Upvotes: $($statusAfterUpvote.upvotes)"
Write-Host "- Downvotes: $($statusAfterUpvote.downvotes)"
Write-Host "- User Vote: $($statusAfterUpvote.voteType)"

$toggleSuccess = if ($toggleResult.success) { "Yes" } else { "No" }
$toggleVoteType = if ($statusAfterToggle.voteType -eq $null) { "None" } else { $statusAfterToggle.voteType }
Write-Host "`nAfter Toggle:" -ForegroundColor Cyan
Write-Host "- Success: $toggleSuccess"
Write-Host "- Upvotes: $($statusAfterToggle.upvotes)"
Write-Host "- Downvotes: $($statusAfterToggle.downvotes)"
Write-Host "- User Vote: $toggleVoteType"

$downvoteSuccess = if ($downvoteResult.success) { "Yes" } else { "No" }
Write-Host "`nAfter Downvote:" -ForegroundColor Cyan
Write-Host "- Success: $downvoteSuccess"
Write-Host "- Upvotes: $($statusAfterDownvote.upvotes)"
Write-Host "- Downvotes: $($statusAfterDownvote.downvotes)"
Write-Host "- User Vote: $($statusAfterDownvote.voteType)"

Write-Host "`nRemaining Votes:" -ForegroundColor Cyan
Write-Host "- Remaining: $($remainingVotes.remainingVotes)"
Write-Host "- Maximum: $($remainingVotes.maxVotes)"
Write-Host "- Used: $($remainingVotes.votesUsed)"

Write-Host "`nVERDICT:" -ForegroundColor Magenta
$allSuccessful = $upvoteResult.success -and $toggleResult.success -and $downvoteResult.success -and $remainingVotes.success

if ($allSuccessful) {
    Write-Host "All tests passed successfully! The voting system is working as expected." -ForegroundColor Green
} else {
    Write-Host "Some tests failed. Please check the detailed results above." -ForegroundColor Red
}

Write-Host "`nTo run these tests manually, use the following PowerShell commands:"
Write-Host "`n# Check vote status"
Write-Host "Invoke-RestMethod -Uri '$baseUrl/api/vote?productId=$productId&clientId=$clientId' -Method Get | ConvertTo-Json"

Write-Host "`n# Submit upvote"
Write-Host "Invoke-RestMethod -Uri '$baseUrl/api/vote' -Method Post -Body '$upvoteBody' -ContentType 'application/json' | ConvertTo-Json"

Write-Host "`n# Submit downvote"
Write-Host "Invoke-RestMethod -Uri '$baseUrl/api/vote' -Method Post -Body '$downvoteBody' -ContentType 'application/json' | ConvertTo-Json"

Write-Host "`n# Check remaining votes"
Write-Host "Invoke-RestMethod -Uri '$baseUrl/api/vote/remaining-votes?clientId=$clientId' -Method Get | ConvertTo-Json`n" 