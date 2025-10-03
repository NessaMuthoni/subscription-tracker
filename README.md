# Subscription Tracker

A full-stack subscription management application built with Next.js, Go, Python, and PostgreSQL.

## Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, and Shadcn/ui
- **Backend**: Go with Gin framework for REST APIs
- **AI Service**: Python with FastAPI for machine learning features
- **Database**: PostgreSQL with UUID primary keys
- **Authentication**: JWT-based auth with bcrypt password hashing

## Features

### Core Features
- ✅ User authentication (signup, login, logout)
- ✅ Subscription management (CRUD operations)
- ✅ Payment method management
- ✅ Budget tracking and analytics
- ✅ Calendar view of upcoming payments
- ✅ Notification system

### AI Features
- ✅ Spending prediction
- ✅ Budget recommendations
- ✅ Smart reminder suggestions
- ✅ Subscription optimization tips

## API Endpoints

### Authentication APIs (Go)
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/logout` - Logout (token/session)
- `POST /api/auth/google` - Google OAuth login/callback
- `POST /api/auth/forgot-password` - Send password reset email
- `POST /api/auth/reset-password` - Reset password

### User APIs (Go)
- `GET /api/user/me` - Get current user profile
- `PATCH /api/user/me` - Update user profile

### Subscription APIs (Go)
- `GET /api/subscriptions` - List user subscriptions
- `POST /api/subscriptions` - Add new subscription
- `GET /api/subscriptions/:id` - Get subscription details
- `PATCH /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

### Payment Method APIs (Go)
- `GET /api/payment-methods` - List payment methods
- `POST /api/payment-methods` - Add payment method
- `DELETE /api/payment-methods/:id` - Delete payment method

### Analytics APIs (Go)
- `GET /api/analytics/summary` - Get spending/budget analytics

### Notification APIs (Go)
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/:id` - Mark as read

### Budget APIs (Go)
- `GET /api/budget` - Get user budget
- `POST /api/budget` - Create/update budget

### Calendar APIs (Go)
- `GET /api/calendar/events` - Get calendar events

### AI APIs (Python)
- `POST /ai/predict-spending` - Predict future spending
- `POST /ai/budget-recommendation` - AI-driven budget suggestions
- `POST /ai/reminder-suggestions` - Smart reminders

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  billing_date DATE NOT NULL,
  category_id UUID REFERENCES categories(id),
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Additional tables for payment_methods, notifications, budgets, analytics_results
```

## Setup Instructions

### Prerequisites
- Docker and Docker Compose
- Go 1.21+ (for local development)
- Python 3.11+ (for local development)
- Node.js 18+ and pnpm (for local development)
- PostgreSQL (if running locally)

### Quick Start with Docker

1. Clone the repository
2. Copy environment files:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Update `backend/.env` with your configuration
4. Start all services:
   ```bash
   docker-compose up
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- AI Service: http://localhost:8000
- Database: localhost:5432

### Local Development Setup

#### Option 1: Automated Setup
```bash
# On Linux/macOS
chmod +x setup-dev.sh
./setup-dev.sh

# On Windows
setup-dev.bat
```

#### Option 2: Manual Setup

1. **Database Setup**
   ```bash
   docker-compose up postgres -d
   ```

2. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   # Update .env with your configuration
   go mod download
   go run cmd/server/main.go
   ```

3. **AI Service Setup**
   ```bash
   cd ai-service
   pip install -r requirements.txt
   python main.py
   ```

4. **Frontend Setup**
   ```bash
   npm install -g pnpm
   pnpm install
   pnpm dev
   ```

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgres://postgres:password@localhost:5432/subscription_tracker?sslmode=disable
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
PORT=8080
AI_SERVICE_URL=http://localhost:8000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Project Structure

```
subscription-tracker/
├── frontend/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   ├── lib/                 # Utility functions and API client
│   └── hooks/               # Custom React hooks
├── backend/
│   ├── cmd/server/          # Main application entry point
│   ├── internal/
│   │   ├── handlers/        # HTTP handlers
│   │   ├── models/          # Data models
│   │   ├── middleware/      # HTTP middleware
│   │   ├── database/        # Database connection
│   │   ├── auth/            # Authentication utilities
│   │   └── config/          # Configuration management
│   └── migrations/          # Database migrations
├── ai-service/
│   ├── main.py              # FastAPI application
│   └── requirements.txt     # Python dependencies
└── docker-compose.yml       # Docker services configuration
```

## Development

### Adding New Features

1. **Backend API**: Add handlers in `backend/internal/handlers/`
2. **Frontend**: Add components in `components/` and pages in `app/`
3. **AI Features**: Extend `ai-service/main.py`
4. **Database**: Add migrations in `backend/migrations/`

### Testing

```bash
# Backend tests
cd backend && go test ./...

# Frontend tests
pnpm test

# AI service tests
cd ai-service && python -m pytest
```

### Building for Production

```bash
# Build all services
docker-compose build

# Or build individually
docker build -t subscription-tracker-backend ./backend
docker build -t subscription-tracker-ai ./ai-service
docker build -t subscription-tracker-frontend .
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.