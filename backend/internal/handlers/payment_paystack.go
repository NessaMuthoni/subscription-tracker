package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"subscription-tracker/internal/models"

	"github.com/gin-gonic/gin"
)

// PaystackInitializeRequest represents the request to initialize payment
type PaystackInitializeRequest struct {
	Email            string  `json:"email" binding:"required"`
	Amount           float64 `json:"amount" binding:"required"`
	Reference        string  `json:"reference"`
	CallbackURL      string  `json:"callback_url"`
	SubscriptionName string  `json:"subscriptionName"`
}

// PaystackInitializeResponse represents Paystack initialization response
type PaystackInitializeResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		AuthorizationURL string `json:"authorization_url"`
		AccessCode       string `json:"access_code"`
		Reference        string `json:"reference"`
	} `json:"data"`
}

// PaystackVerifyResponse represents Paystack verification response
type PaystackVerifyResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		ID              int    `json:"id"`
		Status          string `json:"status"`
		Reference       string `json:"reference"`
		Amount          int    `json:"amount"`
		Currency        string `json:"currency"`
		TransactionDate string `json:"transaction_date"`
		Customer        struct {
			Email string `json:"email"`
		} `json:"customer"`
	} `json:"data"`
}

// InitializePaystackPayment handles Paystack payment initialization
func (h *PaymentHandler) InitializePaystackPayment(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}

	var req PaystackInitializeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Check user's budget before proceeding with payment
	var budget models.Budget
	err := h.db.QueryRow(
		"SELECT id, user_id, amount, period, created_at FROM budgets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
		userID,
	).Scan(&budget.ID, &budget.UserID, &budget.Amount, &budget.Period, &budget.CreatedAt)

	if err == nil {
		// Budget exists, check if current active subscriptions exceed budget
		var totalSpent float64
		err = h.db.QueryRow(`
			SELECT COALESCE(SUM(price), 0) 
			FROM subscriptions 
			WHERE user_id = $1 AND status = 'active'
		`, userID).Scan(&totalSpent)

		if err == nil {
			// Check if total active subscriptions already exceed budget
			// Note: totalSpent already includes the subscription being paid for
			if totalSpent > budget.Amount {
				c.JSON(http.StatusPaymentRequired, gin.H{
					"success":        false,
					"error":          "Budget exceeded",
					"message":        fmt.Sprintf("Cannot process payment - your active subscriptions (KSh %.2f) exceed your monthly budget of KSh %.2f", totalSpent, budget.Amount),
					"budget":         budget.Amount,
					"current_spent":  totalSpent,
					"payment_amount": req.Amount,
					"would_exceed":   true,
				})
				return
			}
		}
	}

	// Get Paystack credentials from environment
	secretKey := os.Getenv("PAYSTACK_SECRET_KEY")
	callbackURL := os.Getenv("PAYSTACK_CALLBACK_URL")

	if secretKey == "" {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Paystack API credentials not configured",
		})
		return
	}

	// Use provided callback URL or default
	if req.CallbackURL != "" {
		callbackURL = req.CallbackURL
	}
	if callbackURL == "" {
		callbackURL = "http://localhost:3000/payment/callback"
	}

	// Convert amount to kobo (Paystack uses smallest currency unit)
	amountInKobo := int(req.Amount * 100)

	// Generate reference if not provided
	reference := req.Reference
	if reference == "" {
		reference = fmt.Sprintf("SUB_%d", generateRandomNumber())
	}

	// Prepare request payload
	payload := map[string]interface{}{
		"email":        req.Email,
		"amount":       amountInKobo,
		"reference":    reference,
		"callback_url": callbackURL,
		"metadata": map[string]string{
			"subscription_name": req.SubscriptionName,
		},
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to prepare payment request",
		})
		return
	}

	// Initialize payment with Paystack
	paystackURL := "https://api.paystack.co/transaction/initialize"
	httpReq, err := http.NewRequest("POST", paystackURL, bytes.NewBuffer(jsonPayload))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to create payment request",
		})
		return
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+secretKey)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to connect to Paystack",
		})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to read payment response",
		})
		return
	}

	var paystackResp PaystackInitializeResponse
	if err := json.Unmarshal(body, &paystackResp); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to parse payment response",
		})
		return
	}

	if !paystackResp.Status {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": paystackResp.Message,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":           true,
		"message":           "Payment initialized successfully",
		"authorization_url": paystackResp.Data.AuthorizationURL,
		"access_code":       paystackResp.Data.AccessCode,
		"reference":         paystackResp.Data.Reference,
	})
}

// VerifyPaystackPayment handles payment verification
func (h *PaymentHandler) VerifyPaystackPayment(c *gin.Context) {
	reference := c.Param("reference")
	if reference == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error: "Payment reference is required",
		})
		return
	}

	secretKey := os.Getenv("PAYSTACK_SECRET_KEY")
	if secretKey == "" {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Paystack API credentials not configured",
		})
		return
	}

	// Verify payment with Paystack
	paystackURL := fmt.Sprintf("https://api.paystack.co/transaction/verify/%s", reference)
	httpReq, err := http.NewRequest("GET", paystackURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to create verification request",
		})
		return
	}

	httpReq.Header.Set("Authorization", "Bearer "+secretKey)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to verify payment",
		})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to read verification response",
		})
		return
	}

	var verifyResp PaystackVerifyResponse
	if err := json.Unmarshal(body, &verifyResp); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to parse verification response",
		})
		return
	}

	if !verifyResp.Status {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": verifyResp.Message,
		})
		return
	}

	// Check if payment was successful
	if verifyResp.Data.Status != "success" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Payment was not successful",
			"status":  verifyResp.Data.Status,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "Payment verified successfully",
		"reference": verifyResp.Data.Reference,
		"amount":    float64(verifyResp.Data.Amount) / 100, // Convert from kobo to naira/kes
		"currency":  verifyResp.Data.Currency,
		"status":    verifyResp.Data.Status,
		"email":     verifyResp.Data.Customer.Email,
	})
}

// PaystackWebhook handles Paystack webhook callbacks
func (h *PaymentHandler) PaystackWebhook(c *gin.Context) {
	var webhook map[string]interface{}
	if err := c.ShouldBindJSON(&webhook); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Log webhook for debugging
	webhookJSON, _ := json.MarshalIndent(webhook, "", "  ")
	fmt.Printf("Paystack Webhook Received:\n%s\n", string(webhookJSON))

	// TODO: Verify webhook signature
	// TODO: Process webhook event and update subscription payment status

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
	})
}

// Helper function to generate random reference number
func generateRandomNumber() int64 {
	// Simple implementation - in production use crypto/rand
	return 1000000 + int64(len(fmt.Sprintf("%d", 123456789)))
}
