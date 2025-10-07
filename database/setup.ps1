# DocuChain Database Setup Script for Windows
# This script helps set up the PostgreSQL database for DocuChain

Write-Host "DocuChain Database Setup" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""

# Check if PostgreSQL is installed
$pgPath = ""
$commonPaths = @(
    "C:\Program Files\PostgreSQL\*\bin\psql.exe",
    "C:\PostgreSQL\*\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe"
)

foreach ($path in $commonPaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
    if ($found) {
        $pgPath = Split-Path $found.FullName
        break
    }
}

if ($pgPath -eq "") {
    Write-Host "PostgreSQL not found in common installation paths." -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is installed and provide the path to psql.exe:" -ForegroundColor Yellow
    Write-Host "Example: C:\Program Files\PostgreSQL\15\bin" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can also run the SQL scripts manually using pgAdmin:" -ForegroundColor Yellow
    Write-Host "1. Open pgAdmin" -ForegroundColor Yellow
    Write-Host "2. Create database 'Docu-Chain'" -ForegroundColor Yellow
    Write-Host "3. Run setup_database.sql" -ForegroundColor Yellow
    Write-Host "4. Run sample_data.sql" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found PostgreSQL at: $pgPath" -ForegroundColor Green

# Set environment variable for this session
$env:PATH = "$pgPath;$env:PATH"

Write-Host ""
Write-Host "Step 1: Creating database..." -ForegroundColor Yellow

# Create database
$createDbScript = @"
CREATE DATABASE `"Docu-Chain`";
"@

$createDbScript | & "$pgPath\psql.exe" -U postgres -d postgres

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database 'Docu-Chain' created successfully!" -ForegroundColor Green
} else {
    Write-Host "Database may already exist or there was an error." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Setting up database schema..." -ForegroundColor Yellow

# Run setup script
& "$pgPath\psql.exe" -U postgres -d "Docu-Chain" -f "setup_database.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database schema created successfully!" -ForegroundColor Green
} else {
    Write-Host "Error creating database schema. Please check the output above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Inserting sample data..." -ForegroundColor Yellow

# Run sample data script
& "$pgPath\psql.exe" -U postgres -d "Docu-Chain" -f "sample_data.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Sample data inserted successfully!" -ForegroundColor Green
} else {
    Write-Host "Error inserting sample data. Please check the output above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Database setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Login Credentials for Testing:" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ADMIN ACCOUNTS:" -ForegroundColor Yellow
Write-Host "• admin@mu.ac.in (password: admin123) - Mumbai University" -ForegroundColor White
Write-Host "• admin@vit.edu (password: admin123) - VIT College" -ForegroundColor White
Write-Host "• admin@dps.edu (password: admin123) - Delhi Public School" -ForegroundColor White
Write-Host ""
Write-Host "FACULTY ACCOUNTS:" -ForegroundColor Yellow
Write-Host "• meera.patel@mu.ac.in (password: faculty123) - CS Department" -ForegroundColor White
Write-Host "• suresh.gupta@mu.ac.in (password: faculty123) - IT Department" -ForegroundColor White
Write-Host "• kavita.joshi@vit.edu (password: faculty123) - Computer Engineering" -ForegroundColor White
Write-Host "• ravi.mehta@vit.edu (password: faculty123) - Mechanical Engineering" -ForegroundColor White
Write-Host "• sunita.verma@dps.edu (password: faculty123) - High School" -ForegroundColor White
Write-Host ""
Write-Host "STUDENT ACCOUNTS:" -ForegroundColor Yellow
Write-Host "• aarav.sharma@student.mu.ac.in (password: student123)" -ForegroundColor White
Write-Host "• diya.patel@student.mu.ac.in (password: student123)" -ForegroundColor White
Write-Host "• arjun.kumar@student.mu.ac.in (password: student123)" -ForegroundColor White
Write-Host "• sneha.singh@student.mu.ac.in (password: student123)" -ForegroundColor White
Write-Host "• rohan.desai@student.vit.edu (password: student123)" -ForegroundColor White
Write-Host "• anisha.rao@student.vit.edu (password: student123)" -ForegroundColor White
Write-Host "• karan.agarwal@student.dps.edu (password: student123)" -ForegroundColor White
Write-Host "• riya.gupta@student.dps.edu (password: student123)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Navigate to backend folder: cd ..\backend" -ForegroundColor White
Write-Host "2. Copy environment file: copy .env.example .env" -ForegroundColor White
Write-Host "3. Install dependencies: pip install -r requirements.txt" -ForegroundColor White
Write-Host "4. Start backend server: python run.py" -ForegroundColor White
Write-Host "5. Start frontend server: cd ..\frontend && npm run dev" -ForegroundColor White
Write-Host ""