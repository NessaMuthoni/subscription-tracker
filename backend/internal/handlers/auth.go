package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"

	"subscription-tracker/internal/auth"
	"subscription-tracker/internal/database"
	"subscription-tracker/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type GoogleUserInfo struct {
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

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
	type GoogleAuthRequest struct {
		Code string `json:"code" binding:"required"`
	}

	var req GoogleAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Missing or invalid authorization code: " + err.Error()})
		return
	}

	// Log the request for debugging
	fmt.Printf("Google OAuth request received with code: %s...\n", req.Code[:min(10, len(req.Code))])

	// Exchange code for user info
	userInfo, err := h.exchangeGoogleCode(req.Code)
	if err != nil {
		fmt.Printf("Google OAuth error: %v\n", err)
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Failed to authenticate with Google: " + err.Error()})
		return
	}

	fmt.Printf("Google user info received: email=%s, name=%s\n", userInfo.Email, userInfo.Name)

	// Check if user exists
	var user models.User
	err = h.db.QueryRow(
		"SELECT id, email, name, created_at FROM users WHERE email = $1",
		userInfo.Email,
	).Scan(&user.ID, &user.Email, &user.Name, &user.CreatedAt)

	if err == sql.ErrNoRows {
		// User doesn't exist, create new user
		fmt.Printf("Creating new user for: %s\n", userInfo.Email)
		userID := uuid.New()
		_, err = h.db.Exec(
			"INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)",
			userID, userInfo.Email, "google-oauth-user", userInfo.Name,
		)
		if err != nil {
			fmt.Printf("Failed to create user: %v\n", err)
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to create user"})
			return
		}

		// Get created user
		err = h.db.QueryRow(
			"SELECT id, email, name, created_at FROM users WHERE id = $1",
			userID,
		).Scan(&user.ID, &user.Email, &user.Name, &user.CreatedAt)
		if err != nil {
			fmt.Printf("Failed to retrieve user: %v\n", err)
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to retrieve user"})
			return
		}
		fmt.Printf("User created successfully: %s\n", user.ID)
	} else if err != nil {
		fmt.Printf("Database error: %v\n", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database error"})
		return
	} else {
		fmt.Printf("Existing user found: %s\n", user.ID)
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Email, h.jwtSecret)
	if err != nil {
		fmt.Printf("Failed to generate token: %v\n", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to generate token"})
		return
	}

	fmt.Printf("Google OAuth successful for user: %s\n", user.Email)
	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User:  user,
	})
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (h *AuthHandler) exchangeGoogleCode(code string) (*GoogleUserInfo, error) {
	// Get Google OAuth credentials from environment
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	redirectURI := "http://localhost:3000/auth/google/callback"

	if clientID == "" || clientSecret == "" {
		return nil, fmt.Errorf("google OAuth credentials not configured")
	}

	// Exchange authorization code for access token
	tokenURL := "https://oauth2.googleapis.com/token"
	data := url.Values{}
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("code", code)
	data.Set("grant_type", "authorization_code")
	data.Set("redirect_uri", redirectURI)

	resp, err := http.Post(tokenURL, "application/x-www-form-urlencoded", strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code for token: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("token exchange failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse token response
	var tokenResponse struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResponse); err != nil {
		return nil, fmt.Errorf("failed to decode token response: %v", err)
	}

	// Get user info from Google
	userInfoURL := "https://www.googleapis.com/oauth2/v2/userinfo"
	req, err := http.NewRequest("GET", userInfoURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create user info request: %v", err)
	}
	req.Header.Set("Authorization", "Bearer "+tokenResponse.AccessToken)

	userResp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %v", err)
	}
	defer userResp.Body.Close()

	if userResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(userResp.Body)
		return nil, fmt.Errorf("user info request failed with status %d: %s", userResp.StatusCode, string(body))
	}

	// Parse user info
	var userInfo GoogleUserInfo
	if err := json.NewDecoder(userResp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %v", err)
	}

	return &userInfo, nil
}
