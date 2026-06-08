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

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: string
  amount: number
  description: string
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch subscriptions and calendar events on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const [subsData, eventsData] = await Promise.all([
          apiClient.getSubscriptions(),
          fetchCalendarEvents()
        ])
        setSubscriptions(subsData || [])
        setCalendarEvents(eventsData || [])
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setSubscriptions([])
        setCalendarEvents([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  const fetchCalendarEvents = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return []

      const response = await fetch("http://localhost:8080/api/calendar/events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch calendar events")
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to fetch calendar events:", error)
      return []
    }
  }

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

  const getEventsForDate = (date: number) => {
    const calendarDate = new Date(currentYear, currentMonth, date)
    const events: any[] = []
    
    // Get subscription events
    subscriptions.forEach((sub) => {
      // Only show subscription if it was created before this date
      const createdDate = sub.created_at ? new Date(sub.created_at) : null
      if (createdDate && calendarDate < createdDate) {
        return // Don't show subscription before it was created
      }

      if (sub.billing_date) {
        const billingDate = new Date(sub.billing_date)
        // Match the day of month for recurring payments
        if (billingDate.getDate() === date && calendarDate >= billingDate) {
          events.push({
            ...sub,
            source: 'subscription'
          })
        }
      }
      // Fallback for legacy data structure
      else if (sub.date === date) {
        events.push({
          ...sub,
          source: 'subscription'
        })
      }
    })

    // Get calendar events from backend
    calendarEvents.forEach((event) => {
      const eventDate = new Date(event.date)
      if (eventDate.getDate() === date && 
          eventDate.getMonth() === currentMonth && 
          eventDate.getFullYear() === currentYear) {
        events.push({
          id: event.id,
          name: event.title,
          price: event.amount,
          icon: "📅",
          source: 'calendar'
        })
      }
    })
    
    return events
  }

  const renderCalendarDays = () => {
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-border"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(day)
      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === currentMonth &&
        new Date().getFullYear() === currentYear

      days.push(
        <div key={day} className={`h-24 border border-border p-1 ${isToday ? "bg-primary/10" : "bg-card"}`}>
          <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : "text-foreground"}`}>{day}</div>
          <div className="space-y-1">
            {dayEvents.map((event: any) => (
              <div 
                key={`${event.source}-${event.id}`} 
                className={`text-xs px-1 py-0.5 rounded truncate ${
                  event.source === 'calendar' 
                    ? 'bg-green-500/20 text-green-700 dark:text-green-300' 
                    : 'bg-primary/20 text-primary'
                }`}
                title={`${event.name} - KSh ${(event.price || event.cost || 0).toFixed(2)}`}
              >
                {event.icon || "📋"} {event.name}
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
