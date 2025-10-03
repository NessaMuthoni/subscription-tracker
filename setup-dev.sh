#!/bin/bash

# Development setup script

echo "Setting up Subscription Tracker development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file for backend if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "Please update backend/.env with your actual configuration values."
fi

# Install Go dependencies
echo "Installing Go dependencies..."
cd backend
go mod download
cd ..

# Install Python dependencies for AI service
echo "Installing Python dependencies..."
cd ai-service
python -m pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install -g pnpm
pnpm install

echo "Setup complete!"
echo ""
echo "To start the development environment:"
echo "1. Update backend/.env with your database and other configuration"
echo "2. Run: docker-compose up postgres (to start just the database)"
echo "3. Run the backend: cd backend && go run cmd/server/main.go"
echo "4. Run the AI service: cd ai-service && python main.py"
echo "5. Run the frontend: pnpm dev"
echo ""
echo "Or run everything with Docker:"
echo "docker-compose up"