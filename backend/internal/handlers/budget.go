package handlers

import (
	"database/sql"
	"net/http"

	"subscription-tracker/internal/database"
	"subscription-tracker/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BudgetHandler struct {
	db *database.DB
}

func NewBudgetHandler(db *database.DB) *BudgetHandler {
	return &BudgetHandler{db: db}
}

func (h *BudgetHandler) GetBudget(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	var budget models.Budget
	err := h.db.QueryRow(
		"SELECT id, user_id, amount, period, created_at FROM budgets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
		userID.(uuid.UUID),
	).Scan(&budget.ID, &budget.UserID, &budget.Amount, &budget.Period, &budget.CreatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "No budget found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database error"})
		return
	}

	c.JSON(http.StatusOK, budget)
}

func (h *BudgetHandler) CreateBudget(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	var req models.CreateBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	budgetID := uuid.New()
	_, err := h.db.Exec(
		"INSERT INTO budgets (id, user_id, amount, period) VALUES ($1, $2, $3, $4)",
		budgetID, userID.(uuid.UUID), req.Amount, req.Period,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to create budget"})
		return
	}

	var budget models.Budget
	err = h.db.QueryRow(
		"SELECT id, user_id, amount, period, created_at FROM budgets WHERE id = $1",
		budgetID,
	).Scan(&budget.ID, &budget.UserID, &budget.Amount, &budget.Period, &budget.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to retrieve created budget"})
		return
	}

	c.JSON(http.StatusCreated, budget)
}