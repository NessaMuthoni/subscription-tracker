package handlers

import (
	"net/http"
	"time"

	"subscription-tracker/internal/database"
	"subscription-tracker/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AnalyticsHandler struct {
	db *database.DB
}

func NewAnalyticsHandler(db *database.DB) *AnalyticsHandler {
	return &AnalyticsHandler{db: db}
}

type AnalyticsSummary struct {
	TotalMonthlySpending  float64 `json:"total_monthly_spending"`
	TotalYearlySpending   float64 `json:"total_yearly_spending"`
	ActiveSubscriptions   int     `json:"active_subscriptions"`
	UpcomingRenewals      int     `json:"upcoming_renewals"`
	CategoryBreakdown     []CategorySpending `json:"category_breakdown"`
	MonthlyTrend          []MonthlySpending  `json:"monthly_trend"`
}

type CategorySpending struct {
	CategoryName string  `json:"category_name"`
	Amount       float64 `json:"amount"`
	Count        int     `json:"count"`
}

type MonthlySpending struct {
	Month  string  `json:"month"`
	Amount float64 `json:"amount"`
}

func (h *AnalyticsHandler) GetSummary(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	summary := AnalyticsSummary{}

	// Calculate total monthly spending
	err := h.db.QueryRow(
		"SELECT COALESCE(SUM(price), 0) FROM subscriptions WHERE user_id = $1 AND status = 'active'",
		userID.(uuid.UUID),
	).Scan(&summary.TotalMonthlySpending)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to calculate monthly spending"})
		return
	}

	summary.TotalYearlySpending = summary.TotalMonthlySpending * 12

	// Count active subscriptions
	err = h.db.QueryRow(
		"SELECT COUNT(*) FROM subscriptions WHERE user_id = $1 AND status = 'active'",
		userID.(uuid.UUID),
	).Scan(&summary.ActiveSubscriptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to count subscriptions"})
		return
	}

	// Count upcoming renewals (next 7 days)
	nextWeek := time.Now().AddDate(0, 0, 7)
	err = h.db.QueryRow(
		"SELECT COUNT(*) FROM subscriptions WHERE user_id = $1 AND status = 'active' AND billing_date <= $2",
		userID.(uuid.UUID), nextWeek,
	).Scan(&summary.UpcomingRenewals)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to count upcoming renewals"})
		return
	}

	// Category breakdown
	rows, err := h.db.Query(`
		SELECT COALESCE(c.name, 'Other') as category_name, 
		       COALESCE(SUM(s.price), 0) as amount,
		       COUNT(s.id) as count
		FROM subscriptions s
		LEFT JOIN categories c ON s.category_id = c.id
		WHERE s.user_id = $1 AND s.status = 'active'
		GROUP BY c.name
		ORDER BY amount DESC
	`, userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get category breakdown"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var cs CategorySpending
		err := rows.Scan(&cs.CategoryName, &cs.Amount, &cs.Count)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to scan category data"})
			return
		}
		summary.CategoryBreakdown = append(summary.CategoryBreakdown, cs)
	}

	// Mock monthly trend for the last 6 months
	for i := 5; i >= 0; i-- {
		date := time.Now().AddDate(0, -i, 0)
		month := date.Format("2006-01")
		// For now, use current monthly spending as trend
		summary.MonthlyTrend = append(summary.MonthlyTrend, MonthlySpending{
			Month:  month,
			Amount: summary.TotalMonthlySpending,
		})
	}

	c.JSON(http.StatusOK, summary)
}