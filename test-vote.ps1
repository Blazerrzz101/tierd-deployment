# Test voting system
$ErrorActionPreference = "Stop"

Write-Host "`n===== Testing Voting System =====`n" -ForegroundColor Cyan

# Test data
$testUser = "test-user-$(Get-Random -Minimum 1000 -Maximum 9999)"
$productId = "j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6"
$baseUrl = "http://localhost:3000"

# Function to make API requests
function Invoke-ApiRequest {
    param (
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null
    )
    
    $uri = "$baseUrl$Endpoint"
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $uri -Method $Method
        } else {
            $jsonBody = $Body | ConvertTo-Json
            $response = Invoke-WebRequest -Uri $uri -Method $Method -Body $jsonBody -ContentType "application/json"
        }
        
        return $response.Content | ConvertFrom-Json
    } catch {
        Write-Host "Error calling $Method $uri" -ForegroundColor Red
        Write-Host "Status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response -and $_.Exception.Response.Content) {
            $responseContent = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()).ReadToEnd()
            Write-Host "Response content: $responseContent" -ForegroundColor Red
        }
        exit 1
    }
}

# Step 1: Get product details
Write-Host "1. Fetching product details...`n" -ForegroundColor Yellow
$product = Invoke-ApiRequest -Method "GET" -Endpoint "/api/products/product?id=$productId&clientId=$testUser"

if ($product.success) {
    Write-Host "SUCCESS: Product details retrieved" -ForegroundColor Green
    Write-Host "Product: $($product.product.name) (ID: $($product.product.id))"
    Write-Host "Initial Vote Counts:"
    Write-Host "  Upvotes: $($product.product.upvotes)"
    Write-Host "  Downvotes: $($product.product.downvotes)"
    Write-Host "  Score: $($product.product.score)"
    Write-Host "  User vote: $($product.product.userVote)" 
} else {
    Write-Host "ERROR: Failed to fetch product details" -ForegroundColor Red
    Write-Host $product.error 
    exit 1
}

Write-Host "`n---------------------------------`n"

# Step 2: Upvote the product
Write-Host "2. Upvoting the product...`n" -ForegroundColor Yellow
$voteBody = @{
    productId = $productId
    voteType = 1
    clientId = $testUser
}
$voteResult = Invoke-ApiRequest -Method "POST" -Endpoint "/api/products/product" -Body $voteBody

if ($voteResult.success) {
    Write-Host "SUCCESS: Upvote recorded" -ForegroundColor Green
    Write-Host "Updated Vote Counts:"
    Write-Host "  Upvotes: $($voteResult.upvotes)"
    Write-Host "  Downvotes: $($voteResult.downvotes)"
    Write-Host "  Score: $($voteResult.score)"
    Write-Host "  User vote: $($voteResult.voteType)"
} else {
    Write-Host "ERROR: Failed to upvote product" -ForegroundColor Red
    Write-Host $voteResult.error
    exit 1
}

Write-Host "`n---------------------------------`n"

# Step 3: Toggle the upvote (remove it)
Write-Host "3. Toggling the upvote (removing it)...`n" -ForegroundColor Yellow
$voteBody = @{
    productId = $productId
    voteType = 1  # Same vote type to toggle it off
    clientId = $testUser
}
$voteResult = Invoke-ApiRequest -Method "POST" -Endpoint "/api/products/product" -Body $voteBody

if ($voteResult.success) {
    Write-Host "SUCCESS: Upvote toggled (removed)" -ForegroundColor Green
    Write-Host "Updated Vote Counts:"
    Write-Host "  Upvotes: $($voteResult.upvotes)"
    Write-Host "  Downvotes: $($voteResult.downvotes)"
    Write-Host "  Score: $($voteResult.score)"
    Write-Host "  User vote: $($voteResult.voteType)"
} else {
    Write-Host "ERROR: Failed to toggle upvote" -ForegroundColor Red
    Write-Host $voteResult.error
    exit 1
}

Write-Host "`n---------------------------------`n"

# Step 4: Downvote the product
Write-Host "4. Downvoting the product...`n" -ForegroundColor Yellow
$voteBody = @{
    productId = $productId
    voteType = -1
    clientId = $testUser
}
$voteResult = Invoke-ApiRequest -Method "POST" -Endpoint "/api/products/product" -Body $voteBody

if ($voteResult.success) {
    Write-Host "SUCCESS: Downvote recorded" -ForegroundColor Green
    Write-Host "Updated Vote Counts:"
    Write-Host "  Upvotes: $($voteResult.upvotes)"
    Write-Host "  Downvotes: $($voteResult.downvotes)"
    Write-Host "  Score: $($voteResult.score)"
    Write-Host "  User vote: $($voteResult.voteType)"
} else {
    Write-Host "ERROR: Failed to downvote product" -ForegroundColor Red
    Write-Host $voteResult.error
    exit 1
}

Write-Host "`n---------------------------------`n"

# Step 5: Change from downvote to upvote
Write-Host "5. Changing from downvote to upvote...`n" -ForegroundColor Yellow
$voteBody = @{
    productId = $productId
    voteType = 1
    clientId = $testUser
}
$voteResult = Invoke-ApiRequest -Method "POST" -Endpoint "/api/products/product" -Body $voteBody

if ($voteResult.success) {
    Write-Host "SUCCESS: Vote changed to upvote" -ForegroundColor Green
    Write-Host "Updated Vote Counts:"
    Write-Host "  Upvotes: $($voteResult.upvotes)"
    Write-Host "  Downvotes: $($voteResult.downvotes)"
    Write-Host "  Score: $($voteResult.score)"
    Write-Host "  User vote: $($voteResult.voteType)"
} else {
    Write-Host "ERROR: Failed to change vote" -ForegroundColor Red
    Write-Host $voteResult.error
    exit 1
}

Write-Host "`n---------------------------------`n"

# Step 6: Verify final product state
Write-Host "6. Verifying final product state...`n" -ForegroundColor Yellow
$finalProduct = Invoke-ApiRequest -Method "GET" -Endpoint "/api/products/product?id=$productId&clientId=$testUser"

if ($finalProduct.success) {
    Write-Host "SUCCESS: Final product state retrieved" -ForegroundColor Green
    Write-Host "Product: $($finalProduct.product.name) (ID: $($finalProduct.product.id))"
    Write-Host "Final Vote Counts:"
    Write-Host "  Upvotes: $($finalProduct.product.upvotes)"
    Write-Host "  Downvotes: $($finalProduct.product.downvotes)"
    Write-Host "  Score: $($finalProduct.product.score)"
    Write-Host "  User vote: $($finalProduct.product.userVote)"
} else {
    Write-Host "ERROR: Failed to fetch final product state" -ForegroundColor Red
    Write-Host $finalProduct.error
    exit 1
}

Write-Host "`n===== Testing Complete! =====`n" -ForegroundColor Cyan
Write-Host "All tests passed successfully." -ForegroundColor Green 