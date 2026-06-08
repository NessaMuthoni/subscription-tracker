package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"

	"subscription-tracker/internal/database"
	"subscription-tracker/internal/models"
	"subscription-tracker/internal/notifications"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SubscriptionHandler struct {
	db                    *database.DB
	notificationGenerator *notifications.NotificationGenerator
}

func NewSubscriptionHandler(db *database.DB, notificationGenerator *notifications.NotificationGenerator) *SubscriptionHandler {
	return &SubscriptionHandler{
		db:                    db,
		notificationGenerator: notificationGenerator,
	}
}

func (h *SubscriptionHandler) GetSubscriptions(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	rows, err := h.db.Query(`
		SELECT s.id, s.user_id, s.name, s.price, s.billing_cycle, s.billing_date, s.category_id, s.status, 
		       s.description, s.website_url, s.cancellation_url, s.created_at, s.updated_at, s.payment_method,
		       c.id, c.name
		FROM subscriptions s
		LEFT JOIN categories c ON s.category_id = c.id
		WHERE s.user_id = $1
		ORDER BY s.created_at DESC
	`, userID.(uuid.UUID))

	if err != nil {
		println("Query error:", err.Error())
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database error: " + err.Error()})
		return
	}
	defer rows.Close()

	var subscriptions []models.Subscription
	for rows.Next() {
		var sub models.Subscription
		var categoryID, categoryName sql.NullString

		err := rows.Scan(
			&sub.ID, &sub.UserID, &sub.Name, &sub.Price, &sub.BillingCycle, &sub.BillingDate,
			&sub.CategoryID, &sub.Status, &sub.Description, &sub.WebsiteURL, &sub.CancellationURL,
			&sub.CreatedAt, &sub.UpdatedAt, &sub.PaymentMethod, &categoryID, &categoryName,
		)
		if err != nil {
			println("Scan error:", err.Error())
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to scan subscription: " + err.Error()})
			return
		}

		if categoryID.Valid {
			catUUID, _ := uuid.Parse(categoryID.String)
			sub.Category = &models.Category{
				ID:   catUUID,
				Name: categoryName.String,
			}
		}

		subscriptions = append(subscriptions, sub)
	}

	c.JSON(http.StatusOK, subscriptions)
}

func (h *SubscriptionHandler) CreateSubscription(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	var req models.CreateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Look up category ID by name if category name is provided
	var finalCategoryID *uuid.UUID
	if req.CategoryID != nil {
		finalCategoryID = req.CategoryID
	} else if req.Category != nil && *req.Category != "" {
		var catID uuid.UUID
		err := h.db.QueryRow("SELECT id FROM categories WHERE LOWER(name) = LOWER($1)", *req.Category).Scan(&catID)
		if err == nil {
			finalCategoryID = &catID
		} else {
			fmt.Printf("Warning: Category '%s' not found, using NULL\n", *req.Category)
		}
	}

	subscriptionID := uuid.New()
	now := time.Now()

	_, err := h.db.Exec(`
		INSERT INTO subscriptions (id, user_id, name, price, billing_cycle, billing_date, category_id, status, payment_method, description, website_url, cancellation_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`, subscriptionID, userID.(uuid.UUID), req.Name, req.Price, req.BillingCycle, req.BillingDate, finalCategoryID, req.Status, req.PaymentMethod, req.Description, req.WebsiteURL, req.CancellationURL, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to create subscription"})
		return
	}

	// Get created subscription with category
	var sub models.Subscription
	var categoryID, categoryName sql.NullString

	err = h.db.QueryRow(`
		SELECT s.id, s.user_id, s.name, s.price, s.billing_cycle, s.billing_date, s.category_id, s.status, 
		       s.description, s.website_url, s.cancellation_url, s.created_at, s.updated_at, s.payment_method,
		       c.id, c.name
		FROM subscriptions s
		LEFT JOIN categories c ON s.category_id = c.id
		WHERE s.id = $1
	`, subscriptionID).Scan(
		&sub.ID, &sub.UserID, &sub.Name, &sub.Price, &sub.BillingCycle, &sub.BillingDate,
		&sub.CategoryID, &sub.Status, &sub.Description, &sub.WebsiteURL, &sub.CancellationURL, &sub.CreatedAt, &sub.UpdatedAt, &sub.PaymentMethod,
		&categoryID, &categoryName,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to retrieve created subscription"})
		return
	}

	if categoryID.Valid {
		catUUID, _ := uuid.Parse(categoryID.String)
		sub.Category = &models.Category{
			ID:   catUUID,
			Name: categoryName.String,
		}
	}

	// Automatically create Google Calendar event if user has Google Calendar connected
	go h.createCalendarEventForSubscription(userID.(uuid.UUID), sub)

	c.JSON(http.StatusCreated, sub)
}

func (h *SubscriptionHandler) GetSubscription(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	subscriptionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid subscription ID"})
		return
	}

	var sub models.Subscription
	var categoryID, categoryName sql.NullString

	err = h.db.QueryRow(`
		SELECT s.id, s.user_id, s.name, s.price, s.billing_cycle, s.billing_date, s.category_id, s.status,
		       s.description, s.website_url, s.created_at, s.updated_at, s.payment_method,
		       c.id, c.name
		FROM subscriptions s
		LEFT JOIN categories c ON s.category_id = c.id
		WHERE s.id = $1 AND s.user_id = $2
	`, subscriptionID, userID.(uuid.UUID)).Scan(
		&sub.ID, &sub.UserID, &sub.Name, &sub.Price, &sub.BillingCycle, &sub.BillingDate,
		&sub.CategoryID, &sub.Status, &sub.Description, &sub.WebsiteURL, &sub.CreatedAt, &sub.UpdatedAt, &sub.PaymentMethod,
		&categoryID, &categoryName,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Subscription not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database error"})
		return
	}

	if categoryID.Valid {
		catUUID, _ := uuid.Parse(categoryID.String)
		sub.Category = &models.Category{
			ID:   catUUID,
			Name: categoryName.String,
		}
	}

	c.JSON(http.StatusOK, sub)
}

func (h *SubscriptionHandler) UpdateSubscription(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	subscriptionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid subscription ID"})
		return
	}

	var req models.UpdateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Build dynamic update query
	updates := []string{}
	args := []interface{}{}
	argCount := 1

	if req.Name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argCount))
		args = append(args, *req.Name)
		argCount++
	}

	if req.Price != nil {
		updates = append(updates, fmt.Sprintf("price = $%d", argCount))
		args = append(args, *req.Price)
		argCount++
	}

	if req.BillingCycle != nil {
		updates = append(updates, fmt.Sprintf("billing_cycle = $%d", argCount))
		args = append(args, *req.BillingCycle)
		argCount++
	}

	if req.BillingDate != nil {
		updates = append(updates, fmt.Sprintf("billing_date = $%d", argCount))
		args = append(args, *req.BillingDate)
		argCount++
	}

	if req.CategoryID != nil {
		updates = append(updates, fmt.Sprintf("category_id = $%d", argCount))
		args = append(args, *req.CategoryID)
		argCount++
	} else if req.Category != nil {
		// Convert category name to ID
		var categoryID uuid.UUID
		err := h.db.QueryRow("SELECT id FROM categories WHERE LOWER(name) = LOWER($1)", *req.Category).Scan(&categoryID)
		if err == nil {
			updates = append(updates, fmt.Sprintf("category_id = $%d", argCount))
			args = append(args, categoryID)
			argCount++
		}
	}

	if req.Status != nil {
		updates = append(updates, fmt.Sprintf("status = $%d", argCount))
		args = append(args, *req.Status)
		argCount++
	}

	if req.PaymentMethod != nil {
		updates = append(updates, fmt.Sprintf("payment_method = $%d", argCount))
		args = append(args, *req.PaymentMethod)
		argCount++
	}

	if req.Description != nil {
		updates = append(updates, fmt.Sprintf("description = $%d", argCount))
		args = append(args, *req.Description)
		argCount++
	}

	if req.WebsiteURL != nil {
		updates = append(updates, fmt.Sprintf("website_url = $%d", argCount))
		args = append(args, *req.WebsiteURL)
		argCount++
	}

	if req.CancellationURL != nil {
		updates = append(updates, fmt.Sprintf("cancellation_url = $%d", argCount))
		args = append(args, *req.CancellationURL)
		argCount++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "No fields to update"})
		return
	}

	updates = append(updates, fmt.Sprintf("updated_at = $%d", argCount))
	args = append(args, time.Now())
	argCount++

	args = append(args, subscriptionID, userID.(uuid.UUID))
	query := "UPDATE subscriptions SET " + updates[0]
	for i := 1; i < len(updates); i++ {
		query += ", " + updates[i]
	}
	query += fmt.Sprintf(" WHERE id = $%d AND user_id = $%d", argCount, argCount+1)

	result, err := h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to update subscription"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Subscription not found"})
		return
	}

	// If billing date or cycle was updated, update the calendar event
	if req.BillingDate != nil || req.BillingCycle != nil || req.Name != nil || req.Price != nil {
		// Get updated subscription details
		var sub models.Subscription
		err = h.db.QueryRow(`
			SELECT id, user_id, name, price, billing_cycle, billing_date, category_id, status, 
			       description, website_url, created_at, updated_at, payment_method
			FROM subscriptions
			WHERE id = $1
		`, subscriptionID).Scan(
			&sub.ID, &sub.UserID, &sub.Name, &sub.Price, &sub.BillingCycle, &sub.BillingDate,
			&sub.CategoryID, &sub.Status, &sub.Description, &sub.WebsiteURL, &sub.CreatedAt, &sub.UpdatedAt, &sub.PaymentMethod,
		)

		if err == nil {
			// Update calendar event asynchronously
			go h.createCalendarEventForSubscription(userID.(uuid.UUID), sub)

			// If billing date was changed, regenerate notifications
			if req.BillingDate != nil && h.notificationGenerator != nil {
				go h.notificationGenerator.RegenerateNotificationsForSubscription(subscriptionID)
			}
		}
	}

	// Return updated subscription
	h.GetSubscription(c)
}

func (h *SubscriptionHandler) DeleteSubscription(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	subscriptionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid subscription ID"})
		return
	}

	result, err := h.db.Exec(
		"DELETE FROM subscriptions WHERE id = $1 AND user_id = $2",
		subscriptionID, userID.(uuid.UUID),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete subscription"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Subscription not found"})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Subscription deleted successfully",
	})
}

// createCalendarEventForSubscription automatically creates a Google Calendar event for a subscription
func (h *SubscriptionHandler) createCalendarEventForSubscription(userID uuid.UUID, sub models.Subscription) {
	// Check if user has Google Calendar connected
	var accessToken, refreshToken *string
	var expiry *time.Time

	err := h.db.QueryRow(
		`SELECT google_access_token, google_refresh_token, google_token_expiry 
		 FROM users WHERE id = $1`,
		userID,
	).Scan(&accessToken, &refreshToken, &expiry)

	if err != nil || accessToken == nil || refreshToken == nil {
		// User doesn't have Google Calendar connected, skip
		return
	}

	// Check if token is expired and refresh if needed
	if expiry != nil && time.Now().After(*expiry) {
		// Token expired, refresh it
		newAccessToken, err := h.refreshGoogleToken(userID, *refreshToken)
		if err != nil {
			fmt.Printf("Failed to refresh token for user %s: %v\n", userID, err)
			return
		}
		accessToken = &newAccessToken
	}

	// Create calendar event
	description := ""
	if sub.Description != nil {
		description = *sub.Description
	}

	_, err = h.createGoogleCalendarEvent(*accessToken, sub.Name, sub.Price, sub.BillingDate, description, string(sub.BillingCycle))
	if err != nil {
		fmt.Printf("Failed to create calendar event for subscription %s: %v\n", sub.ID, err)
		return
	}

	fmt.Printf("Calendar event created successfully for subscription: %s\n", sub.Name)
}

// refreshGoogleToken refreshes an expired Google access token
func (h *SubscriptionHandler) refreshGoogleToken(userID uuid.UUID, refreshToken string) (string, error) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")

	data := url.Values{}
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("refresh_token", refreshToken)
	data.Set("grant_type", "refresh_token")

	resp, err := http.PostForm("https://oauth2.googleapis.com/token", data)
	if err != nil {
		return "", fmt.Errorf("failed to refresh token: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("token refresh failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse tokens: %w", err)
	}

	newAccessToken, ok := result["access_token"].(string)
	if !ok {
		return "", fmt.Errorf("access token not found in response")
	}

	expiresIn, _ := result["expires_in"].(float64)
	expiry := time.Now().Add(time.Duration(expiresIn) * time.Second)

	// Save new tokens
	_, err = h.db.Exec(
		`UPDATE users 
		 SET google_access_token = $1, 
		     google_token_expiry = $2
		 WHERE id = $3`,
		newAccessToken,
		expiry,
		userID,
	)

	return newAccessToken, err
}

// createGoogleCalendarEvent creates a recurring event in Google Calendar
func (h *SubscriptionHandler) createGoogleCalendarEvent(accessToken, name string, amount float64, billingDate time.Time, description, billingCycle string) (string, error) {
	// Determine recurrence rule based on billing cycle
	var recurrenceRule string
	switch billingCycle {
	case "monthly":
		recurrenceRule = "RRULE:FREQ=MONTHLY;COUNT=12" // Recurring for 12 months
	case "yearly":
		recurrenceRule = "RRULE:FREQ=YEARLY;COUNT=5" // Recurring for 5 years
	case "weekly":
		recurrenceRule = "RRULE:FREQ=WEEKLY;COUNT=52" // Recurring for 52 weeks
	default:
		recurrenceRule = "RRULE:FREQ=MONTHLY;COUNT=12"
	}

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
		"recurrence": []string{recurrenceRule},
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
