"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/sidebar"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { MobileMenu } from "@/components/sidebar"

const subscriptions = [
  { id: 1, name: "Netflix", cost: 15.99, date: 15, icon: "🎬" },
  { id: 2, name: "Spotify", cost: 9.99, date: 10, icon: "🎵" },
  { id: 3, name: "Adobe", cost: 52.99, date: 20, icon: "🎨" },
  { id: 4, name: "AWS", cost: 89.5, date: 12, icon: "☁️" },
  { id: 5, name: "Gym", cost: 45.0, date: 18, icon: "💪" },
]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())

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
    return subscriptions.filter((sub) => sub.date === date)
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
                {sub.icon} ${sub.cost}
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
              <div className="space-y-3">
                {subscriptions
                  .sort((a, b) => a.date - b.date)
                  .map((sub) => {
                    const daysUntil = sub.date - new Date().getDate()
                    const isOverdue = daysUntil < 0
                    const isDueToday = daysUntil === 0

                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{sub.icon}</div>
                          <div>
                            <p className="font-medium text-foreground">{sub.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {monthNames[currentMonth]} {sub.date}, {currentYear}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-foreground">${sub.cost}</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
