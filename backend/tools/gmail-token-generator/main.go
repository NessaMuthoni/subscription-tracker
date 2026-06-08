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

// This script helps you get the Gmail OAuth2 refresh token

func main() {
	fmt.Println("=== Gmail OAuth2 Token Generator ===\n")

	// Get credentials from environment or prompt
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")

	if clientID == "" {
		fmt.Print("Enter your Google Client ID: ")
		fmt.Scanln(&clientID)
	} else {
		fmt.Println("✓ Using GOOGLE_CLIENT_ID from environment")
	}

	if clientSecret == "" {
		fmt.Print("Enter your Google Client Secret: ")
		fmt.Scanln(&clientSecret)
	} else {
		fmt.Println("✓ Using GOOGLE_CLIENT_SECRET from environment")
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

	// Generate authorization URL
	authURL := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	fmt.Printf("\n1. Visit this URL in your browser:\n%s\n\n", authURL)
	fmt.Println("2. Authorize the application")
	fmt.Println("3. You'll be redirected to http://localhost:8080/oauth2callback?code=...")
	fmt.Print("4. Copy the 'code' parameter from the URL and paste here: ")

	var code string
	fmt.Scanln(&code)

	// Exchange code for token
	token, err := config.Exchange(context.Background(), code)
	if err != nil {
		log.Fatalf("Error exchanging code: %v", err)
	}

	// Save token to file
	tokenJSON, err := json.MarshalIndent(token, "", "  ")
	if err != nil {
		log.Fatalf("Error marshaling token: %v", err)
	}

	err = os.WriteFile("gmail_token.json", tokenJSON, 0600)
	if err != nil {
		log.Fatalf("Error saving token: %v", err)
	}

	fmt.Println("\n✅ Success! Token saved to gmail_token.json")
	fmt.Printf("\nAdd these to your .env file:\n")
	fmt.Printf("GMAIL_CLIENT_ID=%s\n", clientID)
	fmt.Printf("GMAIL_CLIENT_SECRET=%s\n", clientSecret)
	fmt.Printf("GMAIL_REFRESH_TOKEN=%s\n", token.RefreshToken)
	fmt.Printf("GMAIL_USER_EMAIL=your-email@gmail.com\n")
}
