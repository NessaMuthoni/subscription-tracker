import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsOfServicePage() {
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
            <CardTitle className="text-3xl text-foreground">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: February 13, 2026</p>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Subscription Tracker, you accept and agree to be bound by the terms and 
                provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Use License</h2>
              <p>
                Permission is granted to temporarily access and use Subscription Tracker for personal, 
                non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained in Subscription Tracker</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. User Account</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to 
                accept responsibility for all activities that occur under your account. You must notify us immediately 
                of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Payment Processing</h2>
              <p>
                Our service integrates with third-party payment processors (M-Pesa and Paystack). By using payment features:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>You authorize us to initiate payments on your behalf</li>
                <li>You agree to the terms of service of the payment processors</li>
                <li>You understand that payment processing is subject to the policies of third-party providers</li>
                <li>We are not responsible for payment processing failures caused by third-party services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Subscription Data</h2>
              <p>
                You retain ownership of all subscription data you enter into the system. We collect and store 
                subscription information solely for the purpose of providing our tracking and management services. 
                We do not sell or share your subscription data with third parties except as necessary to provide our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Budget Management</h2>
              <p>
                Our budget cap feature is designed to help you manage spending. However:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Budget alerts are advisory only and do not guarantee prevention of all overspending</li>
                <li>You are responsible for managing your subscriptions and payments</li>
                <li>We are not liable for any financial consequences of subscription management</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Disclaimer</h2>
              <p>
                The materials on Subscription Tracker are provided on an 'as is' basis. We make no warranties, 
                expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, 
                implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
                of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Limitations</h2>
              <p>
                In no event shall Subscription Tracker or its suppliers be liable for any damages (including, without 
                limitation, damages for loss of data or profit, or due to business interruption) arising out of the use 
                or inability to use the materials on Subscription Tracker, even if we or an authorized representative 
                has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Service Modifications</h2>
              <p>
                We reserve the right to modify or discontinue, temporarily or permanently, the service (or any part 
                thereof) with or without notice. We shall not be liable to you or to any third party for any modification, 
                suspension or discontinuance of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of Kenya, 
                and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">11. Changes to Terms</h2>
              <p>
                We reserve the right to update or change our Terms of Service at any time. We will notify you of 
                any changes by posting the new Terms of Service on this page. You are advised to review this Terms 
                of Service periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">12. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at support@subscriptiontracker.com
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
