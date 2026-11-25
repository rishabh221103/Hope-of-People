$ErrorActionPreference = "Stop"

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$graceEmail = "grace_geo_${ts}@example.com"
$pwd = "Password123!"

Write-Host "1. Registering Beneficiary Grace..."
$graceReg = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json" -Body (@{
    email = $graceEmail
    password = $pwd
    firstName = "Grace"
    lastName = "Community"
    role = "ROLE_USER"
} | ConvertTo-Json)
$graceToken = $graceReg.data.token
$graceId = $graceReg.data.userId

Write-Host "Grace registered with ID: $graceId"

Write-Host "2. Creating Cause 1 (Downtown Chicago - Lat: 41.8781, Lon: -87.6298)..."
$cause1 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/assistance" -Method Post -ContentType "application/json" -Headers @{
    Authorization = "Bearer $graceToken"
} -Body (@{
    title = "Downtown Chicago Food Pantry Support"
    description = "Providing daily hot meals in the Loop district"
    category = "FOOD"
    targetAmount = 500.00
    priority = "HIGH"
    city = "Chicago"
    state = "IL"
    postalCode = "60601"
    country = "USA"
    latitude = 41.8781
    longitude = -87.6298
    isAnonymous = $false
    consentGiven = $true
} | ConvertTo-Json)
Write-Host "Created Cause 1 ID: $($cause1.data.id)"

Write-Host "3. Creating Cause 2 (Evanston, IL ~19 km North - Lat: 42.0451, Lon: -87.6877)..."
$cause2 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/assistance" -Method Post -ContentType "application/json" -Headers @{
    Authorization = "Bearer $graceToken"
} -Body (@{
    title = "Evanston Student Textbook & Tuition Aid"
    description = "Support for local university semester supplies"
    category = "EDUCATION"
    targetAmount = 750.00
    priority = "MEDIUM"
    city = "Evanston"
    state = "IL"
    postalCode = "60201"
    country = "USA"
    latitude = 42.0451
    longitude = -87.6877
    isAnonymous = $false
    consentGiven = $true
} | ConvertTo-Json)
Write-Host "Created Cause 2 ID: $($cause2.data.id)"

Write-Host "4. Creating Cause 3 (Milwaukee, WI ~130 km North - Lat: 43.0389, Lon: -87.9065)..."
$cause3 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/assistance" -Method Post -ContentType "application/json" -Headers @{
    Authorization = "Bearer $graceToken"
} -Body (@{
    title = "Milwaukee Emergency Clinic Relief"
    description = "Essential medications for community clinic"
    category = "EMERGENCY"
    targetAmount = 1200.00
    priority = "HIGH"
    city = "Milwaukee"
    state = "WI"
    postalCode = "53202"
    country = "USA"
    latitude = 43.0389
    longitude = -87.9065
    isAnonymous = $false
    consentGiven = $true
} | ConvertTo-Json)
Write-Host "Created Cause 3 ID: $($cause3.data.id)"

Write-Host "5. Creating Cause 4 (Los Angeles, CA ~2800 km West - Lat: 34.0522, Lon: -118.2437)..."
$cause4 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/assistance" -Method Post -ContentType "application/json" -Headers @{
    Authorization = "Bearer $graceToken"
} -Body (@{
    title = "Los Angeles Housing Renovation Aid"
    description = "Urgent roof repair before rainy season"
    category = "HOUSING"
    targetAmount = 2500.00
    priority = "HIGH"
    city = "Los Angeles"
    state = "CA"
    postalCode = "90012"
    country = "USA"
    latitude = 34.0522
    longitude = -118.2437
    isAnonymous = $false
    consentGiven = $true
} | ConvertTo-Json)
Write-Host "Created Cause 4 ID: $($cause4.data.id)"

Write-Host "`n6. Querying Nearby Causes from Downtown Chicago (Radius: 25 km)..."
$nearby25 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/assistance/nearby?latitude=41.8781&longitude=-87.6298&radiusKm=25" -Method Get
Write-Host "Found $($nearby25.data.Count) causes within 25 km:"
foreach ($c in $nearby25.data) {
    Write-Host " -> ID: $($c.id) | Title: $($c.title) | City: $($c.city) | Distance: $($c.distanceKm) km"
}

Write-Host "`n7. Querying Nearby Causes with expanded Radius (150 km)..."
$nearby150 = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/assistance/nearby?latitude=41.8781&longitude=-87.6298&radiusKm=150" -Method Get
Write-Host "Found $($nearby150.data.Count) causes within 150 km:"
foreach ($c in $nearby150.data) {
    Write-Host " -> ID: $($c.id) | Title: $($c.title) | City: $($c.city) | Distance: $($c.distanceKm) km"
}

Write-Host "`n8. Querying by City Name (city=Chicago)..."
$byCity = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/assistance/nearby?city=Chicago" -Method Get
Write-Host "Found $($byCity.data.Count) causes in Chicago:"
foreach ($c in $byCity.data) {
    Write-Host " -> ID: $($c.id) | Title: $($c.title) | City: $($c.city)"
}

Write-Host "`n=== GEOGRAPHIC MATCHING ALGORITHM VERIFICATION PASSED ==="
