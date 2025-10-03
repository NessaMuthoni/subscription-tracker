package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	Name         *string   `json:"name" db:"name"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type Category struct {
	ID   uuid.UUID `json:"id" db:"id"`
	Name string    `json:"name" db:"name"`
}

type Subscription struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	UserID      uuid.UUID  `json:"user_id" db:"user_id"`
	Name        string     `json:"name" db:"name"`
	Price       float64    `json:"price" db:"price"`
	BillingDate time.Time  `json:"billing_date" db:"billing_date"`
	CategoryID  *uuid.UUID `json:"category_id" db:"category_id"`
	Status      string     `json:"status" db:"status"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	Category    *Category  `json:"category,omitempty"`
}

type PaymentMethod struct {
	ID        uuid.UUID `json:"id" db:"id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	Type      string    `json:"type" db:"type"`
	Last4     *string   `json:"last4" db:"last4"`
	Brand     *string   `json:"brand" db:"brand"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Notification struct {
	ID        uuid.UUID `json:"id" db:"id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	Message   string    `json:"message" db:"message"`
	Read      bool      `json:"read" db:"read"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type Budget struct {
	ID        uuid.UUID `json:"id" db:"id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	Amount    float64   `json:"amount" db:"amount"`
	Period    string    `json:"period" db:"period"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type AnalyticsResult struct {
	ID        uuid.UUID   `json:"id" db:"id"`
	UserID    uuid.UUID   `json:"user_id" db:"user_id"`
	Type      string      `json:"type" db:"type"`
	Data      interface{} `json:"data" db:"data"`
	CreatedAt time.Time   `json:"created_at" db:"created_at"`
}

// Request/Response DTOs
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type SignupRequest struct {
	Email    string  `json:"email" binding:"required,email"`
	Password string  `json:"password" binding:"required,min=6"`
	Name     *string `json:"name"`
}

type UpdateUserRequest struct {
	Name  *string `json:"name"`
	Email *string `json:"email"`
}

type CreateSubscriptionRequest struct {
	Name        string     `json:"name" binding:"required"`
	Price       float64    `json:"price" binding:"required"`
	BillingDate time.Time  `json:"billing_date" binding:"required"`
	CategoryID  *uuid.UUID `json:"category_id"`
	Status      string     `json:"status" binding:"required"`
}

type UpdateSubscriptionRequest struct {
	Name        *string    `json:"name"`
	Price       *float64   `json:"price"`
	BillingDate *time.Time `json:"billing_date"`
	CategoryID  *uuid.UUID `json:"category_id"`
	Status      *string    `json:"status"`
}

type CreatePaymentMethodRequest struct {
	Type  string  `json:"type" binding:"required"`
	Last4 *string `json:"last4"`
	Brand *string `json:"brand"`
}

type CreateBudgetRequest struct {
	Amount float64 `json:"amount" binding:"required"`
	Period string  `json:"period" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}