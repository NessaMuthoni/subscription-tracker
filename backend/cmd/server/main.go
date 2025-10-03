package main

import (
	"log"

	"subscription-tracker/internal/config"
	"subscription-tracker/internal/database"
	"subscription-tracker/internal/handlers"
	"subscription-tracker/internal/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg.JWTSecret)
	userHandler := handlers.NewUserHandler(db)
	subscriptionHandler := handlers.NewSubscriptionHandler(db)
	paymentHandler := handlers.NewPaymentHandler(db)
	analyticsHandler := handlers.NewAnalyticsHandler(db)
	notificationHandler := handlers.NewNotificationHandler(db)
	budgetHandler := handlers.NewBudgetHandler(db)
	calendarHandler := handlers.NewCalendarHandler(db)

	// Setup Gin router
	r := gin.Default()

	// Add middleware
	r.Use(middleware.CORSMiddleware())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := r.Group("/api")

	// Auth routes (public)
	auth := api.Group("/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/signup", authHandler.Signup)
		auth.POST("/logout", authHandler.Logout)
		auth.POST("/google", authHandler.GoogleAuth)
		auth.POST("/forgot-password", authHandler.ForgotPassword)
		auth.POST("/reset-password", authHandler.ResetPassword)
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))

	// User routes
	user := protected.Group("/user")
	{
		user.GET("/me", userHandler.GetMe)
		user.PATCH("/me", userHandler.UpdateMe)
	}

	// Subscription routes
	subscriptions := protected.Group("/subscriptions")
	{
		subscriptions.GET("", subscriptionHandler.GetSubscriptions)
		subscriptions.POST("", subscriptionHandler.CreateSubscription)
		subscriptions.GET("/:id", subscriptionHandler.GetSubscription)
		subscriptions.PATCH("/:id", subscriptionHandler.UpdateSubscription)
		subscriptions.DELETE("/:id", subscriptionHandler.DeleteSubscription)
	}

	// Payment method routes
	paymentMethods := protected.Group("/payment-methods")
	{
		paymentMethods.GET("", paymentHandler.GetPaymentMethods)
		paymentMethods.POST("", paymentHandler.CreatePaymentMethod)
		paymentMethods.DELETE("/:id", paymentHandler.DeletePaymentMethod)
	}

	// Analytics routes
	analytics := protected.Group("/analytics")
	{
		analytics.GET("/summary", analyticsHandler.GetSummary)
	}

	// Notification routes
	notifications := protected.Group("/notifications")
	{
		notifications.GET("", notificationHandler.GetNotifications)
		notifications.PATCH("/:id", notificationHandler.MarkAsRead)
	}

	// Budget routes
	budget := protected.Group("/budget")
	{
		budget.GET("", budgetHandler.GetBudget)
		budget.POST("", budgetHandler.CreateBudget)
	}

	// Calendar routes
	calendar := protected.Group("/calendar")
	{
		calendar.GET("/events", calendarHandler.GetEvents)
	}

	// Start server
	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}