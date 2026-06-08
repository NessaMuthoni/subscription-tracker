@echo off
echo ========================================
echo  Starting Subscription Tracker (Docker)
echo ========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and configure it.
    echo.
    pause
    exit /b 1
)

echo Stopping any existing containers...
docker-compose down

echo.
echo Building and starting all services...
echo - PostgreSQL Database
echo - Go Backend API
echo - Python AI Service
echo - Next.js Frontend
echo.

docker-compose up --build

pause
