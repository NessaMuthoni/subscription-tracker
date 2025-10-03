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

  // Check M-Pesa balance
  async checkMpesaBalance(phoneNumber: string): Promise<{
    success: boolean
    balance: number
    currency: string
    error?: string
  }> {
    try {
      // Simulate M-Pesa API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock response
      return {
        success: true,
        balance: 2500.5,
        currency: "KES",
      }
    } catch (error) {
      return {
        success: false,
        balance: 0,
        currency: "KES",
        error: "Failed to check M-Pesa balance",
      }
    }
  }

  // Check card balance
  async checkCardBalance(cardToken: string): Promise<{
    success: boolean
    balance: number
    currency: string
    cardLast4: string
    error?: string
  }> {
    try {
      // Simulate bank API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return {
        success: true,
        balance: 1250.75,
        currency: "USD",
        cardLast4: "4532",
      }
    } catch (error) {
      return {
        success: false,
        balance: 0,
        currency: "USD",
        cardLast4: "",
        error: "Failed to check card balance",
      }
    }
  }

  // Check PayPal balance
  async checkPayPalBalance(accessToken: string): Promise<{
    success: boolean
    balance: number
    currency: string
    error?: string
  }> {
    try {
      // Simulate PayPal API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      return {
        success: true,
        balance: 890.25,
        currency: "USD",
      }
    } catch (error) {
      return {
        success: false,
        balance: 0,
        currency: "USD",
        error: "Failed to check PayPal balance",
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
      recommendations.push(`Add $${shortfall.toFixed(2)} to your payment methods`)
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
