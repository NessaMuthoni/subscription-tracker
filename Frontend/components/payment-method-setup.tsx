"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { paymentService } from "@/lib/payment-service"
import { useAuth } from "./auth-provider"
import { CreditCard, Smartphone, Wallet, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"

export function PaymentMethodSetup() {
  const { user, updateUser } = useAuth()
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<Record<string, "success" | "error" | null>>({})

  const [paymentData, setPaymentData] = useState({
    card: {
      number: "",
      expiry: "",
      cvv: "",
      name: "",
    },
    paypal: {
      email: "",
    },
    mpesa: {
      phoneNumber: "",
    },
  })

  const handleConnectPaymentMethod = async (method: "card" | "paypal" | "mpesa") => {
    setIsConnecting(method)
    setConnectionStatus({ ...connectionStatus, [method]: null })

    try {
      let result
      switch (method) {
        case "card":
          // Validate card details and connect
          result = await paymentService.checkCardBalance(paymentData.card.number)
          break
        case "paypal":
          // Connect PayPal account
          result = await paymentService.checkPayPalBalance(paymentData.paypal.email)
          break
        case "mpesa":
          // Simulate M-Pesa connection
          result = await paymentService.checkMpesaBalance(paymentData.mpesa.phoneNumber)
          break
      }

      if (result.success) {
        // Update user preferences
        if (user?.preferences?.paymentMethods) {
          const updatedPaymentMethods = user.preferences.paymentMethods.map((pm) =>
            pm.type === method ? { ...pm, enabled: true, details: paymentData[method] } : pm,
          )

          const defaultPreferences = {
            notifications: { email: true, push: true, sms: false, reminderDays: 3 },
            budget: { monthly: 30000, currency: "KES", checkBalance: false },
            ai: { categorization: true, predictions: true, recommendations: true },
            calendar: { googleSync: false },
            paymentMethods: []
          }

          updateUser({
            ...user,
            preferences: {
              ...defaultPreferences,
              ...user.preferences,
              paymentMethods: updatedPaymentMethods,
            },
          })
        }

        setConnectionStatus({ ...connectionStatus, [method]: "success" })
      } else {
        setConnectionStatus({ ...connectionStatus, [method]: "error" })
      }
    } catch (error) {
      console.error(`${method} connection failed:`, error)
      setConnectionStatus({ ...connectionStatus, [method]: "error" })
    } finally {
      setIsConnecting(null)
    }
  }

  const isMethodEnabled = (method: string) => {
    return user?.preferences?.paymentMethods?.find((pm) => pm.type === method)?.enabled || false
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>
          Connect your payment methods to monitor balances and ensure sufficient funds for subscriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="card" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card
            </TabsTrigger>
            <TabsTrigger value="paypal" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              PayPal
            </TabsTrigger>
            <TabsTrigger value="mpesa" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              M-Pesa
            </TabsTrigger>
          </TabsList>

          {/* Credit/Debit Card */}
          <TabsContent value="card" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  placeholder="Enter your card number"
                  value={paymentData.card.number}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      card: { ...paymentData.card, number: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-name">Cardholder Name</Label>
                <Input
                  id="card-name"
                  placeholder="Enter cardholder name"
                  value={paymentData.card.name}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      card: { ...paymentData.card, name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-expiry">Expiry Date</Label>
                <Input
                  id="card-expiry"
                  placeholder="MM/YY"
                  value={paymentData.card.expiry}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      card: { ...paymentData.card, expiry: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-cvv">CVV</Label>
                <Input
                  id="card-cvv"
                  placeholder="CVV"
                  value={paymentData.card.cvv}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      card: { ...paymentData.card, cvv: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <Button
              onClick={() => handleConnectPaymentMethod("card")}
              disabled={isConnecting === "card" || isMethodEnabled("card")}
              className="w-full"
            >
              {isConnecting === "card" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : isMethodEnabled("card") ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Card Connected
                </>
              ) : (
                "Connect Card"
              )}
            </Button>

            {connectionStatus.card === "success" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Card connected successfully! Balance monitoring is now active.
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus.card === "error" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Failed to connect card. Please check your details and try again.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* PayPal */}
          <TabsContent value="paypal" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paypal-email">PayPal Email</Label>
              <Input
                id="paypal-email"
                type="email"
                placeholder="Enter your PayPal email address"
                value={paymentData.paypal.email}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    paypal: { ...paymentData.paypal, email: e.target.value },
                  })
                }
              />
            </div>

            <Button
              onClick={() => handleConnectPaymentMethod("paypal")}
              disabled={isConnecting === "paypal" || isMethodEnabled("paypal")}
              className="w-full"
            >
              {isConnecting === "paypal" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : isMethodEnabled("paypal") ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  PayPal Connected
                </>
              ) : (
                "Connect PayPal"
              )}
            </Button>

            {connectionStatus.paypal === "success" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  PayPal connected successfully! Balance monitoring is now active.
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus.paypal === "error" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Failed to connect PayPal. Please check your email and try again.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* M-Pesa */}
          <TabsContent value="mpesa" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mpesa-phone">Phone Number</Label>
              <Input
                id="mpesa-phone"
                placeholder="Enter your M-Pesa phone number"
                value={paymentData.mpesa.phoneNumber}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    mpesa: { ...paymentData.mpesa, phoneNumber: e.target.value },
                  })
                }
              />
            </div>

            <Button
              onClick={() => handleConnectPaymentMethod("mpesa")}
              disabled={isConnecting === "mpesa" || isMethodEnabled("mpesa")}
              className="w-full"
            >
              {isConnecting === "mpesa" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : isMethodEnabled("mpesa") ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  M-Pesa Connected
                </>
              ) : (
                "Connect M-Pesa"
              )}
            </Button>

            {connectionStatus.mpesa === "success" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  M-Pesa connected successfully! Balance monitoring is now active.
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus.mpesa === "error" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Failed to connect M-Pesa. Please check your phone number and try again.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
