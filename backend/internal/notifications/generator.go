package notifications

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"subscription-tracker/internal/database"

	"github.com/google/uuid"
)

type NotificationGenerator struct {
	db                 *database.DB
	emailService       *EmailService
	gmailOAuth2Service *GmailOAuth2Service
}

func NewNotificationGenerator(db *database.DB, emailService *EmailService, gmailOAuth2Service *GmailOAuth2Service) *NotificationGenerator {
	return &NotificationGenerator{
		db:                 db,
		emailService:       emailService,
		gmailOAuth2Service: gmailOAuth2Service,
	}
}

// GenerateUpcomingPaymentNotifications checks for subscriptions due based on user preferences
func (ng *NotificationGenerator) GenerateUpcomingPaymentNotifications() error {
	log.Println("Checking for upcoming payment notifications...")

	// Get subscriptions with user preferences
	rows, err := ng.db.Query(`
		SELECT 
			s.id, s.user_id, s.name, s.price, s.billing_date, 
			u.email, u.name,
			COALESCE((u.preferences->'notifications'->>'days_before')::int, 3) as days_before,
			COALESCE((u.preferences->'notifications'->>'email_enabled')::boolean, true) as email_enabled,
			COALESCE((u.preferences->'notifications'->>'push_enabled')::boolean, true) as push_enabled
		FROM subscriptions s
		JOIN users u ON s.user_id = u.id
		WHERE s.status = 'active'
		AND s.billing_date = CURRENT_DATE + (COALESCE((u.preferences->'notifications'->>'days_before')::int, 3) || ' days')::interval
	`)
	if err != nil {
		return fmt.Errorf("failed to query subscriptions: %w", err)
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var subID, userID uuid.UUID
		var subName, userEmail string
		var userName sql.NullString
		var price float64
		var billingDate time.Time
		var daysBefore int
		var emailEnabled, pushEnabled bool

		err := rows.Scan(&subID, &userID, &subName, &price, &billingDate, &userEmail, &userName, &daysBefore, &emailEnabled, &pushEnabled)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}

		message := fmt.Sprintf("Payment reminder: %s (KSh %.2f) is due in %d days on %s",
			subName, price, daysBefore, billingDate.Format("Jan 02"))

		// Check if notification already exists (check ONCE before creating anything)
		var notificationExists bool
		err = ng.db.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM notifications 
				WHERE user_id = $1 
				AND title = $2 
				AND message = $3
				AND created_at > NOW() - INTERVAL '24 hours'
			)
		`, userID, "Payment Reminder", message).Scan(&notificationExists)

		if err != nil {
			log.Printf("Error checking notification duplicate: %v", err)
			continue
		}

		// Skip if notification already exists (means email was already sent too)
		if notificationExists {
			log.Printf("Notification already exists for %s in last 24 hours, skipping", subName)
			continue
		}

		// Send email notification FIRST if email is enabled
		if emailEnabled {
			if ng.gmailOAuth2Service != nil {
				err = ng.gmailOAuth2Service.SendPaymentReminder(userEmail, subName, price, daysBefore)
				if err != nil {
					log.Printf("Failed to send Gmail OAuth2 email: %v", err)
				} else {
					log.Printf("✓ Email sent to %s for %s", userEmail, subName)
				}
			} else if ng.emailService != nil {
				err = ng.emailService.SendPaymentReminder(userEmail, subName, price, daysBefore)
				if err != nil {
					log.Printf("Error sending email to %s: %v", userEmail, err)
				} else {
					log.Printf("✓ Email sent to %s for %s", userEmail, subName)
				}
			}
		}

		// Create in-app notification AFTER email if push is enabled
		if pushEnabled {
			err = ng.createNotification(userID, "Payment Reminder", message, "payment", "medium")
			if err != nil {
				log.Printf("Error creating notification for user %s: %v", userID, err)
				continue
			}
		}

		count++
	}

	log.Printf("Generated %d payment reminder notifications", count)
	return nil
}

// GenerateBudgetAlerts checks if users are approaching their budget limit
func (ng *NotificationGenerator) GenerateBudgetAlerts() error {
	log.Println("Checking for budget alerts...")

	// Get users whose spending is >= 90% of their budget with preferences
	rows, err := ng.db.Query(`
		WITH user_spending AS (
			SELECT 
				s.user_id,
				SUM(s.price) as total_spending
			FROM subscriptions s
			WHERE s.status = 'active'
			GROUP BY s.user_id
		)
		SELECT 
			b.user_id, 
			b.amount as budget_amount, 
			COALESCE(us.total_spending, 0) as current_spending,
			u.email,
			u.name,
			COALESCE((u.preferences->'notifications'->>'email_enabled')::boolean, true) as email_enabled,
			COALESCE((u.preferences->'notifications'->>'push_enabled')::boolean, true) as push_enabled
		FROM budgets b
		LEFT JOIN user_spending us ON b.user_id = us.user_id
		JOIN users u ON b.user_id = u.id
		WHERE b.period = 'monthly'
		AND COALESCE(us.total_spending, 0) >= (b.amount * 0.9)
	`)
	if err != nil {
		return fmt.Errorf("failed to query budgets: %w", err)
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var userID uuid.UUID
		var budgetAmount, currentSpending float64
		var userEmail string
		var userName sql.NullString
		var emailEnabled, pushEnabled bool

		err := rows.Scan(&userID, &budgetAmount, &currentSpending, &userEmail, &userName, &emailEnabled, &pushEnabled)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}

		percentage := (currentSpending / budgetAmount) * 100

		// Create in-app notification if push is enabled
		if pushEnabled {
			message := fmt.Sprintf("Budget alert: You've used %.1f%% of your monthly budget (KSh %.2f / KSh %.2f)",
				percentage, currentSpending, budgetAmount)

			priority := "medium"
			if currentSpending >= budgetAmount {
				priority = "high"
			}

			err = ng.createNotification(userID, "Budget Alert", message, "budget", priority)
			if err != nil {
				log.Printf("Error creating notification for user %s: %v", userID, err)
				continue
			}
		}

		// Send email notification if email is enabled
		if emailEnabled {
			if ng.gmailOAuth2Service != nil {
				err = ng.gmailOAuth2Service.SendBudgetAlert(userEmail, currentSpending, budgetAmount)
				if err != nil {
					log.Printf("Failed to send Gmail OAuth2 email: %v", err)
				}
			} else if ng.emailService != nil {
				err = ng.emailService.SendBudgetAlert(userEmail, currentSpending, budgetAmount)
				if err != nil {
					log.Printf("Error sending email to %s: %v", userEmail, err)
				}
			}
		}

		count++
	}

	log.Printf("Generated %d budget alert notifications", count)
	return nil
}

// createNotification inserts a notification into the database
func (ng *NotificationGenerator) createNotification(userID uuid.UUID, title, message, notifType, priority string) error {
	// Check if similar notification already exists in the last 24 hours
	// Include message in check to allow multiple payment reminders for different subscriptions
	log.Printf("Checking duplicate for: title='%s', message='%s'", title, message)

	var exists bool
	err := ng.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM notifications 
			WHERE user_id = $1 
			AND title = $2 
			AND message = $3
			AND created_at > NOW() - INTERVAL '24 hours'
		)
	`, userID, title, message).Scan(&exists)

	if err != nil {
		return err
	}

	log.Printf("Duplicate check result: exists=%v", exists)

	if exists {
		log.Printf("Notification already exists for user %s: %s - %s", userID, title, message)
		return nil
	}

	log.Printf("Creating notification: %s - %s", title, message)

	// Insert new notification
	_, err = ng.db.Exec(`
		INSERT INTO notifications (id, user_id, title, message, type, priority, read, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
	`, uuid.New(), userID, title, message, notifType, priority)

	if err != nil {
		return fmt.Errorf("failed to insert notification: %w", err)
	}

	return nil
}

// StartScheduler starts a background scheduler to generate notifications periodically
func (ng *NotificationGenerator) StartScheduler() {
	ticker := time.NewTicker(1 * time.Hour) // Check every hour
	go func() {
		// Run immediately on start
		ng.GenerateUpcomingPaymentNotifications()
		ng.GenerateBudgetAlerts()

		for range ticker.C {
			log.Println("Running scheduled notification generation...")
			ng.GenerateUpcomingPaymentNotifications()
			ng.GenerateBudgetAlerts()
		}
	}()
	log.Println("Notification scheduler started (checks every hour)")
}

// RegenerateNotificationsForSubscription clears old notifications and generates new ones for a subscription
func (ng *NotificationGenerator) RegenerateNotificationsForSubscription(subscriptionID uuid.UUID) error {
	log.Printf("Regenerating notifications for subscription %s", subscriptionID)

	// Delete old unread payment reminder notifications for this subscription
	_, err := ng.db.Exec(`
		DELETE FROM notifications 
		WHERE user_id IN (SELECT user_id FROM subscriptions WHERE id = $1)
		AND title = 'Payment Reminder'
		AND message LIKE '%' || (SELECT name FROM subscriptions WHERE id = $1) || '%'
		AND read = false
		AND created_at > NOW() - INTERVAL '30 days'
	`, subscriptionID)

	if err != nil {
		log.Printf("Error deleting old notifications for subscription %s: %v", subscriptionID, err)
		return fmt.Errorf("failed to delete old notifications: %w", err)
	}

	// Trigger immediate notification generation for all subscriptions
	go func() {
		time.Sleep(2 * time.Second) // Wait a bit for DB to settle
		ng.GenerateUpcomingPaymentNotifications()
	}()

	return nil
}
