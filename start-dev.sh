#!/bin/bash

echo "🚀 Starting Subscription Tracker Development Environment..."

# Kill any existing processes on our ports
echo "📋 Stopping any existing services on ports 3000, 8080, 8000, 5432..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true  
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Start PostgreSQL
echo "🐘 Starting PostgreSQL database..."
docker-compose -f docker-compose-new.yml up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 15

# Check database health
until docker exec subscription_tracker_db pg_isready -U postgres -d subscription_tracker; do
  echo "⏳ Waiting for database connection..."
  sleep 2
done

echo "✅ Database is ready!"

# Start backend in background
echo "🔧 Starting Go backend..."
cd backend
go run cmd/server/main.go &
BACKEND_PID=$!
cd ..

# Start AI service in background  
echo "🤖 Starting AI service..."
cd ai-service
python main.py &
AI_PID=$!
cd ..

# Start frontend in background
echo "⚛️  Starting Next.js frontend..."
cd Frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📍 Service URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8080"
echo "   AI Service: http://localhost:8000"
echo "   Database: localhost:5432"
echo ""
echo "📊 Health Checks:"
echo "   Backend Health: http://localhost:8080/health"
echo "   AI Health: http://localhost:8000/health"
echo ""
echo "🔑 To stop all services, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID $AI_PID $FRONTEND_PID 2>/dev/null || true
    docker-compose -f docker-compose-new.yml down
    echo "✅ All services stopped"
    exit
}

# Trap ctrl-c and call cleanup
trap cleanup INT

# Wait for all background processes
wait