# DocuChain API Test Script
# Test all the login credentials to make sure the backend is working correctly

Write-Host "DocuChain API Testing" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host ""

# Test health endpoint first
Write-Host "Testing API Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET
    Write-Host "✅ Health Check: $($healthResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test login credentials
Write-Host "Testing Login Credentials..." -ForegroundColor Yellow
Write-Host ""

$testCredentials = @(
    @{email="admin@mu.ac.in"; password="admin123"; name="Rajesh Kumar"; role="admin"},
    @{email="meera.patel@mu.ac.in"; password="faculty123"; name="Dr. Meera Patel"; role="faculty"},
    @{email="aarav.sharma@student.mu.ac.in"; password="student123"; name="Aarav Sharma"; role="student"},
    @{email="admin@vit.edu"; password="admin123"; name="Priya Sharma"; role="admin"},
    @{email="kavita.joshi@vit.edu"; password="faculty123"; name="Dr. Kavita Joshi"; role="faculty"},
    @{email="rohan.desai@student.vit.edu"; password="student123"; name="Rohan Desai"; role="student"}
)

$successCount = 0
$totalCount = $testCredentials.Count

foreach ($cred in $testCredentials) {
    try {
        $loginData = @{
            email = $cred.email
            password = $cred.password
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "✅ Login successful: $($cred.name) ($($cred.role))" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "❌ Login failed: $($cred.name) - $($response.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Login error: $($cred.name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test Results:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host "Successful logins: $successCount/$totalCount" -ForegroundColor White

if ($successCount -eq $totalCount) {
    Write-Host ""
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Your DocuChain authentication system is working perfectly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Frontend Ready:" -ForegroundColor Cyan
    Write-Host "1. Start frontend: cd frontend && npm run dev" -ForegroundColor White
    Write-Host "2. Open http://localhost:5173" -ForegroundColor White
    Write-Host "3. Login with any of the tested credentials" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️  Some tests failed. Check the backend logs for errors." -ForegroundColor Yellow
}

Write-Host ""