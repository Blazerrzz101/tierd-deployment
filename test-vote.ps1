# Test voting system
$ErrorActionPreference = "Stop"

Write-Host "Testing voting system..."

# Test data
$testUser = "test-user-4"
$productId = "j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6"
$productName = "ASUS ROG Swift PG279QM"

# Function to make API requests
function Invoke-VoteApi {
    param (
        [string]$Method,
        [string]$Endpoint,
        [object]$Body
    )
    
    $uri = "http://localhost:3000/api/$Endpoint"
    
    if ($Method -eq "GET") {
        $response = Invoke-WebRequest -Uri $uri -Method $Method
    } else {
        $jsonBody = $Body | ConvertTo-Json
        $response = Invoke-WebRequest -Uri $uri -Method $Method -Body $jsonBody -ContentType "application/json"
    }
    
    return $response.Content | ConvertFrom-Json
}

# 1. Get initial product state
Write-Host "`nGetting initial product state..."
$products = Invoke-VoteApi -Method "GET" -Endpoint "products?clientId=$testUser"
$initialProduct = $products.products | Where-Object { $_.id -eq $productId }
Write-Host "Initial vote counts: Up=$($initialProduct.upvotes), Down=$($initialProduct.downvotes), Score=$($initialProduct.score)"

# 2. Add upvote
Write-Host "`nAdding upvote..."
$voteBody = @{
    productId = $productId
    voteType = 1
    clientId = $testUser
    productName = $productName
}
$voteResult = Invoke-VoteApi -Method "POST" -Endpoint "vote" -Body $voteBody
Write-Host "Vote result: $($voteResult | ConvertTo-Json)"

# 3. Get updated product state
Write-Host "`nGetting updated product state..."
$products = Invoke-VoteApi -Method "GET" -Endpoint "products?clientId=$testUser"
$updatedProduct = $products.products | Where-Object { $_.id -eq $productId }
Write-Host "Updated vote counts: Up=$($updatedProduct.upvotes), Down=$($updatedProduct.downvotes), Score=$($updatedProduct.score)"

Write-Host "`nTest completed!" 