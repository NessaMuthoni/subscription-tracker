@echo off
echo ========================================
echo  Subscription Tracker - Service Status
echo ========================================
echo.

docker-compose ps

echo.
echo ========================================
echo  Service URLs:
echo ========================================
echo  Frontend:   http://localhost:3000
echo  Backend:    http://localhost:8080/api
echo  AI Service: http://localhost:8000/docs
echo  Database:   localhost:5432
echo.
echo ========================================
echo  Logs (press Ctrl+C to stop):
echo ========================================
echo.

docker-compose logs -f --tail=50
