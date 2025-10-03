package handlers

import (
	"database/sql"
	"net/http"

	"subscription-tracker/internal/auth"
	"subscription-tracker/internal/database"
	"subscription-tracker/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	db        *database.DB
	jwtSecret string
}

func NewAuthHandler(db *database.DB, jwtSecret string) *AuthHandler {
	return &AuthHandler{
		db:        db,
		jwtSecret: jwtSecret,
	}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	var user models.User
	err := h.db.QueryRow(
		"SELECT id, email, password_hash, name, created_at FROM users WHERE email = $1",
		req.Email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Invalid email or password"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database error"})
		return
	}

	if !auth.CheckPasswordHash(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Invalid email or password"})
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Email, h.jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to generate token"})
		return
	}

	// Clear password hash before sending response
	user.PasswordHash = ""

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User:  user,
	})
}

func (h *AuthHandler) Signup(c *gin.Context) {
	var req models.SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Check if user already exists
	var exists bool
	err := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database error"})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, models.ErrorResponse{Error: "User already exists"})
		return
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to hash password"})
		return
	}

	// Create user
	userID := uuid.New()
	_, err = h.db.Exec(
		"INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)",
		userID, req.Email, hashedPassword, req.Name,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to create user"})
		return
	}

	// Get created user
	var user models.User
	err = h.db.QueryRow(
		"SELECT id, email, name, created_at FROM users WHERE id = $1",
		userID,
	).Scan(&user.ID, &user.Email, &user.Name, &user.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to retrieve user"})
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Email, h.jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, models.AuthResponse{
		Token: token,
		User:  user,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// In a stateless JWT setup, logout is typically handled client-side
	// by removing the token from storage
	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Logged out successfully",
	})
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	type ForgotPasswordRequest struct {
		Email string `json:"email" binding:"required,email"`
	}

	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Check if user exists
	var exists bool
	err := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database error"})
		return
	}

	// Always return success to prevent email enumeration
	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "If an account with that email exists, a password reset link has been sent",
	})

	// TODO: Implement actual email sending logic here
	// This would typically involve:
	// 1. Generate a secure reset token
	// 2. Store it in database with expiration
	// 3. Send email with reset link
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	type ResetPasswordRequest struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// TODO: Implement password reset logic
	// This would typically involve:
	// 1. Validate the reset token
	// 2. Check if it's not expired
	// 3. Update user's password
	// 4. Invalidate the reset token

	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Password reset successfully",
	})
}

func (h *AuthHandler) GoogleAuth(c *gin.Context) {
	// TODO: Implement Google OAuth
	// This would typically involve:
	// 1. Validate Google token
	// 2. Extract user info from Google
	// 3. Create or login user
	// 4. Return JWT token

	c.JSON(http.StatusNotImplemented, models.ErrorResponse{
		Error: "Google OAuth not implemented yet",
	})
}