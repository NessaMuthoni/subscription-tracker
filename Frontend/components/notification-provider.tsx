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

  // Fetch real notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return

      try {
        // TODO: Implement real notification API when backend endpoint is ready
        // const notifications = await apiClient.getNotifications()
        // setNotifications(notifications || [])
        
        // For now, initialize with empty array
        setNotifications([])
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        setNotifications([])
      }
    }

    fetchNotifications()
  }, [user])

  // TODO: Set up real-time notifications via WebSocket or polling when backend supports it
  // useEffect(() => {
  //   if (!user) return
  //   
  //   const interval = setInterval(async () => {
  //     // Check for new notifications from backend
  //     try {
  //       const newNotifications = await apiClient.getNotifications()
  //       setNotifications(newNotifications || [])
  //     } catch (error) {
  //       console.error('Failed to fetch notifications:', error)
  //     }
  //   }, 60000) // Check every minute
  //   
  //   return () => clearInterval(interval)
  // }, [user])

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])

    // Show browser notification if enabled
    if (user?.preferences?.notifications?.push && "Notification" in window) {
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
