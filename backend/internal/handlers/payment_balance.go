package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"subscription-tracker/internal/models"

	"github.com/gin-gonic/gin"
)

// CheckMpesaBalance handles M-Pesa balance check via Daraja API
func (h *PaymentHandler) CheckMpesaBalance(c *gin.Context) {
	var req struct {
		PhoneNumber string `json:"phoneNumber" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Get M-Pesa credentials from environment
	consumerKey := os.Getenv("MPESA_CONSUMER_KEY")
	consumerSecret := os.Getenv("MPESA_CONSUMER_SECRET")

	if consumerKey == "" || consumerSecret == "" {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "M-Pesa API credentials not configured. Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET",
		})
		return
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

	// Query account balance
	balance, err := queryMpesaBalance(accessToken, req.PhoneNumber)
	if err != nil {
		fmt.Printf("Failed to query M-Pesa balance: %v\n", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"balance":  balance,
		"currency": "KES",
	})
}

// CheckCardBalance handles bank card balance check
func (h *PaymentHandler) CheckCardBalance(c *gin.Context) {
	var req struct {
		CardToken string `json:"cardToken" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Get payment provider credentials
	provider := os.Getenv("CARD_PAYMENT_PROVIDER") // "paystack", "flutterwave", or "stripe"
	apiKey := os.Getenv("CARD_PAYMENT_API_KEY")

	if provider == "" || apiKey == "" {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: "Card payment provider not configured. Set CARD_PAYMENT_PROVIDER and CARD_PAYMENT_API_KEY",
		})
		return
	}

	// Query balance based on provider
	var balance float64
	var cardLast4 string
	var err error

	switch provider {
	case "paystack":
		balance, cardLast4, err = queryPaystackBalance(apiKey, req.CardToken)
	case "flutterwave":
		balance, cardLast4, err = queryFlutterwaveBalance(apiKey, req.CardToken)
	case "stripe":
		balance, cardLast4, err = queryStripeBalance(apiKey, req.CardToken)
	default:
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: fmt.Sprintf("Unsupported payment provider: %s. Use: paystack, flutterwave, or stripe", provider),
		})
		return
	}

	if err != nil {
		fmt.Printf("Failed to query card balance: %v\n", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"balance":   balance,
		"currency":  "KES",
		"cardLast4": cardLast4,
	})
}

// CheckPayPalBalance handles PayPal balance check
func (h *PaymentHandler) CheckPayPalBalance(c *gin.Context) {
	var req struct {
		AccessToken string `json:"accessToken" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	balance, err := queryPayPalBalance(req.AccessToken)
	if err != nil {
		fmt.Printf("Failed to query PayPal balance: %v\n", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"balance":  balance,
		"currency": "KES",
	})
}

// M-Pesa Daraja API helper functions
func getMpesaAccessToken(consumerKey, consumerSecret string) (string, error) {
	url := "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
	// For production: https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}

	req.SetBasicAuth(consumerKey, consumerSecret)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("M-Pesa auth failed (%d): %s", resp.StatusCode, string(body))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   string `json:"expires_in"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", err
	}

	return tokenResp.AccessToken, nil
}

func queryMpesaBalance(accessToken, phoneNumber string) (float64, error) {
	// NOTE: M-Pesa Account Balance requires special Daraja API permissions
	// You need to register for Account Balance API at https://developer.safaricom.co.ke/
	// This requires:
	// 1. Production app registration
	// 2. Account Balance API permissions from Safaricom
	// 3. Security credentials generation
	// 4. Result and timeout URLs configuration

	return 0, fmt.Errorf("M-Pesa balance query requires additional setup. Visit https://developer.safaricom.co.ke/Documentation for Account Balance API setup")
}

// Paystack helper functions
func queryPaystackBalance(apiKey, cardToken string) (float64, string, error) {
	url := "https://api.paystack.co/balance"

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return 0, "", err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return 0, "", fmt.Errorf("Paystack API error (%d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		Status bool `json:"status"`
		Data   []struct {
			Balance  int64  `json:"balance"`
			Currency string `json:"currency"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, "", err
	}

	if !result.Status || len(result.Data) == 0 {
		return 0, "", fmt.Errorf("no balance data returned from Paystack")
	}

	balance := float64(result.Data[0].Balance) / 100 // Paystack returns in kobo
	return balance, "****", nil
}

// Flutterwave helper functions
func queryFlutterwaveBalance(apiKey, cardToken string) (float64, string, error) {
	url := "https://api.flutterwave.com/v3/balances"

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return 0, "", err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return 0, "", fmt.Errorf("Flutterwave API error (%d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		Status string `json:"status"`
		Data   []struct {
			AvailableBalance float64 `json:"available_balance"`
			Currency         string  `json:"currency"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, "", err
	}

	if result.Status != "success" || len(result.Data) == 0 {
		return 0, "", fmt.Errorf("no balance data returned from Flutterwave")
	}

	// Find KES balance
	for _, bal := range result.Data {
		if bal.Currency == "KES" {
			return bal.AvailableBalance, "****", nil
		}
	}

	// Return first available balance
	return result.Data[0].AvailableBalance, "****", nil
}

// Stripe helper functions
func queryStripeBalance(apiKey, cardToken string) (float64, string, error) {
	url := "https://api.stripe.com/v1/balance"

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return 0, "", err
	}

	req.SetBasicAuth(apiKey, "")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := client.Do(req)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return 0, "", fmt.Errorf("Stripe API error (%d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		Available []struct {
			Amount   int64  `json:"amount"`
			Currency string `json:"currency"`
		} `json:"available"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, "", err
	}

	if len(result.Available) == 0 {
		return 0, "", fmt.Errorf("no balance data returned from Stripe")
	}

	balance := float64(result.Available[0].Amount) / 100 // Stripe returns in cents
	return balance, "****", nil
}

// PayPal helper functions
func queryPayPalBalance(accessToken string) (float64, error) {
	url := "https://api-m.sandbox.paypal.com/v1/reporting/balances"
	// For production: https://api-m.paypal.com/v1/reporting/balances

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return 0, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return 0, fmt.Errorf("PayPal API error (%d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		Balances []struct {
			TotalBalance struct {
				Value    string `json:"value"`
				Currency string `json:"currency_code"`
			} `json:"total_balance"`
		} `json:"balances"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, err
	}

	if len(result.Balances) == 0 {
		return 0, fmt.Errorf("no balance data returned from PayPal")
	}

	var balance float64
	fmt.Sscanf(result.Balances[0].TotalBalance.Value, "%f", &balance)
	return balance, nil
}
