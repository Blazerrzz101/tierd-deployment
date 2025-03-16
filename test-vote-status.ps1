param(
    [string]$clientId = "test-user-3477",
    [string]$productId = "j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6",
    [string]$baseUrl = "http://localhost:3001"
)

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Create a log file with timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = "vote-test-$timestamp.log"

# Function to write to console and log file with different levels
function WriteLog {
    param (
        [string]$message,
        [switch]$header,
        [switch]$subheader,
        [switch]$isError,
        [switch]$success,
        [switch]$info
    )

    # Format message based on level
    if ($header) {
        $formattedMessage = "`n============================================================"
        Add-Content -Path $logFile -Value $formattedMessage
        Write-Host $formattedMessage
        
        $formattedMessage = $message.ToUpper()
        Add-Content -Path $logFile -Value $formattedMessage
        Write-Host $formattedMessage -ForegroundColor Cyan
        
        $formattedMessage = "============================================================"
        Add-Content -Path $logFile -Value $formattedMessage
        Write-Host $formattedMessage
    }
    elseif ($subheader) {
        $formattedMessage = "`n----------------------------------------"
        Add-Content -Path $logFile -Value $formattedMessage
        Write-Host $formattedMessage
        
        $formattedMessage = $message
        Add-Content -Path $logFile -Value $formattedMessage
        Write-Host $formattedMessage -ForegroundColor Yellow
        
        $formattedMessage = "----------------------------------------"
        Add-Content -Path $logFile -Value $formattedMessage
        Write-Host $formattedMessage
    }
    elseif ($isError) {
        $formattedMessage = "[ERROR] $message"
        Add-Content -Path $logFile -Value $formattedMessage
        Write-Host $formattedMessage -ForegroundColor Red
    }
    elseif ($success) {
        $formattedMessage = "[SUCCESS] $message"
        Add-Content -Path $logFile -Value $formattedMessage
        Write-Host $formattedMessage -ForegroundColor Green
    }
    elseif ($info) {
        $formattedMessage = "[INFO] $message"
        Add-Content -Path $logFile -Value $formattedMessage
        Write-Host $formattedMessage -ForegroundColor Gray
    }
    else {
        Add-Content -Path $logFile -Value $message
        Write-Host $message
    }
}

# Start the test
WriteLog -header "VOTING SYSTEM TEST"
WriteLog -info "Test started at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
WriteLog -info "Client ID: $clientId"
WriteLog -info "Product ID: $productId"
WriteLog -info "Base URL: $baseUrl"
WriteLog -info "Log file: $logFile"

# Function to make API requests with error handling
function Invoke-ApiRequest {
    param (
        [string]$method,
        [string]$endpoint,
        [object]$body = $null,
        [string]$description
    )
    
    $url = "$baseUrl$endpoint"
    
    WriteLog -info "Making $method request to: $url"
    
    try {
        $params = @{
            Method = $method
            Uri = $url
            ContentType = "application/json"
            UseBasicParsing = $true
        }
        
        if ($body -ne $null) {
            $jsonBody = ConvertTo-Json -InputObject $body
            $params.Body = $jsonBody
            WriteLog -info "Request body: $jsonBody"
        }
        
        $response = Invoke-WebRequest @params
        $content = $response.Content | ConvertFrom-Json
        
        WriteLog -success "$description completed successfully"
        WriteLog -info "Response: $($response.Content)"
        
        return $content
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $statusDescription = $_.Exception.Response.StatusDescription
        
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errorContent = $reader.ReadToEnd() | ConvertFrom-Json
                $errorMessage = $errorContent.error
            }
            catch {
                $errorMessage = $_.Exception.Message
            }
        }
        else {
            $errorMessage = $_.Exception.Message
        }
        
        WriteLog -isError "$description failed with status $statusCode $statusDescription"
        WriteLog -isError "Error message: $errorMessage"
        throw $_
    }
}

# Test 1: Fetch product details
WriteLog -subheader "TEST 1: Fetch Product Details"

try {
    $productEndpoint = "/api/products/product?id=$productId&clientId=$clientId"
    $productDetails = Invoke-ApiRequest -method "GET" -endpoint $productEndpoint -description "Fetching product details"
    
    if ($productDetails.success -eq $true) {
        WriteLog -success "Product details retrieved successfully"
        WriteLog "Product: $($productDetails.product.name)"
        WriteLog "Upvotes: $($productDetails.product.upvotes)"
        WriteLog "Downvotes: $($productDetails.product.downvotes)"
        WriteLog "Score: $($productDetails.product.score)"
        WriteLog "User Vote: $($productDetails.product.userVote)"
    }
    else {
        WriteLog -isError "Failed to retrieve product details: $($productDetails.error)"
        exit 1
    }
}
catch {
    WriteLog -isError "Exception occurred while fetching product details"
    exit 1
}

# Test 2: Upvote the product
WriteLog -subheader "TEST 2: Upvote Product"

try {
    $voteBody = @{
        productId = $productId
        voteType = 1
        clientId = $clientId
    }
    
    $voteResult = Invoke-ApiRequest -method "POST" -endpoint "/api/vote" -body $voteBody -description "Upvoting product"
    
    if ($voteResult.success -eq $true) {
        WriteLog -success "Product upvoted successfully"
        WriteLog "New upvote count: $($voteResult.upvotes)"
        WriteLog "New downvote count: $($voteResult.downvotes)"
        WriteLog "User vote type: $($voteResult.voteType)"
        WriteLog "Score: $($voteResult.score)"
    }
    else {
        WriteLog -isError "Failed to upvote product: $($voteResult.error)"
        exit 1
    }
}
catch {
    WriteLog -isError "Exception occurred while upvoting product"
    exit 1
}

# Test 3: Toggle the upvote (remove it)
WriteLog -subheader "TEST 3: Toggle Upvote (Remove it)"

try {
    $voteBody = @{
        productId = $productId
        voteType = 1
        clientId = $clientId
    }
    
    $voteResult = Invoke-ApiRequest -method "POST" -endpoint "/api/vote" -body $voteBody -description "Toggling upvote"
    
    if ($voteResult.success -eq $true) {
        WriteLog -success "Upvote toggled successfully"
        WriteLog "New upvote count: $($voteResult.upvotes)"
        WriteLog "New downvote count: $($voteResult.downvotes)"
        WriteLog "User vote type: $($voteResult.voteType)"
        WriteLog "Score: $($voteResult.score)"
    }
    else {
        WriteLog -isError "Failed to toggle upvote: $($voteResult.error)"
        exit 1
    }
}
catch {
    WriteLog -isError "Exception occurred while toggling upvote"
    exit 1
}

# Test 4: Downvote the product
WriteLog -subheader "TEST 4: Downvote Product"

try {
    $voteBody = @{
        productId = $productId
        voteType = -1
        clientId = $clientId
    }
    
    $voteResult = Invoke-ApiRequest -method "POST" -endpoint "/api/vote" -body $voteBody -description "Downvoting product"
    
    if ($voteResult.success -eq $true) {
        WriteLog -success "Product downvoted successfully"
        WriteLog "New upvote count: $($voteResult.upvotes)"
        WriteLog "New downvote count: $($voteResult.downvotes)"
        WriteLog "User vote type: $($voteResult.voteType)"
        WriteLog "Score: $($voteResult.score)"
    }
    else {
        WriteLog -isError "Failed to downvote product: $($voteResult.error)"
        exit 1
    }
}
catch {
    WriteLog -isError "Exception occurred while downvoting product"
    exit 1
}

# Test 5: Change vote from downvote to upvote
WriteLog -subheader "TEST 5: Change Vote (Downvote to Upvote)"

try {
    $voteBody = @{
        productId = $productId
        voteType = 1
        clientId = $clientId
    }
    
    $voteResult = Invoke-ApiRequest -method "POST" -endpoint "/api/vote" -body $voteBody -description "Changing vote from downvote to upvote"
    
    if ($voteResult.success -eq $true) {
        WriteLog -success "Vote changed successfully from downvote to upvote"
        WriteLog "New upvote count: $($voteResult.upvotes)"
        WriteLog "New downvote count: $($voteResult.downvotes)"
        WriteLog "User vote type: $($voteResult.voteType)"
        WriteLog "Score: $($voteResult.score)"
    }
    else {
        WriteLog -isError "Failed to change vote: $($voteResult.error)"
        exit 1
    }
}
catch {
    WriteLog -isError "Exception occurred while changing vote"
    exit 1
}

# Test 6: Check final product state
WriteLog -subheader "TEST 6: Verify Final Product State"

try {
    $productEndpoint = "/api/products/product?id=$productId&clientId=$clientId"
    $productDetails = Invoke-ApiRequest -method "GET" -endpoint $productEndpoint -description "Fetching final product state"
    
    if ($productDetails.success -eq $true) {
        WriteLog -success "Final product state retrieved successfully"
        WriteLog "Product: $($productDetails.product.name)"
        WriteLog "Final upvotes: $($productDetails.product.upvotes)"
        WriteLog "Final downvotes: $($productDetails.product.downvotes)"
        WriteLog "Final score: $($productDetails.product.score)"
        WriteLog "Final user vote: $($productDetails.product.userVote)"
    }
    else {
        WriteLog -isError "Failed to retrieve final product state: $($productDetails.error)"
        exit 1
    }
}
catch {
    WriteLog -isError "Exception occurred while fetching final product state"
    exit 1
}

# Test conclusion
WriteLog -header "TEST SUMMARY"

$allTestsPassed = $true

WriteLog -success "All tests completed successfully!"
WriteLog "Test completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
WriteLog "Results logged to: $logFile"

exit 0 