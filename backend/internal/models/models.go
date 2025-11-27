package models

import (
	"time"

	"github.com/google/uuid"
)

type UserPreferences struct {
	Budget        *BudgetPreferences        `json:"budget,omitempty"`
	Notifications *NotificationPreferences  `json:"notifications,omitempty"`
	AI            *AIPreferences            `json:"ai,omitempty"`
	Calendar      *CalendarPreferences      `json:"calendar,omitempty"`
}

type BudgetPreferences struct {
	Monthly      float64 `json:"monthly"`
	Currency     string  `json:"currency"`
	CheckBalance bool    `json:"checkBalance"`
}

type NotificationPreferences struct {
	Email        bool `json:"email"`
	Push         bool `json:"push"`
	SMS          bool `json:"sms"`
	ReminderDays int  `json:"reminderDays"`
}

type AIPreferences struct {
	Categorization  bool `json:"categorization"`
	Predictions     bool `json:"predictions"`
	Recommendations bool `json:"recommendations"`
}

type CalendarPreferences struct {
	GoogleSync bool `json:"googleSync"`
}

type User struct {
	ID                 uuid.UUID        `json:"id" db:"id"`
	Email              string           `json:"email" db:"email"`
	PasswordHash       string           `json:"-" db:"password_hash"`
	Name               *string          `json:"name" db:"name"`
	Preferences        *UserPreferences `json:"preferences,omitempty" db:"preferences"`
	GoogleAccessToken  *string          `json:"-" db:"google_access_token"`
	GoogleRefreshToken *string          `json:"-" db:"google_refresh_token"`
	GoogleTokenExpiry  *time.Time       `json:"-" db:"google_token_expiry"`
	CreatedAt          time.Time        `json:"created_at" db:"created_at"`
}

type Category struct {
	ID   uuid.UUID `json:"id" db:"id"`
	Name string    `json:"name" db:"name"`
}

type Subscription struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	UserID        uuid.UUID  `json:"user_id" db:"user_id"`
	Name          string     `json:"name" db:"name"`
	Price         float64    `json:"price" db:"price"`
	BillingCycle  string     `json:"billing_cycle" db:"billing_cycle"`
	BillingDate   time.Time  `json:"billing_date" db:"billing_date"`
	CategoryID    *uuid.UUID `json:"category_id" db:"category_id"`
	Status        string     `json:"status" db:"status"`
	PaymentMethod *string    `json:"payment_method" db:"payment_method"`
	Description   *string    `json:"description" db:"description"`
	WebsiteURL    *string    `json:"website_url" db:"website_url"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
	Category      *Category  `json:"category,omitempty"`
}

type PaymentMethod struct {
	ID               uuid.UUID  `json:"id" db:"id"`
	UserID           uuid.UUID  `json:"user_id" db:"user_id"`
	Type             string     `json:"type" db:"type"` // credit_card, debit_card, mpesa, paypal, paystack, bank_transfer
	Last4            *string    `json:"last4" db:"last4"`
	Brand            *string    `json:"brand" db:"brand"`
	PhoneNumber      *string    `json:"phone_number,omitempty" db:"phone_number"`       // For M-Pesa
	AccountEmail     *string    `json:"account_email,omitempty" db:"account_email"`     // For PayPal/Paystack
	APIKeyEncrypted  *string    `json:"-" db:"api_key_encrypted"`                       // For Paystack (never exposed)
	LastBalanceCheck *time.Time `json:"last_balance_check,omitempty" db:"last_balance_check"`
	BalanceCents     *int64     `json:"balance_cents,omitempty" db:"balance_cents"`
	Currency         *string    `json:"currency,omitempty" db:"currency"`
	IsDefault        bool       `json:"is_default" db:"is_default"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
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
	Name        *string          `json:"name"`
	Email       *string          `json:"email"`
	Preferences *UserPreferences `json:"preferences"`
}

type CreateSubscriptionRequest struct {
	Name          string     `json:"name" binding:"required"`
	Price         float64    `json:"price" binding:"required"`
	BillingCycle  string     `json:"billing_cycle" binding:"required"`
	BillingDate   time.Time  `json:"billing_date" binding:"required"`
	CategoryID    *uuid.UUID `json:"category_id"`
	Category      *string    `json:"category"` // Category name (will be converted to ID)
	Status        string     `json:"status" binding:"required"`
	PaymentMethod *string    `json:"payment_method"`
	Description   *string    `json:"description"`
	WebsiteURL    *string    `json:"website_url"`
}

type UpdateSubscriptionRequest struct {
	Name          *string    `json:"name"`
	Price         *float64   `json:"price"`
	BillingCycle  *string    `json:"billing_cycle"`
	BillingDate   *time.Time `json:"billing_date"`
	CategoryID    *uuid.UUID `json:"category_id"`
	Category      *string    `json:"category"` // Category name (will be converted to ID)
	Status        *string    `json:"status"`
	PaymentMethod *string    `json:"payment_method"`
	Description   *string    `json:"description"`
	WebsiteURL    *string    `json:"website_url"`
}

type CreatePaymentMethodRequest struct {
	Type         string  `json:"type" binding:"required"` // credit_card, debit_card, mpesa, paypal, paystack, bank_transfer
	Last4        *string `json:"last4"`                   // For cards
	Brand        *string `json:"brand"`                   // For cards
	PhoneNumber  *string `json:"phone_number"`            // For M-Pesa (format: +254XXXXXXXXX)
	AccountEmail *string `json:"account_email"`           // For PayPal/Paystack
	APIKey       *string `json:"api_key"`                 // For Paystack (will be encrypted)
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
