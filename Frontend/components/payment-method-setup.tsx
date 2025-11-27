"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { paymentService } from "@/lib/payment-service"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "./auth-provider"
import { CreditCard, Smartphone, Wallet, CheckCircle, AlertTriangle, Loader2, Trash2 } from "lucide-react"

export function PaymentMethodSetup() {
  const { user } = useAuth()
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<Record<string, "success" | "error" | null>>({})
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  // Fetch saved payment methods on mount
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const methods = await apiClient.getPaymentMethods()
        setSavedPaymentMethods(methods || [])
      } catch (error) {
        console.error('Failed to fetch payment methods:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPaymentMethods()
  }, [])

  // Normalize M-Pesa phone number to 9 digits
  const normalizePhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '')
    
    // If starts with 254, remove country code
    if (digits.startsWith('254')) {
      digits = digits.substring(3)
    }
    
    // If starts with 0, remove the leading 0
    if (digits.startsWith('0')) {
      digits = digits.substring(1)
    }
    
    // Return first 9 digits
    return digits.substring(0, 9)
  }

  const handleConnectPaymentMethod = async (method: "card" | "paypal" | "mpesa") => {
    setIsConnecting(method)
    setConnectionStatus({ ...connectionStatus, [method]: null })

    try {
      // Prepare payment method data based on type
      let paymentMethodData: any = { type: method }
      
      if (method === "mpesa") {
        const normalizedPhone = normalizePhoneNumber(paymentData.mpesa.phoneNumber)
        paymentMethodData.phone_number = normalizedPhone
      } else if (method === "paypal") {
        paymentMethodData.account_email = paymentData.paypal.email
      } else if (method === "card") {
        paymentMethodData.last4 = paymentData.card.number.slice(-4)
        paymentMethodData.brand = "Visa" // You might want to detect this
      }

      // Save to database via API
      const savedMethod = await apiClient.createPaymentMethod(paymentMethodData)

      // Update local state
      setSavedPaymentMethods([...savedPaymentMethods, savedMethod])
      
      setConnectionStatus({ ...connectionStatus, [method]: "success" })
      
      // Clear form
      setPaymentData({
        ...paymentData,
        [method]: method === "card" 
          ? { number: "", expiry: "", cvv: "", name: "" }
          : method === "paypal"
          ? { email: "" }
          : { phoneNumber: "" }
      })
    } catch (error) {
      console.error(`${method} connection failed:`, error)
      setConnectionStatus({ ...connectionStatus, [method]: "error" })
    } finally {
      setIsConnecting(null)
    }
  }

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await apiClient.deletePaymentMethod(id)
      setSavedPaymentMethods(savedPaymentMethods.filter(pm => pm.id !== id))
    } catch (error) {
      console.error('Failed to delete payment method:', error)
    }
  }

  const isMethodEnabled = (method: string) => {
    return savedPaymentMethods.some((pm) => pm.type === method)
  }

  const getSavedMethod = (method: string) => {
    return savedPaymentMethods.find((pm) => pm.type === method)
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Card</span>
            </TabsTrigger>
            <TabsTrigger value="mpesa" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">M-Pesa</span>
            </TabsTrigger>
            <TabsTrigger value="paypal" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">PayPal</span>
            </TabsTrigger>
            <TabsTrigger value="paystack" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Paystack</span>
            </TabsTrigger>
          </TabsList>

          {/* Credit/Debit Card */}
          <TabsContent value="card" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  value={paymentData.card.number}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      card: { ...paymentData.card, number: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="card-name">Cardholder Name</Label>
                <Input
                  id="card-name"
                  placeholder="John Doe"
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
                  type="password"
                  placeholder="123"
                  maxLength={4}
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

            {/* Show saved M-Pesa payment method */}
            {getSavedMethod("mpesa") && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-300 flex items-center justify-between">
                  <span>Connected: {getSavedMethod("mpesa")?.phone_number || getSavedMethod("mpesa")?.details?.phoneNumber}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePaymentMethod(getSavedMethod("mpesa")?.id)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

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

          {/* Paystack */}
          <TabsContent value="paystack" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paystack-email">Paystack Email</Label>
              <Input
                id="paystack-email"
                type="email"
                placeholder="Enter your Paystack account email"
                value={paymentData.paypal.email}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    paypal: { ...paymentData.paypal, email: e.target.value },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paystack-key">API Key (Optional)</Label>
              <Input
                id="paystack-key"
                type="password"
                placeholder="Enter your Paystack secret key"
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from your Paystack dashboard
              </p>
            </div>

            <Button
              onClick={() => handleConnectPaymentMethod("paypal")}
              disabled={isConnecting === "paypal" || isMethodEnabled("paystack")}
              className="w-full"
            >
              {isConnecting === "paypal" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : isMethodEnabled("paystack") ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Paystack Connected
                </>
              ) : (
                "Connect Paystack"
              )}
            </Button>

            {connectionStatus.paypal === "success" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Paystack connected successfully! Balance monitoring is now active.
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus.paypal === "error" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Failed to connect Paystack. Please check your details and try again.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
