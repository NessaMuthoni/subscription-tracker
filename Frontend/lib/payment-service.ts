// Payment service for checking account balances across different payment methods
export class PaymentService {
  private static instance: PaymentService

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService()
    }
    return PaymentService.instance
  }

  // Check M-Pesa balance using Daraja API
  async checkMpesaBalance(phoneNumber: string): Promise<{
    success: boolean
    balance: number
    currency: string
    error?: string
  }> {
    try {
      // Call backend API endpoint that handles M-Pesa Daraja API
      const response = await fetch('/api/payment/mpesa/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ phoneNumber }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check M-Pesa balance')
      }

      const data = await response.json()
      return {
        success: true,
        balance: data.balance,
        currency: data.currency || "KES",
      }
    } catch (error) {
      console.error('M-Pesa balance check failed:', error)
      return {
        success: false,
        balance: 0,
        currency: "KES",
        error: error instanceof Error ? error.message : "Failed to check M-Pesa balance",
      }
    }
  }

  // Check card balance via bank API
  async checkCardBalance(cardToken: string): Promise<{
    success: boolean
    balance: number
    currency: string
    cardLast4: string
    error?: string
  }> {
    try {
      // Call backend API endpoint that handles bank/card provider API
      const response = await fetch('/api/payment/card/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ cardToken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check card balance')
      }

      const data = await response.json()
      return {
        success: true,
        balance: data.balance,
        currency: data.currency || "KES",
        cardLast4: data.cardLast4 || "****",
      }
    } catch (error) {
      console.error('Card balance check failed:', error)
      return {
        success: false,
        balance: 0,
        currency: "KES",
        cardLast4: "",
        error: error instanceof Error ? error.message : "Failed to check card balance",
      }
    }
  }

  // Check PayPal balance via PayPal API
  async checkPayPalBalance(accessToken: string): Promise<{
    success: boolean
    balance: number
    currency: string
    error?: string
  }> {
    try {
      // Call backend API endpoint that handles PayPal API
      const response = await fetch('/api/payment/paypal/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ accessToken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check PayPal balance')
      }

      const data = await response.json()
      return {
        success: true,
        balance: data.balance,
        currency: data.currency || "KES",
      }
    } catch (error) {
      console.error('PayPal balance check failed:', error)
      return {
        success: false,
        balance: 0,
        currency: "KES",
        error: error instanceof Error ? error.message : "Failed to check PayPal balance",
      }
    }
  }

  // Check if user has sufficient funds for upcoming payments
  async checkSufficientFunds(
    upcomingPayments: Array<{ amount: number; date: string; name: string }>,
    paymentMethods: Array<{ type: "mpesa" | "card" | "paypal"; balance: number }>,
  ): Promise<{
    sufficient: boolean
    totalRequired: number
    totalAvailable: number
    shortfall: number
    recommendations: string[]
  }> {
    const totalRequired = upcomingPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalAvailable = paymentMethods.reduce((sum, method) => sum + method.balance, 0)
    const shortfall = Math.max(0, totalRequired - totalAvailable)

    const recommendations = []

    if (shortfall > 0) {
      recommendations.push(`Add KSh ${shortfall.toFixed(2)} to your payment methods`)
      recommendations.push("Consider canceling some subscriptions")
      recommendations.push("Switch to annual billing for discounts")
    } else {
      recommendations.push("You have sufficient funds for upcoming payments")
      recommendations.push("Consider setting up automatic payments")
    }

    return {
      sufficient: shortfall === 0,
      totalRequired,
      totalAvailable,
      shortfall,
      recommendations,
    }
  }
}

export const paymentService = PaymentService.getInstance()
