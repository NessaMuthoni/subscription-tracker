"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { paymentService } from "@/lib/payment-service"
import { useAuth } from "./auth-provider"
import { CreditCard, Smartphone, Wallet, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"

interface PaymentMethod {
  type: "mpesa" | "card" | "paypal"
  balance: number
  currency: string
  enabled: boolean
  lastChecked?: Date
  error?: string
}

export function PaymentBalanceChecker() {
  const { user, updateUser } = useAuth()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const paymentIcons = {
    mpesa: Smartphone,
    card: CreditCard,
    paypal: Wallet,
  }

  const paymentLabels = {
    mpesa: "M-Pesa",
    card: "Credit/Debit Card",
    paypal: "PayPal",
  }

  useEffect(() => {
    // Initialize payment methods from user preferences
    if (user?.preferences.paymentMethods) {
      const methods = user.preferences.paymentMethods.map((method) => ({
        type: method.type,
        balance: 0,
        currency: "USD",
        enabled: method.enabled,
      }))
      setPaymentMethods(methods)
    }
  }, [user])

  const checkAllBalances = async () => {
    if (!user?.preferences.budget.checkBalance) return

    setIsChecking(true)
    const updatedMethods = [...paymentMethods]

    for (let i = 0; i < updatedMethods.length; i++) {
      const method = updatedMethods[i]
      if (!method.enabled) continue

      try {
        let result
        switch (method.type) {
          case "mpesa":
            result = await paymentService.checkMpesaBalance("+254700000000")
            break
          case "card":
            result = await paymentService.checkCardBalance("card_token_123")
            break
          case "paypal":
            result = await paymentService.checkPayPalBalance("paypal_token_123")
            break
        }

        if (result.success) {
          updatedMethods[i] = {
            ...method,
            balance: result.balance,
            currency: result.currency,
            lastChecked: new Date(),
            error: undefined,
          }
        } else {
          updatedMethods[i] = {
            ...method,
            error: result.error,
            lastChecked: new Date(),
          }
        }
      } catch (error) {
        updatedMethods[i] = {
          ...method,
          error: "Failed to check balance",
          lastChecked: new Date(),
        }
      }
    }

    setPaymentMethods(updatedMethods)
    setLastCheck(new Date())
    setIsChecking(false)
  }

  const togglePaymentMethod = (type: "mpesa" | "card" | "paypal", enabled: boolean) => {
    const updatedMethods = paymentMethods.map((method) => (method.type === type ? { ...method, enabled } : method))
    setPaymentMethods(updatedMethods)

    // Update user preferences
    if (user) {
      const updatedPaymentMethods = user.preferences.paymentMethods.map((method) =>
        method.type === type ? { ...method, enabled } : method,
      )
      updateUser({
        ...user,
        preferences: {
          ...user.preferences,
          paymentMethods: updatedPaymentMethods,
        },
      })
    }
  }

  const toggleBalanceChecking = (enabled: boolean) => {
    if (user) {
      updateUser({
        ...user,
        preferences: {
          ...user.preferences,
          budget: {
            ...user.preferences.budget,
            checkBalance: enabled,
          },
        },
      })
    }
  }

  const totalBalance = paymentMethods
    .filter((method) => method.enabled && !method.error)
    .reduce((sum, method) => sum + method.balance, 0)

  const enabledMethods = paymentMethods.filter((method) => method.enabled)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Payment Balance Checker
        </CardTitle>
        <CardDescription>
          Monitor your payment method balances to ensure sufficient funds for subscriptions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Balance Checking */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Balance Checking</Label>
            <p className="text-sm text-muted-foreground">
              Automatically check payment method balances before subscription renewals
            </p>
          </div>
          <Switch checked={user?.preferences.budget.checkBalance || false} onCheckedChange={toggleBalanceChecking} />
        </div>

        {user?.preferences.budget.checkBalance && (
          <>
            {/* Payment Methods */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Payment Methods</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkAllBalances}
                  disabled={isChecking || enabledMethods.length === 0}
                >
                  {isChecking ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Check Balances
                </Button>
              </div>

              {paymentMethods.map((method) => {
                const Icon = paymentIcons[method.type]
                return (
                  <div key={method.type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{paymentLabels[method.type]}</p>
                        {method.enabled && method.lastChecked && (
                          <p className="text-xs text-muted-foreground">
                            Last checked: {method.lastChecked.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {method.enabled && (
                        <div className="text-right">
                          {method.error ? (
                            <div className="flex items-center gap-1 text-red-500">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="text-xs">Error</span>
                            </div>
                          ) : method.balance > 0 ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span className="text-sm font-medium">
                                {method.currency} {method.balance.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not checked</span>
                          )}
                        </div>
                      )}

                      <Switch
                        checked={method.enabled}
                        onCheckedChange={(enabled) => togglePaymentMethod(method.type, enabled)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Balance Summary */}
            {enabledMethods.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Available Balance</span>
                  <span className="text-lg font-bold text-green-600">${totalBalance.toFixed(2)}</span>
                </div>
                {lastCheck && (
                  <p className="text-xs text-muted-foreground mt-1">Last updated: {lastCheck.toLocaleString()}</p>
                )}
              </div>
            )}

            {/* Alerts */}
            {enabledMethods.some((method) => method.error) && (
              <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  Some payment methods failed to check. Please verify your account connections.
                </AlertDescription>
              </Alert>
            )}

            {enabledMethods.length === 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Enable at least one payment method to start monitoring balances.</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
