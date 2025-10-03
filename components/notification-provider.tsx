"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-provider"

interface Notification {
  id: string
  type: "payment" | "budget" | "ai_insight" | "system"
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: "low" | "medium" | "high"
  actionUrl?: string
  metadata?: any
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Initialize with mock notifications
  useEffect(() => {
    if (user) {
      const mockNotifications: Notification[] = [
        {
          id: "1",
          type: "payment",
          title: "Payment Due Tomorrow",
          message: "Netflix subscription ($15.99) is due tomorrow",
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          read: false,
          priority: "high",
          actionUrl: "/calendar",
        },
        {
          id: "2",
          type: "budget",
          title: "Budget Alert",
          message: "You've used 85% of your monthly budget",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          read: false,
          priority: "medium",
          actionUrl: "/budget",
        },
        {
          id: "3",
          type: "ai_insight",
          title: "AI Recommendation",
          message: "Switch to annual billing to save $45/year",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          read: true,
          priority: "low",
          actionUrl: "/analytics",
        },
      ]
      setNotifications(mockNotifications)
    }
  }, [user])

  // Simulate real-time notifications
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      // Randomly generate notifications based on user preferences
      if (Math.random() < 0.1) {
        // 10% chance every 30 seconds
        const types = ["payment", "budget", "ai_insight"] as const
        const type = types[Math.floor(Math.random() * types.length)]

        const messages = {
          payment: [
            "Spotify payment due in 2 days",
            "Adobe subscription renewing soon",
            "AWS bill is higher than usual this month",
          ],
          budget: [
            "You're approaching your monthly budget limit",
            "Entertainment category is over budget",
            "Great job staying under budget this month!",
          ],
          ai_insight: [
            "Consider canceling unused subscriptions",
            "Bundle your streaming services for savings",
            "Your spending pattern suggests a price increase",
          ],
        }

        const typeMessages = messages[type]
        const message = typeMessages[Math.floor(Math.random() * typeMessages.length)]

        addNotification({
          type,
          title: type === "payment" ? "Payment Reminder" : type === "budget" ? "Budget Update" : "AI Insight",
          message,
          priority: type === "payment" ? "high" : "medium",
        })
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [user])

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])

    // Show browser notification if enabled
    if (user?.preferences.notifications.push && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
        })
      }
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
