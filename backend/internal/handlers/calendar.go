package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"

	"subscription-tracker/internal/database"
	"subscription-tracker/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CalendarHandler struct {
	db *database.DB
}

func NewCalendarHandler(db *database.DB) *CalendarHandler {
	return &CalendarHandler{db: db}
}

type GoogleTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// GoogleAuthURL generates the Google OAuth URL
func (h *CalendarHandler) GoogleAuthURL(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	redirectURI := os.Getenv("GOOGLE_REDIRECT_URI")
	
	if clientID == "" || clientID == "your-google-client-id" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Google OAuth not configured. Please set up Google Calendar API credentials.",
		})
		return
	}

	if redirectURI == "" {
		redirectURI = "http://localhost:3000/api/auth/google/callback"
	}

	// Build OAuth URL
	authURL := fmt.Sprintf(
		"https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&access_type=offline&state=%s&prompt=consent",
		url.QueryEscape(clientID),
		url.QueryEscape(redirectURI),
		url.QueryEscape("https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events"),
		url.QueryEscape(userID.(uuid.UUID).String()),
	)

	c.JSON(http.StatusOK, gin.H{
		"authUrl": authURL,
	})
}

// GoogleCallback handles the OAuth callback
func (h *CalendarHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state") // This is the userID

	if code == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Missing authorization code"})
		return
	}

	userID, err := uuid.Parse(state)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid state parameter"})
		return
	}

	// Exchange code for tokens
	tokens, err := h.exchangeCodeForTokens(code)
	if err != nil {
		fmt.Printf("Failed to exchange code for tokens: %v\n", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to exchange authorization code for tokens",
		})
		return
	}

	// Save tokens to database
	err = h.saveGoogleTokens(userID, tokens)
	if err != nil {
		fmt.Printf("Failed to save tokens: %v\n", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to save Google Calendar tokens",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Google Calendar connected successfully",
	})
}

func (h *CalendarHandler) exchangeCodeForTokens(code string) (*GoogleTokenResponse, error) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	redirectURI := os.Getenv("GOOGLE_REDIRECT_URI")

	if redirectURI == "" {
		redirectURI = "http://localhost:3000/api/auth/google/callback"
	}

	// Prepare token request
	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("redirect_uri", redirectURI)
	data.Set("grant_type", "authorization_code")

	// Make token request
	resp, err := http.PostForm("https://oauth2.googleapis.com/token", data)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token exchange failed with status %d: %s", resp.StatusCode, string(body))
	}

	var tokens GoogleTokenResponse
	if err := json.Unmarshal(body, &tokens); err != nil {
		return nil, fmt.Errorf("failed to parse tokens: %w", err)
	}

	return &tokens, nil
}

func (h *CalendarHandler) saveGoogleTokens(userID uuid.UUID, tokens *GoogleTokenResponse) error {
	expiry := time.Now().Add(time.Duration(tokens.ExpiresIn) * time.Second)

	_, err := h.db.Exec(
		`UPDATE users 
		 SET google_access_token = $1, 
		     google_refresh_token = $2, 
		     google_token_expiry = $3,
			 preferences = COALESCE(preferences, '{}'::jsonb) || '{"calendar": {"googleSync": true}}'::jsonb
		 WHERE id = $4`,
		tokens.AccessToken,
		tokens.RefreshToken,
		expiry,
		userID,
	)

	return err
}

// RefreshGoogleToken refreshes an expired access token
func (h *CalendarHandler) refreshGoogleToken(userID uuid.UUID, refreshToken string) (*GoogleTokenResponse, error) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")

	data := url.Values{}
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("refresh_token", refreshToken)
	data.Set("grant_type", "refresh_token")

	resp, err := http.PostForm("https://oauth2.googleapis.com/token", data)
	if err != nil {
		return nil, fmt.Errorf("failed to refresh token: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token refresh failed with status %d: %s", resp.StatusCode, string(body))
	}

	var tokens GoogleTokenResponse
	if err := json.Unmarshal(body, &tokens); err != nil {
		return nil, fmt.Errorf("failed to parse tokens: %w", err)
	}

	// Save new tokens
	expiry := time.Now().Add(time.Duration(tokens.ExpiresIn) * time.Second)
	_, err = h.db.Exec(
		`UPDATE users 
		 SET google_access_token = $1, 
		     google_token_expiry = $2
		 WHERE id = $3`,
		tokens.AccessToken,
		expiry,
		userID,
	)

	return &tokens, err
}

// GetValidGoogleToken retrieves and refreshes if necessary the user's Google access token
func (h *CalendarHandler) getValidGoogleToken(userID uuid.UUID) (string, error) {
	var accessToken, refreshToken *string
	var expiry *time.Time

	err := h.db.QueryRow(
		`SELECT google_access_token, google_refresh_token, google_token_expiry 
		 FROM users WHERE id = $1`,
		userID,
	).Scan(&accessToken, &refreshToken, &expiry)

	if err != nil {
		return "", fmt.Errorf("failed to get tokens: %w", err)
	}

	if accessToken == nil || refreshToken == nil {
		return "", fmt.Errorf("user has not connected Google Calendar")
	}

	// Check if token is expired or about to expire (within 5 minutes)
	if expiry == nil || time.Now().Add(5*time.Minute).After(*expiry) {
		// Refresh the token
		tokens, err := h.refreshGoogleToken(userID, *refreshToken)
		if err != nil {
			return "", fmt.Errorf("failed to refresh token: %w", err)
		}
		return tokens.AccessToken, nil
	}

	return *accessToken, nil
}

// CreateCalendarEvent creates a calendar event for a subscription
func (h *CalendarHandler) CreateCalendarEvent(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	var req struct {
		SubscriptionName string    `json:"subscription_name" binding:"required"`
		Amount           float64   `json:"amount" binding:"required"`
		BillingDate      time.Time `json:"billing_date" binding:"required"`
		Description      string    `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Get valid access token
	accessToken, err := h.getValidGoogleToken(userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Google Calendar not connected. Please connect in Settings.",
		})
		return
	}

	// Create calendar event
	eventID, err := h.createGoogleCalendarEvent(accessToken, req.SubscriptionName, req.Amount, req.BillingDate, req.Description)
	if err != nil {
		fmt.Printf("Failed to create calendar event: %v\n", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to create calendar event: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"eventId": eventID,
		"message": "Calendar event created successfully",
	})
}

func (h *CalendarHandler) createGoogleCalendarEvent(accessToken, name string, amount float64, billingDate time.Time, description string) (string, error) {
	// Prepare event data
	event := map[string]interface{}{
		"summary":     fmt.Sprintf("%s Payment Due", name),
		"description": fmt.Sprintf("Subscription payment of KSh %.2f is due.\n\n%s", amount, description),
		"start": map[string]string{
			"dateTime": billingDate.Format(time.RFC3339),
			"timeZone": "Africa/Nairobi",
		},
		"end": map[string]string{
			"dateTime": billingDate.Add(1 * time.Hour).Format(time.RFC3339),
			"timeZone": "Africa/Nairobi",
		},
		"reminders": map[string]interface{}{
			"useDefault": false,
			"overrides": []map[string]interface{}{
				{"method": "email", "minutes": 1440}, // 1 day before
				{"method": "popup", "minutes": 60},   // 1 hour before
			},
		},
	}

	eventJSON, err := json.Marshal(event)
	if err != nil {
		return "", fmt.Errorf("failed to marshal event: %w", err)
	}

	// Make API request
	req, err := http.NewRequest(
		"POST",
		"https://www.googleapis.com/calendar/v3/calendars/primary/events",
		bytes.NewBuffer(eventJSON),
	)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to create event: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	eventID, ok := result["id"].(string)
	if !ok {
		return "", fmt.Errorf("event ID not found in response")
	}

	return eventID, nil
}

// DisconnectGoogleCalendar removes Google Calendar integration
func (h *CalendarHandler) DisconnectGoogleCalendar(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	_, err := h.db.Exec(
		`UPDATE users 
		 SET google_access_token = NULL, 
		     google_refresh_token = NULL, 
		     google_token_expiry = NULL,
			 preferences = COALESCE(preferences, '{}'::jsonb) || '{"calendar": {"googleSync": false}}'::jsonb
		 WHERE id = $1`,
		userID.(uuid.UUID),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to disconnect Google Calendar",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Google Calendar disconnected successfully",
	})
}

type CalendarEvent struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Date        time.Time `json:"date"`
	Type        string    `json:"type"`
	Amount      float64   `json:"amount"`
	Description string    `json:"description"`
}

func (h *CalendarHandler) GetEvents(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	// Get subscription billing dates as calendar events
	rows, err := h.db.Query(`
		SELECT id, name, billing_date, price 
		FROM subscriptions 
		WHERE user_id = $1 AND status = 'active'
		ORDER BY billing_date ASC
	`, userID.(uuid.UUID))

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database error"})
		return
	}
	defer rows.Close()

	var events []CalendarEvent
	for rows.Next() {
		var id uuid.UUID
		var name string
		var billingDate time.Time
		var price float64

		err := rows.Scan(&id, &name, &billingDate, &price)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to scan event"})
			return
		}

		event := CalendarEvent{
			ID:          id,
			Title:       name + " Payment",
			Date:        billingDate,
			Type:        "subscription",
			Amount:      price,
			Description: "Subscription payment for " + name,
		}

		events = append(events, event)
	}

	c.JSON(http.StatusOK, events)
}