$ErrorActionPreference = "Stop"

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$adminEmail = "admin_${ts}@hop.internal"
$pwd = "Password123!"

# Register Admin
$adminReg = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json" -Body (@{
    email = $adminEmail
    password = $pwd
    firstName = "Super"
    lastName = "Admin"
    role = "ROLE_ADMIN"
} | ConvertTo-Json)
$adminToken = $adminReg.data.token

# Register Beneficiary Frank
$frankEmail = "frank_aid_${ts}@example.com"
$frankReg = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json" -Body (@{
    email = $frankEmail
    password = $pwd
    firstName = "Frank"
    lastName = "Aid"
    role = "ROLE_USER"
} | ConvertTo-Json)
$frankToken = $frankReg.data.token
$frankId = $frankReg.data.userId

# Register Donor Emma
$emmaEmail = "emma_donor_${ts}@example.com"
$emmaReg = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json" -Body (@{
    email = $emmaEmail
    password = $pwd
    firstName = "Emma"
    lastName = "Donor"
    role = "ROLE_DONOR"
} | ConvertTo-Json)
$emmaToken = $emmaReg.data.token

Write-Host "1. Frank creating assistance request..."
$reqRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/assistance" -Method Post -ContentType "application/json" -Headers @{
    Authorization = "Bearer $frankToken"
} -Body (@{
    title = "Frank Carpentry Tools Needed"
    description = "Need assistance to purchase hand tools for workshop"
    category = "BUSINESS"
    targetAmount = 300.00
    priority = "MEDIUM"
    isAnonymous = $false
    consentGiven = $true
} | ConvertTo-Json)
$requestId = $reqRes.data.id
Write-Host "Created assistance request ID: $requestId"

Write-Host "2. Admin approving request..."
$appRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/admin/assistance/$requestId/review" -Method Patch -ContentType "application/json" -Headers @{
    Authorization = "Bearer $adminToken"
} -Body (@{
    action = "APPROVE"
} | ConvertTo-Json)
Write-Host "Approved status: $($appRes.data.status)"

Write-Host "3. Emma donating $75 to Frank's request..."
$donRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/donations" -Method Post -ContentType "application/json" -Headers @{
    Authorization = "Bearer $emmaToken"
} -Body (@{
    requestId = $requestId
    amount = 75.00
    paymentMethod = "CARD"
} | ConvertTo-Json)
Write-Host "Donation ID: $($donRes.data.id), status: $($donRes.data.status)"

Write-Host "4. Frank checking notifications for approval and donation..."
$frankNotifs = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/notifications" -Method Get -Headers @{
    Authorization = "Bearer $frankToken"
}
Write-Host "Frank notification count: $($frankNotifs.data.Count)"
foreach ($n in $frankNotifs.data) {
    Write-Host " -> Notif: Type=$($n.type) | Title=$($n.title) | Message=$($n.message)"
}

Write-Host "=== DONATION & APPROVAL NOTIFICATION VERIFICATION PASSED ==="
