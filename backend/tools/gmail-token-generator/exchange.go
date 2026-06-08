package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

func main() {
	clientID := os.Getenv("GMAIL_CLIENT_ID")
	clientSecret := os.Getenv("GMAIL_CLIENT_SECRET")
	code := os.Getenv("GOOGLE_AUTH_CODE")
	email := os.Getenv("GMAIL_EMAIL")

	if clientID == "" || clientSecret == "" || code == "" {
		log.Fatal("Missing required environment variables: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GOOGLE_AUTH_CODE")
	}

	if email == "" {
		email = "your-email@example.com"
	}

	config := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  "http://localhost:8080/oauth2callback",
		Scopes: []string{
			"https://www.googleapis.com/auth/gmail.send",
		},
		Endpoint: google.Endpoint,
	}

	ctx := context.Background()
	token, err := config.Exchange(ctx, code)
	if err != nil {
		log.Fatalf("Failed to exchange code: %v", err)
	}

	fmt.Println("\n✓ Successfully obtained refresh token!\n")
	fmt.Println("Add these to your .env file:\n")
	fmt.Printf("GMAIL_CLIENT_ID=%s\n", clientID)
	fmt.Printf("GMAIL_CLIENT_SECRET=%s\n", clientSecret)
	fmt.Printf("GMAIL_REFRESH_TOKEN=%s\n", token.RefreshToken)
	fmt.Printf("GMAIL_EMAIL=%s\n", email)

	// Save token to file
	tokenJSON, _ := json.MarshalIndent(token, "", "  ")
	os.WriteFile("gmail_token.json", tokenJSON, 0600)
	fmt.Println("\n✓ Token saved to gmail_token.json")
}
