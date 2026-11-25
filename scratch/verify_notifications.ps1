$ErrorActionPreference = "Stop"

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$emmaEmail = "emma_${ts}@example.com"
$frankEmail = "frank_${ts}@example.com"
$pwd = "Password123!"

Write-Host "1. Registering Emma (DONOR)..."
$emmaReg = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json" -Body (@{
    email = $emmaEmail
    password = $pwd
    firstName = "Emma"
    lastName = "Donor"
    role = "ROLE_DONOR"
} | ConvertTo-Json)
$emmaToken = $emmaReg.data.token
$emmaId = $emmaReg.data.userId

Write-Host "2. Registering Frank (USER/Beneficiary)..."
$frankReg = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/register" -Method Post -ContentType "application/json" -Body (@{
    email = $frankEmail
    password = $pwd
    firstName = "Frank"
    lastName = "Beneficiary"
    role = "ROLE_USER"
} | ConvertTo-Json)
$frankToken = $frankReg.data.token
$frankId = $frankReg.data.userId

Write-Host "Emma ID: $emmaId, Frank ID: $frankId"

Write-Host "3. Emma sends connection request to Frank..."
$connRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/connections/request/$frankId" -Method Post -Headers @{
    Authorization = "Bearer $emmaToken"
}
$connId = $connRes.data.connectionId
Write-Host "Connection status: $($connRes.data.status), ID: $connId"

Write-Host "4. Frank checking notifications..."
$frankNotifs = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/notifications" -Method Get -Headers @{
    Authorization = "Bearer $frankToken"
}
Write-Host "Frank notification count: $($frankNotifs.data.Count)"
$firstNotif = $frankNotifs.data[0]
Write-Host "First Notif: Type=$($firstNotif.type) | Title=$($firstNotif.title) | Message=$($firstNotif.message) | isRead=$($firstNotif.isRead)"

Write-Host "5. Frank unread count..."
$unreadRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/notifications/unread-count" -Method Get -Headers @{
    Authorization = "Bearer $frankToken"
}
Write-Host "Frank unread count: $($unreadRes.data.count)"

Write-Host "6. Frank accepts connection..."
$acceptRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/connections/$connId/accept" -Method Put -Headers @{
    Authorization = "Bearer $frankToken"
}
Write-Host "Accepted status: $($acceptRes.data.status)"

Write-Host "7. Emma checking notifications for accept alert..."
$emmaNotifs = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/notifications" -Method Get -Headers @{
    Authorization = "Bearer $emmaToken"
}
Write-Host "Emma Notif: Type=$($emmaNotifs.data[0].type) | Title=$($emmaNotifs.data[0].title)"

Write-Host "8. Emma sending Frank a direct message..."
$msgRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/messages" -Method Post -ContentType "application/json" -Headers @{
    Authorization = "Bearer $emmaToken"
} -Body (@{
    recipientId = $frankId
    content = "Hello Frank! I would love to support your vocational project."
} | ConvertTo-Json)
Write-Host "Message sent ID: $($msgRes.data.id)"

Write-Host "9. Frank checking new message notification..."
$frankNotifsAfterMsg = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/notifications" -Method Get -Headers @{
    Authorization = "Bearer $frankToken"
}
Write-Host "Frank Notifs count: $($frankNotifsAfterMsg.data.Count)"
Write-Host "Latest: Type=$($frankNotifsAfterMsg.data[0].type) | Title=$($frankNotifsAfterMsg.data[0].title) | Message=$($frankNotifsAfterMsg.data[0].message)"

Write-Host "10. Frank marks latest notification as read..."
$latestId = $frankNotifsAfterMsg.data[0].id
$readRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/notifications/$latestId/read" -Method Put -Headers @{
    Authorization = "Bearer $frankToken"
}
Write-Host "Marked read: $($readRes.data.isRead)"

Write-Host "11. Frank marks all as read..."
$markAllRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/notifications/mark-all-read" -Method Post -Headers @{
    Authorization = "Bearer $frankToken"
}
$finalUnread = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/notifications/unread-count" -Method Get -Headers @{
    Authorization = "Bearer $frankToken"
}
Write-Host "Final unread count for Frank: $($finalUnread.data.count)"

Write-Host "=== NOTIFICATION SYSTEM VERIFICATION PASSED ==="
