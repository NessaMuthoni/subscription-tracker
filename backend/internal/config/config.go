package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL    string
	JWTSecret      string
	GoogleClientID string
	GoogleSecret   string
	Port           string
	AIServiceURL   string
	SMTPHost       string
	SMTPPort       string
	SMTPUser       string
	SMTPPassword   string
	FrontendURL    string
	// Gmail OAuth2 settings
	GmailClientID     string
	GmailClientSecret string
	GmailRefreshToken string
	GmailEmail        string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		DatabaseURL:       getEnv("DATABASE_URL", "postgres://postgres:password@localhost:5432/subscription_tracker?sslmode=disable"),
		JWTSecret:         getEnv("JWT_SECRET", "your-secret-key"),
		GoogleClientID:    getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleSecret:      getEnv("GOOGLE_CLIENT_SECRET", ""),
		Port:              getEnv("PORT", "8080"),
		AIServiceURL:      getEnv("AI_SERVICE_URL", "http://localhost:8000"),
		SMTPHost:          getEnv("SMTP_HOST", ""),
		SMTPPort:          getEnv("SMTP_PORT", "587"),
		SMTPUser:          getEnv("SMTP_USER", ""),
		SMTPPassword:      getEnv("SMTP_PASSWORD", ""),
		FrontendURL:       getEnv("FRONTEND_URL", "http://localhost:3000"),
		GmailClientID:     getEnv("GMAIL_CLIENT_ID", ""),
		GmailClientSecret: getEnv("GMAIL_CLIENT_SECRET", ""),
		GmailRefreshToken: getEnv("GMAIL_REFRESH_TOKEN", ""),
		GmailEmail:        getEnv("GMAIL_EMAIL", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
