package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"subscription-tracker/internal/database"
	"subscription-tracker/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SubscriptionHandler struct {
	db *database.DB
}

func NewSubscriptionHandler(db *database.DB) *SubscriptionHandler {
	return &SubscriptionHandler{db: db}
}

func (h *SubscriptionHandler) GetSubscriptions(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	rows, err := h.db.Query(`
		SELECT s.id, s.user_id, s.name, s.price, s.billing_cycle, s.billing_date, s.category_id, s.status, 
		       s.payment_method, s.description, s.website_url, s.created_at, s.updated_at,
		       c.id, c.name
		FROM subscriptions s
		LEFT JOIN categories c ON s.category_id = c.id
		WHERE s.user_id = $1
		ORDER BY s.created_at DESC
	`, userID.(uuid.UUID))

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database error"})
		return
	}
	defer rows.Close()

	var subscriptions []models.Subscription
	for rows.Next() {
		var sub models.Subscription
		var categoryID, categoryName sql.NullString

		err := rows.Scan(
			&sub.ID, &sub.UserID, &sub.Name, &sub.Price, &sub.BillingCycle, &sub.BillingDate,
			&sub.CategoryID, &sub.Status, &sub.PaymentMethod, &sub.Description, &sub.WebsiteURL,
			&sub.CreatedAt, &sub.UpdatedAt, &categoryID, &categoryName,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to scan subscription"})
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

	subscriptionID := uuid.New()
	now := time.Now()

	_, err := h.db.Exec(`
		INSERT INTO subscriptions (id, user_id, name, price, billing_cycle, billing_date, category_id, status, payment_method, description, website_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`, subscriptionID, userID.(uuid.UUID), req.Name, req.Price, req.BillingCycle, req.BillingDate, req.CategoryID, req.Status, req.PaymentMethod, req.Description, req.WebsiteURL, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to create subscription"})
		return
	}

	// Get created subscription with category
	var sub models.Subscription
	var categoryID, categoryName sql.NullString

	err = h.db.QueryRow(`
		SELECT s.id, s.user_id, s.name, s.price, s.billing_cycle, s.billing_date, s.category_id, s.status, 
		       s.payment_method, s.description, s.website_url, s.created_at, s.updated_at,
		       c.id, c.name
		FROM subscriptions s
		LEFT JOIN categories c ON s.category_id = c.id
		WHERE s.id = $1
	`, subscriptionID).Scan(
		&sub.ID, &sub.UserID, &sub.Name, &sub.Price, &sub.BillingCycle, &sub.BillingDate,
		&sub.CategoryID, &sub.Status, &sub.PaymentMethod, &sub.Description, &sub.WebsiteURL, &sub.CreatedAt, &sub.UpdatedAt,
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
		       s.payment_method, s.description, s.website_url, s.created_at, s.updated_at,
		       c.id, c.name
		FROM subscriptions s
		LEFT JOIN categories c ON s.category_id = c.id
		WHERE s.id = $1 AND s.user_id = $2
	`, subscriptionID, userID.(uuid.UUID)).Scan(
		&sub.ID, &sub.UserID, &sub.Name, &sub.Price, &sub.BillingCycle, &sub.BillingDate,
		&sub.CategoryID, &sub.Status, &sub.PaymentMethod, &sub.Description, &sub.WebsiteURL, &sub.CreatedAt, &sub.UpdatedAt,
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
		updates = append(updates, "name = $"+string(rune(argCount+48)))
		args = append(args, *req.Name)
		argCount++
	}

	if req.Price != nil {
		updates = append(updates, "price = $"+string(rune(argCount+48)))
		args = append(args, *req.Price)
		argCount++
	}

	if req.BillingCycle != nil {
		updates = append(updates, "billing_cycle = $"+string(rune(argCount+48)))
		args = append(args, *req.BillingCycle)
		argCount++
	}

	if req.BillingDate != nil {
		updates = append(updates, "billing_date = $"+string(rune(argCount+48)))
		args = append(args, *req.BillingDate)
		argCount++
	}

	if req.CategoryID != nil {
		updates = append(updates, "category_id = $"+string(rune(argCount+48)))
		args = append(args, *req.CategoryID)
		argCount++
	}

	if req.Status != nil {
		updates = append(updates, "status = $"+string(rune(argCount+48)))
		args = append(args, *req.Status)
		argCount++
	}

	if req.PaymentMethod != nil {
		updates = append(updates, "payment_method = $"+string(rune(argCount+48)))
		args = append(args, *req.PaymentMethod)
		argCount++
	}

	if req.Description != nil {
		updates = append(updates, "description = $"+string(rune(argCount+48)))
		args = append(args, *req.Description)
		argCount++
	}

	if req.WebsiteURL != nil {
		updates = append(updates, "website_url = $"+string(rune(argCount+48)))
		args = append(args, *req.WebsiteURL)
		argCount++
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "No fields to update"})
		return
	}

	updates = append(updates, "updated_at = $"+string(rune(argCount+48)))
	args = append(args, time.Now())
	argCount++

	args = append(args, subscriptionID, userID.(uuid.UUID))
	query := "UPDATE subscriptions SET " + updates[0]
	for i := 1; i < len(updates); i++ {
		query += ", " + updates[i]
	}
	query += " WHERE id = $" + string(rune(argCount+48)) + " AND user_id = $" + string(rune(argCount+49))

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
