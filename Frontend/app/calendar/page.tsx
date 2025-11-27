"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/sidebar"
import { ChevronLeft, ChevronRight, CalendarIcon, Loader2 } from "lucide-react"
import { MobileMenu } from "@/components/sidebar"
import { useAuth } from "@/components/auth-provider"
import { apiClient } from "@/lib/api-client"

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch subscriptions on component mount
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const data = await apiClient.getSubscriptions()
        setSubscriptions(data || [])
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error)
        setSubscriptions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptions()
  }, [user])

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(new Date(currentYear, currentMonth + (direction === "next" ? 1 : -1), 1))
  }

  const getSubscriptionsForDate = (date: number) => {
    const calendarDate = new Date(currentYear, currentMonth, date)
    
    return subscriptions.filter((sub) => {
      // Only show subscription if it was created before this date
      const createdDate = sub.created_at ? new Date(sub.created_at) : null
      if (createdDate && calendarDate < createdDate) {
        return false // Don't show subscription before it was created
      }

      if (sub.billing_date) {
        const billingDate = new Date(sub.billing_date)
        // Match the day of month for recurring payments
        return billingDate.getDate() === date && 
               calendarDate >= billingDate // Only show from billing date onwards
      }
      // Fallback for legacy data structure
      return sub.date === date
    })
  }

  const renderCalendarDays = () => {
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-border"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const daySubscriptions = getSubscriptionsForDate(day)
      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === currentMonth &&
        new Date().getFullYear() === currentYear

      days.push(
        <div key={day} className={`h-24 border border-border p-1 ${isToday ? "bg-primary/10" : "bg-card"}`}>
          <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : "text-foreground"}`}>{day}</div>
          <div className="space-y-1">
            {daySubscriptions.map((sub) => (
              <div key={sub.id} className="text-xs bg-primary/20 text-primary px-1 py-0.5 rounded truncate">
                {sub.icon || "📋"} KSh {(sub.price || sub.cost || 0).toFixed(2)}
              </div>
            ))}
          </div>
        </div>,
      )
    }

    return days
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="w-64 flex-shrink-0" />

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <MobileMenu />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Payment Calendar</h1>
                <p className="text-muted-foreground">Track your subscription payment dates</p>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {monthNames[currentMonth]} {currentYear}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week days header */}
              <div className="grid grid-cols-7 gap-0 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-medium text-muted-foreground border-b border-border"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0">{renderCalendarDays()}</div>
            </CardContent>
          </Card>

          {/* Upcoming Payments */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Upcoming Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading upcoming payments...</span>
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No upcoming payments</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add subscriptions to see payment reminders
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subscriptions
                    .filter(sub => sub.billing_date || sub.date)
                    .sort((a, b) => {
                      const dateA = a.billing_date ? new Date(a.billing_date).getTime() : 0
                      const dateB = b.billing_date ? new Date(b.billing_date).getTime() : 0
                      return dateA - dateB
                    })
                    .map((sub) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      
                      const billingDate = sub.billing_date ? new Date(sub.billing_date) : null
                      if (!billingDate) return null
                      
                      billingDate.setHours(0, 0, 0, 0)
                      
                      const daysUntil = Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      const isOverdue = daysUntil < 0
                      const isDueToday = daysUntil === 0

                      if (!billingDate) return null

                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{sub.icon || "📋"}</div>
                            <div>
                              <p className="font-medium text-foreground">{sub.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {billingDate.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold text-foreground">KSh {(sub.price || sub.cost || 0).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                {isOverdue
                                  ? `${Math.abs(daysUntil)} days overdue`
                                  : isDueToday
                                    ? "Due today"
                                    : `Due in ${daysUntil} days`}
                              </p>
                            </div>
                            <Badge variant={isOverdue ? "destructive" : isDueToday ? "default" : "secondary"}>
                              {isOverdue ? "Overdue" : isDueToday ? "Today" : "Upcoming"}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
