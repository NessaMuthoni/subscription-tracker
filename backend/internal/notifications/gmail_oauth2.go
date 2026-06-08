package notifications

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

type GmailOAuth2Service struct {
	service *gmail.Service
	email   string
}

func NewGmailOAuth2Service(clientID, clientSecret, refreshToken, userEmail string) (*GmailOAuth2Service, error) {
	config := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint:     google.Endpoint,
		Scopes:       []string{gmail.GmailSendScope},
	}

	token := &oauth2.Token{
		RefreshToken: refreshToken,
	}

	ctx := context.Background()
	client := config.Client(ctx, token)

	srv, err := gmail.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("unable to create Gmail service: %w", err)
	}

	log.Println("✓ Gmail OAuth2 service initialized")
	return &GmailOAuth2Service{
		service: srv,
		email:   userEmail,
	}, nil
}

func (g *GmailOAuth2Service) SendEmail(to, subject, htmlBody string) error {
	if g.service == nil {
		log.Println("Gmail OAuth2 not configured, skipping email")
		return nil
	}

	var message gmail.Message

	emailContent := fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/html; charset=UTF-8\r\n\r\n"+
		"%s", g.email, to, subject, htmlBody)

	message.Raw = base64.URLEncoding.EncodeToString([]byte(emailContent))

	_, err := g.service.Users.Messages.Send("me", &message).Do()
	if err != nil {
		return fmt.Errorf("failed to send email via Gmail API: %w", err)
	}

	log.Printf("✓ Email sent via Gmail OAuth2 to: %s", to)
	return nil
}

func (g *GmailOAuth2Service) SendPaymentReminder(to, subscriptionName string, amount float64, daysUntil int) error {
	subject := fmt.Sprintf("Payment Reminder: %s due in %d days", subscriptionName, daysUntil)

	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
				<h2 style="color: #4F46E5;">💳 Payment Reminder</h2>
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
				</p>
			</div>
		</body>
		</html>
	`, subscriptionName, amount, daysUntil)

	return g.SendEmail(to, subject, body)
}

func (g *GmailOAuth2Service) SendBudgetAlert(to string, currentSpending, budget float64) error {
	percentage := (currentSpending / budget) * 100
	subject := "⚠️ Budget Alert: You're approaching your limit"

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
			</div>
		</body>
		</html>
	`, currentSpending, budget, percentage)

	return g.SendEmail(to, subject, body)
}
