import { apiClient } from "./api-client"

// Google Calendar integration for syncing subscription reminders
export class GoogleCalendarService {
  private static instance: GoogleCalendarService
  private isConnected: boolean = false

  private constructor() {}

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService()
    }
    return GoogleCalendarService.instance
  }

  /**
   * Initiates Google OAuth flow
   * Opens popup window for user to authorize access
   */
  async connectGoogleCalendar(): Promise<boolean> {
    try {
      // Get OAuth URL from backend
      const token = localStorage.getItem("auth_token")
      if (!token) {
        throw new Error("Not authenticated. Please log in first.")
      }

      const response = await fetch("http://localhost:8080/api/calendar/google/auth-url", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to get OAuth URL")
      }

      const data = await response.json()
      const authUrl = data.authUrl

      // Open OAuth popup
      const popup = window.open(
        authUrl,
        "Google Calendar Authorization",
        "width=600,height=700,left=200,top=100"
      )

      // Wait for OAuth callback
      return new Promise((resolve) => {
        const interval = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(interval)
            // Check if connection was successful
            const connected = await this.checkConnectionStatus()
            this.isConnected = connected
            resolve(connected)
          }
        }, 500)
      })
    } catch (error) {
      console.error("Failed to connect Google Calendar:", error)
      return false
    }
  }

  /**
   * Checks if user has connected Google Calendar
   */
  async checkConnectionStatus(): Promise<boolean> {
    try {
      const user = await apiClient.getCurrentUser()
      this.isConnected = user.preferences?.calendar?.googleSync === true
      return this.isConnected
    } catch (error) {
      console.error("Failed to check Google Calendar status:", error)
      return false
    }
  }

  /**
   * Disconnects Google Calendar integration
   */
  async disconnectGoogleCalendar(): Promise<boolean> {
    try {
      const response = await fetch("http://localhost:8080/api/calendar/google/disconnect", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to disconnect Google Calendar")
      }

      this.isConnected = false
      return true
    } catch (error) {
      console.error("Failed to disconnect Google Calendar:", error)
      return false
    }
  }

  /**
   * Creates a calendar event for a subscription
   */
  async createCalendarEvent(subscription: {
    name: string
    cost: number
    nextPayment: string
    description?: string
  }): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      // Check if connected first
      if (!this.isConnected) {
        const connected = await this.checkConnectionStatus()
        if (!connected) {
          return {
            success: false,
            error: "Google Calendar not connected. Please connect in Settings.",
          }
        }
      }

      const response = await fetch("http://localhost:8080/api/calendar/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          subscription_name: subscription.name,
          amount: subscription.cost,
          billing_date: subscription.nextPayment,
          description: subscription.description || "",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create calendar event")
      }

      const data = await response.json()
      return {
        success: true,
        eventId: data.eventId,
      }
    } catch (error: any) {
      console.error("Failed to create calendar event:", error)
      return {
        success: false,
        error: error.message || "Failed to create calendar event",
      }
    }
  }

  /**
   * Syncs all subscriptions to Google Calendar
   */
  async syncSubscriptionReminders(subscriptions: any[]): Promise<{
    success: boolean
    syncedCount: number
    errors: string[]
  }> {
    const errors: string[] = []
    let syncedCount = 0

    // Check if connected
    if (!this.isConnected) {
      const connected = await this.checkConnectionStatus()
      if (!connected) {
        return {
          success: false,
          syncedCount: 0,
          errors: ["Google Calendar not connected. Please connect in Settings."],
        }
      }
    }

    for (const subscription of subscriptions) {
      try {
        const result = await this.createCalendarEvent({
          name: subscription.name,
          cost: subscription.cost,
          nextPayment: subscription.nextPayment,
          description: subscription.description,
        })

        if (result.success) {
          syncedCount++
        } else {
          errors.push(`Failed to sync ${subscription.name}: ${result.error}`)
        }
      } catch (error: any) {
        errors.push(`Failed to sync ${subscription.name}: ${error.message}`)
      }
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
    }
  }

  /**
   * Gets upcoming subscription reminders
   * Note: This queries the local subscriptions, not Google Calendar
   */
  async getUpcomingReminders(): Promise<any[]> {
    try {
      const subscriptions = await apiClient.getSubscriptions()
      
      // Filter for subscriptions with payments in the next 7 days
      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      return subscriptions
        .filter((sub: any) => {
          const paymentDate = new Date(sub.nextPayment)
          return paymentDate >= now && paymentDate <= weekFromNow
        })
        .map((sub: any) => ({
          id: sub.id,
          title: `${sub.name} Payment Due`,
          date: new Date(sub.nextPayment),
          amount: sub.cost,
        }))
        .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
    } catch (error) {
      console.error("Failed to get upcoming reminders:", error)
      return []
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

export const googleCalendarService = GoogleCalendarService.getInstance()
