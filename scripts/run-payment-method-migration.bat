@echo off
setlocal EnableDelayedExpansion

echo 🔄 Running Database Migration: Add Payment Method
echo.

set CONTAINER_NAME=subscription_tracker_db
set DB_NAME=subscription_tracker
set DB_USER=postgres

echo Checking if PostgreSQL container is running...
docker ps | findstr %CONTAINER_NAME% >nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL container is not running!
    echo Run: scripts\postgres-helper.bat start
    exit /b 1
)

echo ✅ Container is running
echo.

echo Running migration: 002_add_payment_method_to_subscriptions.sql
docker exec -i %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% < backend\migrations\002_add_payment_method_to_subscriptions.sql

if %errorlevel% equ 0 (
    echo.
    echo ✅ Migration completed successfully!
    echo.
    echo Verifying the column was added...
    docker exec %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "\d subscriptions"
    echo.
    echo 🎉 Payment method column is now available!
    echo    You can now create/edit subscriptions with payment methods.
) else (
    echo.
    echo ❌ Migration failed!
    echo Check the error message above.
    exit /b 1
)

pause
