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
      // Format phone number to 254XXXXXXXXX format (required by M-Pesa API)
      const formattedPhone = this.formatMpesaPhoneNumber(phoneNumber)
      
      // Call backend API endpoint that handles M-Pesa Daraja API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const response = await fetch(`${apiUrl}/payment/mpesa/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
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

  // Format phone number to M-Pesa format (254XXXXXXXXX)
  private formatMpesaPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let digits = phoneNumber.replace(/\D/g, '')
    
    // If starts with 0, replace with 254
    if (digits.startsWith('0')) {
      digits = '254' + digits.substring(1)
    }
    
    // If doesn't start with 254, prepend it
    if (!digits.startsWith('254')) {
      digits = '254' + digits
    }
    
    return digits
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const response = await fetch(`${apiUrl}/payment/card/balance`, {
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const response = await fetch(`${apiUrl}/payment/paypal/balance`, {
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

  // Initiate M-Pesa STK Push for subscription payment
  async initiateMpesaPayment(phoneNumber: string, amount: number, subscriptionName: string): Promise<{
    success: boolean
    message: string
    checkoutRequestId?: string
    error?: string
  }> {
    try {
      const formattedPhone = this.formatMpesaPhoneNumber(phoneNumber)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      
      const response = await fetch(`${apiUrl}/payment/mpesa/stk-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          amount: Math.round(amount), // M-Pesa requires whole numbers
          accountReference: subscriptionName,
          transactionDesc: `Payment for ${subscriptionName} subscription`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to initiate M-Pesa payment')
      }

      const data = await response.json()
      return {
        success: true,
        message: data.message || 'Payment request sent! Please check your phone to complete the transaction.',
        checkoutRequestId: data.checkoutRequestId,
      }
    } catch (error) {
      console.error('M-Pesa STK Push failed:', error)
      return {
        success: false,
        message: 'Failed to initiate payment',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }
}

export const paymentService = PaymentService.getInstance()
