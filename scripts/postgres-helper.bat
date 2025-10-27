@echo off
setlocal EnableDelayedExpansion

echo 🐘 PostgreSQL Helper Script for Subscription Tracker
echo.

set CONTAINER_NAME=subscription_tracker_db
set DB_NAME=subscription_tracker
set DB_USER=postgres
set DB_PASSWORD=password

if "%1"=="" (
    echo Usage: postgres-helper.bat [command]
    echo.
    echo Available commands:
    echo   start     - Start PostgreSQL container
    echo   stop      - Stop PostgreSQL container
    echo   restart   - Restart PostgreSQL container
    echo   status    - Check container status
    echo   connect   - Connect to database with psql
    echo   logs      - Show container logs
    echo   reset     - Reset database (WARNING: deletes all data)
    echo   backup    - Create database backup
    echo   restore   - Restore database from backup
    echo   migrate   - Run migration scripts
    goto :end
)

if "%1"=="start" (
    echo Starting PostgreSQL container...
    docker-compose -f docker-compose-new.yml up -d postgres
    echo Waiting for database to be ready...
    timeout /t 15 /nobreak >nul
    docker exec %CONTAINER_NAME% pg_isready -U %DB_USER% -d %DB_NAME%
    if !errorlevel! equ 0 (
        echo ✅ PostgreSQL is ready!
    ) else (
        echo ❌ PostgreSQL failed to start
    )
    goto :end
)

if "%1"=="stop" (
    echo Stopping PostgreSQL container...
    docker-compose -f docker-compose-new.yml stop postgres
    echo ✅ PostgreSQL stopped
    goto :end
)

if "%1"=="restart" (
    echo Restarting PostgreSQL container...
    docker-compose -f docker-compose-new.yml restart postgres
    echo Waiting for database to be ready...
    timeout /t 10 /nobreak >nul
    docker exec %CONTAINER_NAME% pg_isready -U %DB_USER% -d %DB_NAME%
    echo ✅ PostgreSQL restarted
    goto :end
)

if "%1"=="status" (
    echo Checking PostgreSQL status...
    docker ps --filter "name=%CONTAINER_NAME%" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo.
    docker exec %CONTAINER_NAME% pg_isready -U %DB_USER% -d %DB_NAME% 2>nul
    if !errorlevel! equ 0 (
        echo ✅ Database is accepting connections
    ) else (
        echo ❌ Database is not ready
    )
    goto :end
)

if "%1"=="connect" (
    echo Connecting to PostgreSQL database...
    docker exec -it %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME%
    goto :end
)

if "%1"=="logs" (
    echo Showing PostgreSQL logs...
    docker logs %CONTAINER_NAME% --tail 50 -f
    goto :end
)

if "%1"=="reset" (
    echo ⚠️  WARNING: This will delete all data in the database!
    set /p confirm="Are you sure? Type 'yes' to continue: "
    if "!confirm!"=="yes" (
        echo Resetting database...
        docker exec %CONTAINER_NAME% psql -U %DB_USER% -c "DROP DATABASE IF EXISTS %DB_NAME%;"
        docker exec %CONTAINER_NAME% psql -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;"
        echo Running migration...
        docker exec -i %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% < backend\migrations\001_init.sql
        echo ✅ Database reset complete
    ) else (
        echo Operation cancelled
    )
    goto :end
)

if "%1"=="migrate" (
    echo Running database migrations...
    docker exec -i %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% < backend\migrations\001_init.sql
    echo ✅ Migration complete
    goto :end
)

if "%1"=="backup" (
    set BACKUP_FILE=backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
    set BACKUP_FILE=!BACKUP_FILE: =0!
    echo Creating backup: !BACKUP_FILE!.sql
    docker exec %CONTAINER_NAME% pg_dump -U %DB_USER% %DB_NAME% > !BACKUP_FILE!.sql
    echo ✅ Backup created: !BACKUP_FILE!.sql
    goto :end
)

echo Unknown command: %1
echo Run 'postgres-helper.bat' without arguments to see available commands.

:end