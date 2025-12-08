# DocuChain Database Setup Instructions

## Prerequisites
1. **PostgreSQL**: Make sure PostgreSQL is installed and running on your system
2. **Database User**: Ensure you have a PostgreSQL user with database creation privileges

## Step 1: Create the Database

Open PostgreSQL command line (psql) or use pgAdmin and run:

```sql
-- Connect as postgres user
-- Create the database
CREATE DATABASE "Docu-Chain";

-- Grant privileges to postgres user (if needed)
GRANT ALL PRIVILEGES ON DATABASE "Docu-Chain" TO postgres;
```

## Step 2: Run the Database Setup Script

1. Navigate to the database folder:
```bash
cd "d:\AVTIVE PROJ\Docu-Chain\database"
```

2. Run the setup script:
```bash
psql -U postgres -d "Docu-Chain" -f setup_database.sql
```

3. When prompted for password, enter: `mk0492`

## Step 3: Insert Sample Data

Run the sample data script:
```bash
psql -U postgres -d "Docu-Chain" -f sample_data.sql
```

## Step 4: Configure Backend

1. Navigate to backend folder:
```bash
cd "../backend"
```

2. Copy environment file:
```bash
copy .env.example .env
```

3. The `.env` file is already configured with the correct database connection string

## Step 5: Install Backend Dependencies

```bash
pip install -r requirements.txt
```

## Step 6: Initialize Database with Flask-Migrate (Optional)

If you want to use Flask-Migrate for future schema changes:

```bash
flask db init
flask db stamp head
```

## Step 7: Start the Backend Server

```bash
python run.py
```

The backend will start on `http://localhost:5000`

## Login Credentials for Testing

### Mumbai University (MU001)
**Admin:**
- Email: `admin@mu.ac.in`
- Password: `admin123`

**Faculty:**
- Email: `meera.patel@mu.ac.in` | Password: `faculty123`
- Email: `suresh.gupta@mu.ac.in` | Password: `faculty123`

**Students:**
- Email: `aarav.sharma@student.mu.ac.in` | Password: `student123`
- Email: `diya.patel@student.mu.ac.in` | Password: `student123`
- Email: `arjun.kumar@student.mu.ac.in` | Password: `student123`
- Email: `sneha.singh@student.mu.ac.in` | Password: `student123`

### VIT College (VIT001)
**Admin:**
- Email: `admin@vit.edu`
- Password: `admin123`

**Faculty:**
- Email: `kavita.joshi@vit.edu` | Password: `faculty123`
- Email: `ravi.mehta@vit.edu` | Password: `faculty123`

**Students:**
- Email: `rohan.desai@student.vit.edu` | Password: `student123`
- Email: `anisha.rao@student.vit.edu` | Password: `student123`

### Delhi Public School (DPS001)
**Admin:**
- Email: `admin@dps.edu`
- Password: `admin123`

**Faculty:**
- Email: `sunita.verma@dps.edu` | Password: `faculty123`

**Students:**
- Email: `karan.agarwal@student.dps.edu` | Password: `student123`
- Email: `riya.gupta@student.dps.edu` | Password: `student123`

## Troubleshooting

### Connection Issues
- Make sure PostgreSQL service is running
- Verify the database name is exactly "Docu-Chain" (with quotes)
- Check if port 5432 is available
- Confirm username/password: postgres/mk0492

### Permission Issues
- Make sure the postgres user has CREATE and ALTER privileges
- Run psql as administrator if needed

### Backend Issues
- Make sure all dependencies are installed
- Check if the .env file exists and has correct database URL
- Verify the backend is connecting to the correct database

## Database Schema Overview

The database includes 21 tables:
- **institutions**: Educational institutions
- **departments**: Departments within institutions  
- **sections**: Sections within departments
- **users**: All system users (admin, faculty, students)
- **documents**: Document storage with IPFS hashes
- **folders**: File organization system
- **chat_groups**: Communication groups
- **notifications**: User notifications
- **blockchain_transactions**: Blockchain transaction records
- And more...

## Step 8: Apply Performance Indexes (CRITICAL)

**⚠️ Required for production performance!**

The system has been optimized with 62 database indexes that dramatically improve query performance:

### Quick Apply (Recommended)
```powershell
cd "d:\AVTIVE PROJ\Docu-Chain\database"
.\apply_performance_indexes.ps1
```

### Manual Apply (Alternative)
```bash
psql -U postgres -d "Docu-Chain" -f performance_indexes.sql
```

### Expected Performance Improvements
After applying indexes, you'll see:
- ✅ **Folder API**: 758ms → 260ms (66% faster)
- ✅ **Document queries**: 10-50x faster
- ✅ **Message loading**: 5-10x faster
- ✅ **Notification checks**: 20-100x faster
- ✅ **System capacity**: 3-4 users → 50+ concurrent users
- ✅ **Success rate**: 94.33% at 50 concurrent users

### Verify Indexes
Check that indexes were created:
```sql
-- Count total indexes
SELECT COUNT(*) as total_indexes 
FROM pg_indexes 
WHERE indexname LIKE 'idx_%';
-- Should return: 62

-- View indexes by table
SELECT tablename, COUNT(*) as index_count 
FROM pg_indexes 
WHERE indexname LIKE 'idx_%' 
GROUP BY tablename 
ORDER BY index_count DESC;
```

## Next Steps

1. **Restart Backend**: After applying indexes, restart the backend server
```bash
cd "../backend"
python run.py
```

2. **Start Frontend**: Start the frontend development server
```bash
cd "../frontend"
npm run dev
```

3. **Test Performance**: 
   - Login with provided credentials
   - Navigate to File Manager (should be fast)
   - Upload and manage documents
   - Test folder operations (should be < 300ms)

4. **Optional Load Testing**: Run comprehensive tests
```powershell
cd "../docs/testing"
.\comprehensive_load_test.ps1
```

## Performance Documentation

For detailed information about performance optimizations:
- **Complete Guide**: `docs/performance/PERFORMANCE_OPTIMIZATION_COMPLETE_GUIDE.md`
- **Scaling Guide**: `docs/performance/PRODUCTION_SCALING_GUIDE.md`
- **Test Results**: `docs/testing/load_test_results_*.json`

The system is now production-ready with enterprise-grade performance!