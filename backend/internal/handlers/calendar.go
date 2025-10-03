package handlers

import (
	"net/http"
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