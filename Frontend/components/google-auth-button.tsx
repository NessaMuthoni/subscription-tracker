"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { googleCalendarService } from "@/lib/google-calendar"
import { useAuth } from "./auth-provider"
import { Calendar, CheckCircle, Loader2, X } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export function GoogleAuthButton() {
  const { user, updateUser } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")

  // Check connection status on mount
  useEffect(() => {
    const checkStatus = async () => {
      await googleCalendarService.checkConnectionStatus()
    }
    checkStatus()
  }, [])

  const handleGoogleAuth = async () => {
    setIsConnecting(true)
    setConnectionStatus("idle")
    setErrorMessage("")

    try {
      // Initiate OAuth flow
      const success = await googleCalendarService.connectGoogleCalendar()

      if (success) {
        // Refresh user data to get updated preferences
        const updatedUser = await apiClient.getCurrentUser()
        updateUser(updatedUser)
        
        setConnectionStatus("success")
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setConnectionStatus("idle")
        }, 3000)
      } else {
        setConnectionStatus("error")
        setErrorMessage("Failed to connect to Google Calendar. Please try again.")
      }
    } catch (error: any) {
      console.error("Google Calendar connection failed:", error)
      setConnectionStatus("error")
      setErrorMessage(error.message || "Failed to connect to Google Calendar. Please check your permissions.")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    setErrorMessage("")

    try {
      const success = await googleCalendarService.disconnectGoogleCalendar()

      if (success) {
        // Refresh user data
        const updatedUser = await apiClient.getCurrentUser()
        updateUser(updatedUser)
        
        setConnectionStatus("idle")
      } else {
        setErrorMessage("Failed to disconnect Google Calendar. Please try again.")
      }
    } catch (error: any) {
      console.error("Failed to disconnect Google Calendar:", error)
      setErrorMessage(error.message || "Failed to disconnect Google Calendar.")
    } finally {
      setIsDisconnecting(false)
    }
  }

  const isConnected = user?.preferences?.calendar?.googleSync || false

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={handleGoogleAuth}
          disabled={isConnecting || isConnected}
          variant={isConnected ? "secondary" : "default"}
          className="flex-1"
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

        {isConnected && (
          <Button
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            variant="outline"
            size="icon"
            title="Disconnect Google Calendar"
          >
            {isDisconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {connectionStatus === "success" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Successfully connected to Google Calendar! Your subscription reminders will now sync automatically.
          </AlertDescription>
        </Alert>
      )}

      {(connectionStatus === "error" || errorMessage) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {errorMessage || "Failed to connect to Google Calendar. Please try again or check your permissions."}
          </AlertDescription>
        </Alert>
      )}

      {isConnected && (
        <Alert className="border-blue-200 bg-blue-50">
          <Calendar className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Subscription payment reminders will be automatically added to your Google Calendar.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
