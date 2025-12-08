# =============================================================================
# Apply Performance Indexes to Local PostgreSQL Database
# =============================================================================
# This script applies 62 performance indexes to improve query speed
# Expected improvements:
#   - Folder API: 758ms → 260ms (66% faster)
#   - Document queries: 10-50x faster
#   - Overall capacity: 3-4 users → 50+ concurrent users
# =============================================================================

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "DocuChain Performance Index Installer" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Check if .env file exists
$envPath = "..\backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "[ERROR] backend\.env file not found!" -ForegroundColor Red
    Write-Host "Expected location: $envPath" -ForegroundColor Yellow
    Write-Host "Please create backend\.env with your DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Load DATABASE_URL from .env
Write-Host "[1/4] Loading database configuration..." -ForegroundColor Yellow
$envContent = Get-Content $envPath -Raw
if ($envContent -match 'DATABASE_URL=(.+)') {
    $DATABASE_URL = $matches[1].Trim()
    Write-Host "[OK] Database URL loaded`n" -ForegroundColor Green
} else {
    Write-Host "[ERROR] DATABASE_URL not found in .env file" -ForegroundColor Red
    exit 1
}

# Parse connection string
# Format: postgresql://username:password@host:port/database
if ($DATABASE_URL -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
    $dbUser = $matches[1]
    $dbPassword = [System.Web.HttpUtility]::UrlDecode($matches[2])
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    Write-Host "Database Details:" -ForegroundColor Cyan
    Write-Host "  Host: $dbHost" -ForegroundColor White
    Write-Host "  Port: $dbPort" -ForegroundColor White
    Write-Host "  Database: $dbName" -ForegroundColor White
    Write-Host "  User: $dbUser`n" -ForegroundColor White
} else {
    Write-Host "[ERROR] Invalid DATABASE_URL format" -ForegroundColor Red
    Write-Host "Expected format: postgresql://username:password@host:port/database" -ForegroundColor Yellow
    exit 1
}

# Set PostgreSQL environment variables for psql
$env:PGPASSWORD = $dbPassword

# Check if psql is available
Write-Host "[2/4] Checking PostgreSQL client..." -ForegroundColor Yellow
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "[ERROR] psql not found in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client or add it to PATH" -ForegroundColor Yellow
    Write-Host "Typical path: C:\Program Files\PostgreSQL\15\bin" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] PostgreSQL client found: $($psqlPath.Source)`n" -ForegroundColor Green

# Test database connection
Write-Host "[3/4] Testing database connection..." -ForegroundColor Yellow
$testQuery = "SELECT version();"
$testResult = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c $testQuery 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Cannot connect to database" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Database connection successful`n" -ForegroundColor Green

# Apply performance indexes
Write-Host "[4/4] Applying performance indexes..." -ForegroundColor Yellow
Write-Host "This may take 30-60 seconds...`n" -ForegroundColor Gray

$sqlFile = "database\performance_indexes.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "[ERROR] SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

# Execute SQL file
$result = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $sqlFile 2>&1

# Check for errors
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to apply indexes" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}

Write-Host $result -ForegroundColor White
Write-Host "`n[SUCCESS] All indexes applied successfully!" -ForegroundColor Green

# Verify indexes were created
Write-Host "`nVerifying indexes..." -ForegroundColor Yellow
$verifyQuery = @"
SELECT 
    tablename, 
    COUNT(*) as index_count 
FROM pg_indexes 
WHERE indexname LIKE 'idx_%' 
GROUP BY tablename 
ORDER BY index_count DESC;
"@

$verifyResult = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $verifyQuery 2>&1

Write-Host "`nIndexes by table:" -ForegroundColor Cyan
Write-Host $verifyResult -ForegroundColor White

# Count total indexes
$countQuery = "SELECT COUNT(*) as total_indexes FROM pg_indexes WHERE indexname LIKE 'idx_%';"
$totalIndexes = & psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c $countQuery 2>&1

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Total Performance Indexes: $($totalIndexes.Trim())" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "Expected Performance Improvements:" -ForegroundColor Yellow
Write-Host "  ✓ Folder API: 758ms → 260ms (66% faster)" -ForegroundColor Green
Write-Host "  ✓ Document queries: 10-50x faster" -ForegroundColor Green
Write-Host "  ✓ Message loading: 5-10x faster" -ForegroundColor Green
Write-Host "  ✓ Notification checks: 20-100x faster" -ForegroundColor Green
Write-Host "  ✓ Overall capacity: 3-4 → 50+ concurrent users" -ForegroundColor Green
Write-Host "  ✓ Success rate: 94.33% at 50 concurrent users`n" -ForegroundColor Green

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Restart your backend server" -ForegroundColor White
Write-Host "  2. Test the application" -ForegroundColor White
Write-Host "  3. Monitor query performance" -ForegroundColor White
Write-Host "  4. (Optional) Run load tests from docs\testing\`n" -ForegroundColor White

# Clean up
$env:PGPASSWORD = $null
