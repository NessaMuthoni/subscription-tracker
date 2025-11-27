package handlers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"subscription-tracker/internal/models"

	"github.com/gin-gonic/gin"
)

// STKPushRequest represents the request to initiate STK Push
type STKPushRequest struct {
	PhoneNumber      string  `json:"phoneNumber" binding:"required"`
	Amount           float64 `json:"amount" binding:"required"`
	AccountReference string  `json:"accountReference" binding:"required"`
	Description      string  `json:"description"`
}

// STKPushResponse represents M-Pesa STK Push API response
type STKPushResponse struct {
	MerchantRequestID   string `json:"MerchantRequestID"`
	CheckoutRequestID   string `json:"CheckoutRequestID"`
	ResponseCode        string `json:"ResponseCode"`
	ResponseDescription string `json:"ResponseDescription"`
	CustomerMessage     string `json:"CustomerMessage"`
}

// InitiateMpesaSTKPush handles M-Pesa STK Push payment initiation
func (h *PaymentHandler) InitiateMpesaSTKPush(c *gin.Context) {
	var req STKPushRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Get M-Pesa credentials from environment
	consumerKey := os.Getenv("MPESA_CONSUMER_KEY")
	consumerSecret := os.Getenv("MPESA_CONSUMER_SECRET")
	shortCode := os.Getenv("MPESA_SHORTCODE")
	passKey := os.Getenv("MPESA_PASSKEY")
	callbackURL := os.Getenv("MPESA_CALLBACK_URL")

	if consumerKey == "" || consumerSecret == "" || shortCode == "" || passKey == "" {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "M-Pesa API credentials not configured. Check environment variables",
		})
		return
	}

	// Default callback URL if not set
	if callbackURL == "" {
		callbackURL = "https://your-domain.com/api/payment/mpesa/callback"
	}

	// Get access token from M-Pesa
	accessToken, err := getMpesaAccessToken(consumerKey, consumerSecret)
	if err != nil {
		fmt.Printf("Failed to get M-Pesa access token: %v\n", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to authenticate with M-Pesa API: " + err.Error(),
		})
		return
	}

	// Initiate STK Push
	response, err := initiateSTKPush(accessToken, shortCode, passKey, req.PhoneNumber, req.Amount, req.AccountReference, req.Description, callbackURL)
	if err != nil {
		fmt.Printf("Failed to initiate STK Push: %v\n", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Failed to initiate payment: " + err.Error(),
		})
		return
	}

	// Check if the STK Push was successful
	if response.ResponseCode != "0" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": response.ResponseDescription,
			"error":   response.CustomerMessage,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":           true,
		"message":           "Payment prompt sent to your phone",
		"checkoutRequestId": response.CheckoutRequestID,
		"merchantRequestId": response.MerchantRequestID,
	})
}

// initiateSTKPush sends STK Push request to M-Pesa Daraja API
func initiateSTKPush(accessToken, shortCode, passKey, phoneNumber string, amount float64, accountRef, description, callbackURL string) (*STKPushResponse, error) {
	// Generate timestamp (YYYYMMDDHHmmss)
	timestamp := time.Now().Format("20060102150405")

	// Generate password: Base64(Shortcode + Passkey + Timestamp)
	password := base64.StdEncoding.EncodeToString([]byte(shortCode + passKey + timestamp))

	// Set default description if empty
	if description == "" {
		description = "Subscription Payment"
	}

	// Prepare STK Push request payload
	payload := map[string]interface{}{
		"BusinessShortCode": shortCode,
		"Password":          password,
		"Timestamp":         timestamp,
		"TransactionType":   "CustomerPayBillOnline",
		"Amount":            int(amount), // M-Pesa expects integer
		"PartyA":            phoneNumber,
		"PartyB":            shortCode,
		"PhoneNumber":       phoneNumber,
		"CallBackURL":       callbackURL,
		"AccountReference":  accountRef,
		"TransactionDesc":   description,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	// M-Pesa STK Push endpoint (Sandbox)
	url := "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

	// Create HTTP request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)

	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	fmt.Printf("M-Pesa STK Push Response: %s\n", string(body))

	// Parse response
	var stkResponse STKPushResponse
	if err := json.Unmarshal(body, &stkResponse); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &stkResponse, nil
}

// MpesaCallback handles M-Pesa payment callback
func (h *PaymentHandler) MpesaCallback(c *gin.Context) {
	var callback map[string]interface{}
	if err := c.ShouldBindJSON(&callback); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Log the callback for debugging
	callbackJSON, _ := json.MarshalIndent(callback, "", "  ")
	fmt.Printf("M-Pesa Callback Received:\n%s\n", string(callbackJSON))

	// TODO: Process the callback and update subscription payment status
	// Extract result code, amount, transaction ID, etc.
	// Update database with payment confirmation

	c.JSON(http.StatusOK, gin.H{
		"ResultCode": 0,
		"ResultDesc": "Callback received successfully",
	})
}
