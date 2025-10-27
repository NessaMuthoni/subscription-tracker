"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { googleCalendarService } from "@/lib/google-calendar"
import { useAuth } from "./auth-provider"
import { Calendar, CheckCircle, Loader2 } from "lucide-react"

export function GoogleAuthButton() {
  const { user, updateUser } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")

  const handleGoogleAuth = async () => {
    setIsConnecting(true)
    setConnectionStatus("idle")

    try {
      // Initialize Google Calendar API
      const success = await googleCalendarService.initializeGoogleCalendar()

      if (success) {
        // Update user preferences
        if (user) {
          const defaultPreferences = {
            notifications: { email: true, push: true, sms: false, reminderDays: 3 },
            budget: { monthly: 30000, currency: "KES", checkBalance: false },
            ai: { categorization: true, predictions: true, recommendations: true },
            calendar: { googleSync: false }
          }
          
          updateUser({
            ...user,
            preferences: {
              ...defaultPreferences,
              ...user.preferences,
              calendar: {
                ...defaultPreferences.calendar,
                ...user.preferences?.calendar,
                googleSync: true,
              },
            },
          })
        }

        setConnectionStatus("success")
      } else {
        setConnectionStatus("error")
      }
    } catch (error) {
      console.error("Google Calendar connection failed:", error)
      setConnectionStatus("error")
    } finally {
      setIsConnecting(false)
    }
  }

  const isConnected = user?.preferences?.calendar?.googleSync || false

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGoogleAuth}
        disabled={isConnecting || isConnected}
        variant={isConnected ? "secondary" : "default"}
        className="w-full"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : isConnected ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Google Calendar Connected
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4 mr-2" />
            Connect Google Calendar
          </>
        )}
      </Button>

      {connectionStatus === "success" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Successfully connected to Google Calendar! Your subscription reminders will now sync automatically.
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === "error" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Failed to connect to Google Calendar. Please try again or check your permissions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
