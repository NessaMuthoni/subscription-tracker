# Copilot Instructions for Subscription Tracker

## Architecture Overview

**Stack**: Next.js (Frontend) → Go/Gin (Backend REST API) + Python/FastAPI (AI Service) → PostgreSQL

This is a microservices architecture with clear separation of concerns:
- **Frontend** ([Frontend/](Frontend/)): Next.js 14 + TypeScript, Tailwind CSS, Shadcn/ui components, React Query for data fetching
- **Backend** ([backend/](backend/)): Go REST API using Gin framework, handles auth, subscriptions, payments, analytics
- **AI Service** ([ai-service/](ai-service/)): Python FastAPI for ML features (spending predictions, budget recommendations)
- **Database**: PostgreSQL with UUID primary keys, migrations in [backend/migrations/](backend/migrations/)

## Critical Developer Workflows

### Development Setup
- **Windows**: Run `setup-dev.bat` and `start-dev.bat`
- **Linux/Mac**: Run `setup-dev.sh` and `start-dev.sh`
- **Docker**: Run `start-docker.bat` / `docker-compose up --build`
  - Services: Frontend (3000), Backend (8080), AI (8000), DB (5432)

### Testing Endpoints
- Backend health: `GET /health` (port 8080)
- AI docs: `GET /docs` (port 8000 - FastAPI auto-docs)
- Frontend: http://localhost:3000

### Environment & Database
- Database connection: PostgreSQL via `DATABASE_URL` env var
- Migrations run automatically on backend startup
- DB schema uses UUID primary keys; check [backend/internal/models/models.go](backend/internal/models/models.go) for User, Subscription, etc. structures

## Backend Patterns (Go)

### Handler Pattern
Handlers are structured with dependency injection. Example in [backend/internal/handlers/auth.go](backend/internal/handlers/auth.go):
```go
type AuthHandler struct {
  db        *database.DB
  jwtSecret string
}
func NewAuthHandler(db *database.DB, jwtSecret string) *AuthHandler { ... }
func (h *AuthHandler) Login(c *gin.Context) { ... }
```
All handlers: Create struct with dependencies → NewXHandler factory → Receiver methods for endpoints

### Auth & Middleware
- JWT-based auth with Bearer token in Authorization header
- [AuthMiddleware](backend/internal/middleware/middleware.go) validates tokens and extracts userID/email
- Protected routes use `r.Use(middleware.AuthMiddleware(cfg.JWTSecret))` before handler group
- Password hashing via `crypto.bcrypt`; always clear `PasswordHash` before sending user responses

### Database Queries
- Use `db.QueryRow()` for single results, `db.Query()` for multiple rows
- Always check for `sql.ErrNoRows` when expecting a single row
- Connection: [database/database.go](backend/internal/database/database.go) handles PostgreSQL connection pooling

### Error Responses
Consistent error format: `models.ErrorResponse{Error: "message"}` as JSON with appropriate HTTP status codes

## Frontend Patterns (Next.js)

### API Client Layer
[lib/api-client.ts](Frontend/lib/api-client.ts) provides centralized Axios instance with:
- Auto-injected Bearer token from localStorage
- 401 handling redirects to login
- Base URL from `NEXT_PUBLIC_API_URL` env

Usage: `const response = await apiClient.get('/subscriptions')`

### State Management & Data Fetching
- React Query (@tanstack/react-query) for server state in components
- localStorage for auth_token (set on login, cleared on 401)
- useToast() hook for notifications

### Auth Flow
- Protected routes via [ProtectedRoute](Frontend/components/protected-route.tsx) wrapper
- Auth state in [AuthProvider](Frontend/components/auth-provider.tsx) context
- Login stores token in localStorage; logout clears it
- Google OAuth flows in [lib/google-auth*.ts](Frontend/lib/)

### UI Components
- Shadcn/ui components (buttons, dialogs, forms, tables)
- Form validation via react-hook-form + Zod schemas
- Tailwind CSS for styling; globals.css in [app/](Frontend/app/)

## AI Service Patterns (Python)

### Request/Response Models
All endpoints use Pydantic models (see [ai-service/main.py](ai-service/main.py)):
- Input: `PredictSpendingRequest`, `BudgetRecommendationRequest`, `ReminderSuggestionsRequest`
- Output: Models with `predictions`, `total_predicted`, `confidence_score`, `insights` fields
- CORS enabled for all origins

### Key Endpoints
- `POST /ai/predict-spending` - Returns 3+ month predictions with confidence scores
- `POST /ai/budget-recommendation` - Suggests monthly budgets based on subscriptions/income
- `POST /ai/reminder-suggestions` - Smart reminder timing recommendations

## Integration Points & Communication

### Backend ↔ Frontend
- Frontend calls Go backend REST API at `http://localhost:8080/api` (configured in env)
- Auth token passed in Authorization header: `Bearer <jwt>`
- Errors: Check response status + error message in response body

### Backend ↔ AI Service
- Backend calls AI service (internal Docker network or localhost:8000)
- Endpoint format: `http://localhost:8000/ai/<operation>` (e.g., predict-spending)
- Request body contains subscription list + parameters; response has predictions + insights

### Database Migrations
- New migrations: Add SQL file in [backend/migrations/](backend/migrations/) with sequential naming (001_, 002_, etc.)
- Migrations run automatically on backend startup
- Rollback: Manually execute UNDO statements in psql

## Key Files to Know

| File | Purpose |
|------|---------|
| [backend/cmd/server/main.go](backend/cmd/server/main.go) | Server initialization, route setup |
| [backend/internal/config/config.go](backend/internal/config/config.go) | Env var loading |
| [backend/internal/models/models.go](backend/internal/models/models.go) | All data structures (User, Subscription, etc.) |
| [Frontend/lib/api-client.ts](Frontend/lib/api-client.ts) | HTTP client configuration |
| [Frontend/components/auth-provider.tsx](Frontend/components/auth-provider.tsx) | Auth context & logic |
| [docker-compose.yml](docker-compose.yml) | Service definitions & networking |

## Project-Specific Conventions

1. **UUIDs**: All entities use UUID primary keys (uuid.NewString() in Go, uuid_generate_v4() in SQL)
2. **Timestamps**: Unix timestamps in responses; created_at/updated_at on all tables
3. **Categories**: Fixed categories table; subscriptions reference via category_id FK
4. **Status Field**: Subscriptions have "active"/"paused"/"cancelled" status strings
5. **Soft Deletes**: Not used; use status field for logical deletion
6. **Payment Methods**: Multiple payment methods per user (paystack, mpesa, credit card)
7. **Error Handling**: Always return ErrorResponse struct; never expose stack traces to client

## Common Tasks

- **Add new API endpoint**: Create handler method in [backend/internal/handlers/](backend/internal/handlers/), add route in main.go, protect with auth middleware if needed
- **Add new table**: Create migration in [backend/migrations/](backend/migrations/), add model in models.go
- **Connect frontend to new backend endpoint**: Use ApiClient in [lib/api-client.ts](Frontend/lib/api-client.ts), wrap in useQuery hook
- **Call AI service**: Backend constructs POST request to localhost:8000/ai/<endpoint> with subscription data
