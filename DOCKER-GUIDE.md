# Docker Quick Start Guide

## Prerequisites
- ✅ Docker Desktop installed and running
- ✅ `.env` file configured (copy from `.env.example`)

## Start All Services

**Windows:**
```powershell
.\start-docker.bat
```

**Linux/Mac:**
```bash
docker-compose up --build
```

This will start:
- 🐘 **PostgreSQL** on `localhost:5432`
- 🔧 **Backend API** on `http://localhost:8080`
- 🤖 **AI Service** on `http://localhost:8000`
- 🌐 **Frontend** on `http://localhost:3000`

## Stop All Services

**Windows:**
```powershell
.\stop-docker.bat
```

**Linux/Mac:**
```bash
docker-compose down
```

## View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ai-service
docker-compose logs -f postgres
```

## Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

## Access Services

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080/api
- **AI Service:** http://localhost:8000/docs (API docs)
- **Database:** `localhost:5432` (use psql or pgAdmin)

## Database Access

**Using psql:**
```powershell
docker exec -it subscription_tracker_db psql -U postgres -d subscription_tracker
```

**Connection String:**
```
postgresql://postgres:password123@localhost:5432/subscription_tracker
```

## Troubleshooting

### Port Already in Use
If you get "port already allocated" errors:

```powershell
# Find process using port 3000 (Frontend)
netstat -ano | findstr :3000

# Find process using port 8080 (Backend)
netstat -ano | findstr :8080

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Database Won't Start
```bash
# Remove old data and restart
docker-compose down -v
docker-compose up --build
```

### Services Can't Connect
Make sure all services are on the same network:
```bash
docker network ls
docker network inspect subscription_tracker_network
```

### Fresh Start
Complete reset:
```powershell
# Stop everything
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose up --build
```

## Development Workflow

### Make Code Changes

1. **Backend (Go):** Edit files in `backend/`, Docker will auto-rebuild on restart
2. **Frontend (Next.js):** Edit files in `Frontend/`, changes auto-reload (hot reload)
3. **AI Service (Python):** Edit `ai-service/main.py`, restart service

### Apply Database Migrations

```bash
# Connect to database
docker exec -it subscription_tracker_db psql -U postgres -d subscription_tracker

# Run migration file
docker exec -i subscription_tracker_db psql -U postgres -d subscription_tracker < backend/migrations/001_init.sql
```

### View Service Status

```bash
docker-compose ps
```

Expected output:
```
NAME                            STATUS
subscription_tracker_ai         Up
subscription_tracker_backend    Up
subscription_tracker_db         Up (healthy)
subscription_tracker_frontend   Up
```

## Environment Variables

All services read from the root `.env` file. Key variables:

- `DATABASE_URL` - Database connection (uses `postgres` as hostname)
- `AI_SERVICE_URL` - Should be `http://ai-service:8000` (Docker network)
- `NEXT_PUBLIC_API_URL` - Frontend API URL `http://localhost:8080/api`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `MPESA_*` - M-Pesa Daraja API credentials

## Performance Tips

### Speed Up Builds
```bash
# Build with cache
docker-compose build

# Build specific service
docker-compose build backend
```

### Reduce Resource Usage
Edit `docker-compose.yml` to limit resources:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

## Production Deployment

For production:
1. ✅ Change all `localhost` to actual domain names
2. ✅ Use production database (not Docker)
3. ✅ Set `JWT_SECRET` to secure random value
4. ✅ Enable SSL/TLS
5. ✅ Use environment-specific .env files
6. ✅ Set `MPESA_ENVIRONMENT=production`
7. ✅ Configure proper CORS origins

## Useful Commands

```bash
# Remove stopped containers
docker-compose rm

# View resource usage
docker stats

# Clean up unused Docker resources
docker system prune -a

# Export database
docker exec subscription_tracker_db pg_dump -U postgres subscription_tracker > backup.sql

# Import database
docker exec -i subscription_tracker_db psql -U postgres subscription_tracker < backup.sql
```

## Next Steps

1. ✅ Start services: `.\start-docker.bat`
2. ✅ Open browser: http://localhost:3000
3. ✅ Create account or login
4. ✅ Test Google Calendar OAuth
5. ✅ Add M-Pesa payment method
6. ✅ Create subscriptions

## Need Help?

- Check logs: `docker-compose logs -f`
- Restart service: `docker-compose restart <service-name>`
- Full reset: `docker-compose down -v && docker-compose up --build`
- View README.md for API documentation
