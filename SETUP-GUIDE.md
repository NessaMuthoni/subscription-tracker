# 🎯 Complete Step-by-Step Setup Guide

## ✅ **STEP-BY-STEP CHECKLIST**

### **Phase 1: Prerequisites (5 minutes)**

#### **Step 1: Verify Required Software**
Open PowerShell and run these commands:
```powershell
# Check if all required software is installed
node --version     # Should show v18+ 
go version        # Should show go1.19+
python --version  # Should show Python 3.9+
docker --version  # Should show Docker version
```

**If any are missing, install:**
- **Node.js**: https://nodejs.org/ (Download LTS version)
- **Go**: https://golang.org/dl/ (Download latest)
- **Python**: https://python.org/downloads/ (Download 3.9+)
- **Docker Desktop**: https://docker.com/products/docker-desktop/

---

### **Phase 2: Project Setup (10 minutes)**

#### **Step 2: Navigate to Project Directory**
```powershell
cd c:\Users\JOAN\Downloads\subscription-tracker
```

#### **Step 3: Set Up Backend Environment**
```powershell
# Copy environment file
cd backend
copy .env.example .env

# Install Go dependencies
go mod tidy
go mod download

# Go back to root
cd ..
```

#### **Step 4: Configure Backend Environment**
Open `backend\.env` in your code editor and update:
```env
DATABASE_URL=postgres://postgres:password@localhost:5432/subscription_tracker?sslmode=disable
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-very-long-and-secure
PORT=8080
AI_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

#### **Step 5: Set Up AI Service**
```powershell
# Navigate to AI service
cd ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Deactivate and go back to root
deactivate
cd ..
```

#### **Step 6: Set Up Frontend**
```powershell
# Navigate to frontend
cd Frontend

# Install dependencies
npm install

# Create environment file
echo NEXT_PUBLIC_API_URL=http://localhost:8080/api > .env.local
echo NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000 >> .env.local

# Go back to root
cd ..
```

---

### **Phase 3: Database Setup (5 minutes)**

#### **Step 7: Start Database Container**
```powershell
# Start PostgreSQL database
docker-compose -f docker-compose-new.yml up -d postgres

# Wait for database to start (30 seconds)
Start-Sleep -Seconds 30

# Check if database is running
docker ps
```

**Expected output:** You should see `subscription_tracker_db` container running

#### **Step 8: Verify Database Connection**
```powershell
# Test database connection
docker exec subscription_tracker_db pg_isready -U postgres -d subscription_tracker
```

**Expected output:** `postgres:5432 - accepting connections`

---

### **Phase 4: Start All Services (2 minutes)**

#### **Step 9: Manual Service Start (Recommended for first time)**

**Terminal 1 - Backend:**
```powershell
cd backend
go run cmd/server/main.go
```
**Expected output:** `Server starting on port 8080`

**Terminal 2 - AI Service:**
```powershell
cd ai-service
venv\Scripts\activate
python main.py
```
**Expected output:** `Application startup complete`

**Terminal 3 - Frontend:**
```powershell  
cd Frontend
npm run dev
```
**Expected output:** `Ready - started server on 0.0.0.0:3000`

#### **Step 10: Automated Start (Alternative)**
```powershell
# Run the automated start script
.\start-dev.bat
```

---

### **Phase 5: Verification & Testing (5 minutes)**

#### **Step 11: Health Checks**
Open these URLs in your browser:

1. **Backend Health:** http://localhost:8080/health
   - **Expected:** `{"status":"ok"}`

2. **AI Service Health:** http://localhost:8000/health  
   - **Expected:** `{"status":"healthy","service":"ai-service"}`

3. **Frontend:** http://localhost:3000
   - **Expected:** Subscription tracker homepage loads

#### **Step 12: Test API Connection**
Open browser console on http://localhost:3000 and run:
```javascript
fetch('http://localhost:8080/health')
  .then(r => r.json())
  .then(console.log)
```
**Expected:** `{status: "ok"}`

#### **Step 13: Test User Registration**
1. Go to http://localhost:3000
2. Navigate to signup/login page
3. Try creating a test account
4. Verify you can login

---

### **Phase 6: Troubleshooting Common Issues**

#### **🔴 Issue: "Port already in use"**
**Solution:**
```powershell
# Kill processes on ports
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process -Force
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
```

#### **🔴 Issue: "Database connection failed"**
**Solution:**
```powershell
# Restart database
docker-compose -f docker-compose-new.yml down
docker-compose -f docker-compose-new.yml up -d postgres
Start-Sleep -Seconds 30
```

#### **🔴 Issue: "Go modules not found"**
**Solution:**
```powershell
cd backend
go mod tidy
go clean -modcache
go mod download
```

#### **🔴 Issue: "Python packages not found"**
**Solution:**
```powershell
cd ai-service
venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

#### **🔴 Issue: "CORS errors in browser"**
**Solution:** Check that `FRONTEND_URL=http://localhost:3000` is set in `backend\.env`

---

### **Phase 7: Development Workflow**

#### **Daily Development Startup:**
```powershell
# Quick start (run from project root)
.\start-dev.bat
```

#### **Stopping Services:**
- **Automated script:** Press any key when prompted
- **Manual:** Press `Ctrl+C` in each terminal window
- **Nuclear option:** 
  ```powershell
  docker-compose -f docker-compose-new.yml down
  ```

---

### **Phase 8: Verify Everything is Working**

#### **✅ Success Indicators:**

1. **🟢 Database:** Container `subscription_tracker_db` is running
2. **🟢 Backend:** http://localhost:8080/health returns `{"status":"ok"}`
3. **🟢 AI Service:** http://localhost:8000/health returns success
4. **🟢 Frontend:** http://localhost:3000 loads the application
5. **🟢 API Communication:** No CORS errors in browser console
6. **🟢 User Flow:** Can register/login users successfully

#### **🎯 Complete Success Test:**
1. Open http://localhost:3000
2. Register a new user account
3. Login with the account
4. Create a test subscription
5. View the dashboard with data

**If all steps work: 🎉 YOUR APPLICATION IS FULLY FUNCTIONAL!**

---

### **Quick Reference Commands:**

```powershell
# Start everything
.\start-dev.bat

# Start database only
docker-compose -f docker-compose-new.yml up -d postgres

# Check running containers
docker ps

# View backend logs
cd backend && go run cmd/server/main.go

# View AI service logs  
cd ai-service && venv\Scripts\activate && python main.py

# View frontend
cd Frontend && npm run dev

# Stop everything
docker-compose -f docker-compose-new.yml down
```

### **🆘 Need Help?**
If you encounter issues:
1. Check that all ports (3000, 8080, 8000, 5432) are available
2. Ensure Docker Desktop is running
3. Verify all environment files are configured correctly
4. Check that virtual environment is activated for Python
5. Make sure you're running commands from the correct directories

**Your application should now be running with full backend-frontend communication!** 🚀