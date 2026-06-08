import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/auth/signup">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign Up
          </Button>
        </Link>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-3xl text-foreground">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: February 13, 2026</p>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
              <p>
                Welcome to Subscription Tracker. We respect your privacy and are committed to protecting your personal 
                data. This privacy policy will inform you about how we look after your personal data when you visit 
                our application and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
              <p>We collect and process the following types of information:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  <strong>Account Information:</strong> Name, email address, and password when you create an account
                </li>
                <li>
                  <strong>Subscription Data:</strong> Subscription names, prices, billing dates, categories, and payment methods you enter
                </li>
                <li>
                  <strong>Payment Information:</strong> Payment method details (we do not store full card numbers or sensitive payment data)
                </li>
                <li>
                  <strong>Budget Information:</strong> Monthly budget limits and spending preferences
                </li>
                <li>
                  <strong>Usage Data:</strong> Information about how you use our service, including access times and features used
                </li>
                <li>
                  <strong>Google Calendar Integration:</strong> If you connect your Google Calendar, we access calendar data solely to create subscription reminders
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
              <p>We use your information for the following purposes:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>To provide and maintain our subscription tracking service</li>
                <li>To process payments through integrated payment providers</li>
                <li>To send notifications about upcoming subscription payments</li>
                <li>To provide budget alerts and spending analytics</li>
                <li>To improve and personalize your experience</li>
                <li>To communicate with you about service updates</li>
                <li>To detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Storage and Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal data:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>All data is stored in secure, encrypted databases</li>
                <li>Passwords are hashed using industry-standard encryption</li>
                <li>We use HTTPS/TLS encryption for all data transmission</li>
                <li>Access to personal data is restricted to authorized personnel only</li>
                <li>Regular security audits and updates are performed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Third-Party Services</h2>
              <p>We integrate with the following third-party services:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  <strong>M-Pesa (Safaricom):</strong> For mobile money payments. Subject to Safaricom's privacy policy
                </li>
                <li>
                  <strong>Paystack:</strong> For card payments. Subject to Paystack's privacy policy
                </li>
                <li>
                  <strong>Google OAuth & Calendar:</strong> For authentication and calendar integration. Subject to Google's privacy policy
                </li>
              </ul>
              <p className="mt-2">
                These services have their own privacy policies. We do not control and are not responsible for their 
                privacy practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Sharing</h2>
              <p>
                We do not sell your personal data. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>With your explicit consent</li>
                <li>With payment processors to complete transactions</li>
                <li>When required by law or to protect our legal rights</li>
                <li>In connection with a business transfer (merger, acquisition, etc.)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
              <p>Under data protection laws, you have the following rights:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Right to Access:</strong> Request copies of your personal data</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Restrict Processing:</strong> Request limitation of data processing</li>
                <li><strong>Right to Data Portability:</strong> Request transfer of your data</li>
                <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
              </ul>
              <p className="mt-2">
                To exercise any of these rights, please contact us at privacy@subscriptiontracker.com
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Data Retention</h2>
              <p>
                We retain your personal data only for as long as necessary to provide our services and comply with 
                legal obligations. When you delete your account, we will delete or anonymize your personal data within 
                30 days, except where we are required to retain it by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Cookies and Tracking</h2>
              <p>
                We use essential cookies and local storage to maintain your session and preferences. We do not use 
                third-party tracking or advertising cookies. You can control cookie settings through your browser.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Children's Privacy</h2>
              <p>
                Our service is not intended for users under the age of 18. We do not knowingly collect personal data 
                from children. If you become aware that a child has provided us with personal data, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">11. International Data Transfers</h2>
              <p>
                Your data may be transferred to and processed in countries other than your country of residence. 
                We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">12. Changes to This Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the 
                new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this 
                Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">13. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <ul className="list-none mt-2 space-y-1">
                <li>Email: privacy@subscriptiontracker.com</li>
                <li>Support: support@subscriptiontracker.com</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
