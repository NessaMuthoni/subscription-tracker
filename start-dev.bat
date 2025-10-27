@echo off
setlocal EnableDelayedExpansion

echo 🚀 Starting Subscription Tracker Development Environment...

REM Kill any existing processes on our ports  
echo 📋 Stopping any existing services...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul

REM Start PostgreSQL
echo 🐘 Starting PostgreSQL database...
docker-compose -f docker-compose-new.yml up -d postgres

REM Wait for database to be ready
echo ⏳ Waiting for database to be ready...
timeout /t 15 /nobreak >nul

REM Check database health
:CHECK_DB
docker exec subscription_tracker_db pg_isready -U postgres -d subscription_tracker >nul 2>&1
if errorlevel 1 (
    echo ⏳ Waiting for database connection...
    timeout /t 2 /nobreak >nul
    goto CHECK_DB
)

echo ✅ Database is ready!

REM Start backend
echo 🔧 Starting Go backend...
cd backend
start /B go run cmd/server/main.go
cd ..

REM Start AI service
echo 🤖 Starting AI service...
cd ai-service
start /B python main.py
cd ..

REM Start frontend
echo ⚛️  Starting Next.js frontend...
cd Frontend
start /B npm run dev
cd ..

echo.
echo 🎉 All services started successfully!
echo.
echo 📍 Service URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8080  
echo    AI Service: http://localhost:8000
echo    Database: localhost:5432
echo.
echo 📊 Health Checks:
echo    Backend Health: http://localhost:8080/health
echo    AI Health: http://localhost:8000/health
echo.
echo 🔑 Press any key to stop all services and exit...

pause >nul

echo.
echo 🛑 Stopping all services...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul
docker-compose -f docker-compose-new.yml down
echo ✅ All services stopped