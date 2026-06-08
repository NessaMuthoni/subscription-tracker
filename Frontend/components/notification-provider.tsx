"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { apiClient } from "@/lib/api-client"

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
        const data = await apiClient.getNotifications()
        if (data && Array.isArray(data)) {
          // Transform backend notification format to frontend format
          const transformedNotifications = data.map((notif: any) => ({
            id: notif.id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            timestamp: new Date(notif.created_at),
            read: notif.read,
            priority: notif.priority,
            actionUrl: notif.action_url,
            metadata: notif.metadata
          }))
          setNotifications(transformedNotifications)
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        setNotifications([])
      }
    }

    fetchNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
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
    if (user?.preferences?.notifications?.push && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
        })
      }
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationAsRead(id)
      setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Mark all as read in parallel
      await Promise.all(notifications.filter(n => !n.read).map(n => apiClient.markNotificationAsRead(n.id)))
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
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
