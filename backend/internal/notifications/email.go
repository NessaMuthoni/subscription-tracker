package notifications

import (
	"fmt"
	"net/smtp"
	"strings"
)

type EmailService struct {
	smtpHost     string
	smtpPort     string
	smtpUser     string
	smtpPassword string
	fromEmail    string
}

func NewEmailService(host, port, user, password string) *EmailService {
	return &EmailService{
		smtpHost:     host,
		smtpPort:     port,
		smtpUser:     user,
		smtpPassword: password,
		fromEmail:    user,
	}
}

func (e *EmailService) SendEmail(to, subject, body string) error {
	// Skip if SMTP is not configured
	if e.smtpHost == "" || e.smtpUser == "" {
		fmt.Println("SMTP not configured, skipping email to:", to)
		return nil
	}

	// Compose message
	msg := []byte(fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/html; charset=UTF-8\r\n"+
		"\r\n"+
		"%s\r\n", e.fromEmail, to, subject, body))

	// Authenticate
	auth := smtp.PlainAuth("", e.smtpUser, e.smtpPassword, e.smtpHost)

	// Send email
	addr := fmt.Sprintf("%s:%s", e.smtpHost, e.smtpPort)
	err := smtp.SendMail(addr, auth, e.fromEmail, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	fmt.Printf("Email sent to %s: %s\n", to, subject)
	return nil
}

func (e *EmailService) SendPaymentReminder(to, subscriptionName string, amount float64, daysUntil int) error {
	subject := fmt.Sprintf("Payment Reminder: %s due in %d days", subscriptionName, daysUntil)

	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
				<h2 style="color: #4F46E5;">Payment Reminder</h2>
				<p>Hello,</p>
				<p>This is a friendly reminder that your subscription payment is coming up:</p>
				<div style="background-color: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0;">
					<p style="margin: 5px 0;"><strong>Subscription:</strong> %s</p>
					<p style="margin: 5px 0;"><strong>Amount:</strong> KSh %.2f</p>
					<p style="margin: 5px 0;"><strong>Due in:</strong> %d days</p>
				</div>
				<p>Make sure you have sufficient funds in your payment method to avoid service interruption.</p>
				<p style="margin-top: 30px;">
					<a href="http://localhost:3000/subscriptions" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
						View Subscriptions
					</a>
				</p>
				<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
				<p style="font-size: 12px; color: #666;">
					This is an automated message from Subscription Tracker. 
					<br>To manage your notification preferences, visit your settings.
				</p>
			</div>
		</body>
		</html>
	`, subscriptionName, amount, daysUntil)

	return e.SendEmail(to, subject, body)
}

func (e *EmailService) SendBudgetAlert(to string, currentSpending, budget float64) error {
	percentage := (currentSpending / budget) * 100
	subject := "Budget Alert: You're approaching your limit"

	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
				<h2 style="color: #DC2626;">⚠️ Budget Alert</h2>
				<p>Hello,</p>
				<p>Your subscription spending is approaching your budget limit:</p>
				<div style="background-color: #FEF2F2; padding: 15px; border-radius: 6px; margin: 20px 0;">
					<p style="margin: 5px 0;"><strong>Current Spending:</strong> KSh %.2f</p>
					<p style="margin: 5px 0;"><strong>Budget:</strong> KSh %.2f</p>
					<p style="margin: 5px 0;"><strong>Usage:</strong> %.1f%%</p>
				</div>
				<p>Consider reviewing your subscriptions to avoid exceeding your budget.</p>
				<p style="margin-top: 30px;">
					<a href="http://localhost:3000/budget" style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
						Review Budget
					</a>
				</p>
				<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
				<p style="font-size: 12px; color: #666;">
					This is an automated message from Subscription Tracker.
				</p>
			</div>
		</body>
		</html>
	`, currentSpending, budget, percentage)

	return e.SendEmail(to, subject, body)
}

func (e *EmailService) SendWelcomeEmail(to, name string) error {
	subject := "Welcome to Subscription Tracker!"

	userName := name
	if userName == "" {
		userName = strings.Split(to, "@")[0]
	}

	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
				<h2 style="color: #4F46E5;">Welcome to Subscription Tracker! 🎉</h2>
				<p>Hello %s,</p>
				<p>Thank you for joining Subscription Tracker! We're excited to help you take control of your subscription expenses.</p>
				<div style="background-color: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0;">
					<h3 style="margin-top: 0;">Get Started:</h3>
					<ul style="padding-left: 20px;">
						<li>Add your first subscription</li>
						<li>Set up your monthly budget</li>
						<li>Enable payment reminders</li>
						<li>Explore AI-powered insights</li>
					</ul>
				</div>
				<p style="margin-top: 30px;">
					<a href="http://localhost:3000/subscriptions/add" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
						Add Your First Subscription
					</a>
				</p>
				<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
				<p style="font-size: 12px; color: #666;">
					Need help? Visit our dashboard or contact support.
				</p>
			</div>
		</body>
		</html>
	`, userName)

	return e.SendEmail(to, subject, body)
}
