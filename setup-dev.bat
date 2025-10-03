@echo off
REM Windows development setup script

echo Setting up Subscription Tracker development environment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Create .env file for backend if it doesn't exist
if not exist "backend\.env" (
    echo Creating backend .env file...
    copy "backend\.env.example" "backend\.env"
    echo Please update backend\.env with your actual configuration values.
)

REM Install Go dependencies
echo Installing Go dependencies...
cd backend
go mod download
cd ..

REM Install Python dependencies for AI service
echo Installing Python dependencies...
cd ai-service
python -m pip install -r requirements.txt
cd ..

REM Install frontend dependencies
echo Installing frontend dependencies...
call npm install -g pnpm
call pnpm install

echo Setup complete!
echo.
echo To start the development environment:
echo 1. Update backend\.env with your database and other configuration
echo 2. Run: docker-compose up postgres (to start just the database)
echo 3. Run the backend: cd backend ^&^& go run cmd/server/main.go
echo 4. Run the AI service: cd ai-service ^&^& python main.py
echo 5. Run the frontend: pnpm dev
echo.
echo Or run everything with Docker:
echo docker-compose up