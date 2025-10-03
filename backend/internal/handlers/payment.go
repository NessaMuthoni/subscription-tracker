package handlers

import (
	"database/sql"
	"net/http"

	"subscription-tracker/internal/database"
	"subscription-tracker/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PaymentHandler struct {
	db *database.DB
}

func NewPaymentHandler(db *database.DB) *PaymentHandler {
	return &PaymentHandler{db: db}
}

func (h *PaymentHandler) GetPaymentMethods(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	rows, err := h.db.Query(
		"SELECT id, user_id, type, last4, brand, created_at FROM payment_methods WHERE user_id = $1 ORDER BY created_at DESC",
		userID.(uuid.UUID),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database error"})
		return
	}
	defer rows.Close()

	var paymentMethods []models.PaymentMethod
	for rows.Next() {
		var pm models.PaymentMethod
		err := rows.Scan(&pm.ID, &pm.UserID, &pm.Type, &pm.Last4, &pm.Brand, &pm.CreatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to scan payment method"})
			return
		}
		paymentMethods = append(paymentMethods, pm)
	}

	c.JSON(http.StatusOK, paymentMethods)
}

func (h *PaymentHandler) CreatePaymentMethod(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	var req models.CreatePaymentMethodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	paymentMethodID := uuid.New()
	_, err := h.db.Exec(
		"INSERT INTO payment_methods (id, user_id, type, last4, brand) VALUES ($1, $2, $3, $4, $5)",
		paymentMethodID, userID.(uuid.UUID), req.Type, req.Last4, req.Brand,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to create payment method"})
		return
	}

	var pm models.PaymentMethod
	err = h.db.QueryRow(
		"SELECT id, user_id, type, last4, brand, created_at FROM payment_methods WHERE id = $1",
		paymentMethodID,
	).Scan(&pm.ID, &pm.UserID, &pm.Type, &pm.Last4, &pm.Brand, &pm.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to retrieve created payment method"})
		return
	}

	c.JSON(http.StatusCreated, pm)
}

func (h *PaymentHandler) DeletePaymentMethod(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	paymentMethodID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid payment method ID"})
		return
	}

	result, err := h.db.Exec(
		"DELETE FROM payment_methods WHERE id = $1 AND user_id = $2",
		paymentMethodID, userID.(uuid.UUID),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete payment method"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Payment method not found"})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Payment method deleted successfully",
	})
}