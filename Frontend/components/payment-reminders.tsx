"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Bell, Clock, CheckCircle, AlertTriangle } from "lucide-react"

interface Subscription {
  id: number
  name: string
  cost: number
  billingCycle: string
  nextPayment: string
  category: string
  status: string
  aiConfidence: number
}

interface PaymentRemindersProps {
  subscriptions: Subscription[]
}

interface ReminderSettings {
  enabled: boolean
  daysBeforePayment: number
  emailNotifications: boolean
  pushNotifications: boolean
}

export function PaymentReminders({ subscriptions }: PaymentRemindersProps) {
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: true,
    daysBeforePayment: 3,
    emailNotifications: true,
    pushNotifications: false,
  })

  // Calculate upcoming payments
  const getUpcomingPayments = () => {
    const today = new Date()
    return subscriptions
      .map((sub) => {
        const paymentDate = new Date(sub.nextPayment)
        const diffTime = paymentDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return {
          ...sub,
          daysUntilPayment: diffDays,
          isUpcoming: diffDays <= reminderSettings.daysBeforePayment && diffDays >= 0,
          isOverdue: diffDays < 0,
          isPaid: false, // This would come from your payment tracking system
        }
      })
      .sort((a, b) => a.daysUntilPayment - b.daysUntilPayment)
  }

  const upcomingPayments = getUpcomingPayments()
  const overduePayments = upcomingPayments.filter((p) => p.isOverdue)
  const todayPayments = upcomingPayments.filter((p) => p.daysUntilPayment === 0)
  const nextWeekPayments = upcomingPayments.filter((p) => p.daysUntilPayment > 0 && p.daysUntilPayment <= 7)

  const getPaymentStatus = (payment: any) => {
    if (payment.isOverdue) return { status: "overdue", color: "destructive", icon: AlertTriangle }
    if (payment.daysUntilPayment === 0) return { status: "today", color: "default", icon: Clock }
    if (payment.isUpcoming) return { status: "upcoming", color: "secondary", icon: Bell }
    return { status: "scheduled", color: "outline", icon: Calendar }
  }

  const totalUpcomingAmount = upcomingPayments
    .filter((p) => p.isUpcoming || p.daysUntilPayment === 0)
    .reduce((sum, p) => sum + p.cost, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              KSh {todayPayments.reduce((sum, p) => sum + p.cost, 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next 7 Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nextWeekPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              KSh {nextWeekPayments.reduce((sum, p) => sum + p.cost, 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overduePayments.length}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Upcoming</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh {totalUpcomingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Next {reminderSettings.daysBeforePayment} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overduePayments.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You have {overduePayments.length} overdue payment{overduePayments.length > 1 ? "s" : ""}. Please review and
            update your payment information.
          </AlertDescription>
        </Alert>
      )}

      {todayPayments.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            You have {todayPayments.length} payment{todayPayments.length > 1 ? "s" : ""} due today totaling $
            {todayPayments.reduce((sum, p) => sum + p.cost, 0).toFixed(2)}.
          </AlertDescription>
        </Alert>
      )}

      {/* Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder Settings</CardTitle>
          <CardDescription>Configure how and when you want to be reminded about upcoming payments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminders-enabled">Enable Reminders</Label>
              <p className="text-sm text-muted-foreground">Get notified about upcoming subscription payments</p>
            </div>
            <Switch
              id="reminders-enabled"
              checked={reminderSettings.enabled}
              onCheckedChange={(checked) => setReminderSettings((prev) => ({ ...prev, enabled: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="days-before">Remind me this many days before payment</Label>
            <Select
              value={reminderSettings.daysBeforePayment.toString()}
              onValueChange={(value) =>
                setReminderSettings((prev) => ({ ...prev, daysBeforePayment: Number.parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day before</SelectItem>
                <SelectItem value="2">2 days before</SelectItem>
                <SelectItem value="3">3 days before</SelectItem>
                <SelectItem value="5">5 days before</SelectItem>
                <SelectItem value="7">1 week before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive reminder emails</p>
              </div>
              <Switch
                id="email-notifications"
                checked={reminderSettings.emailNotifications}
                onCheckedChange={(checked) => setReminderSettings((prev) => ({ ...prev, emailNotifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
              </div>
              <Switch
                id="push-notifications"
                checked={reminderSettings.pushNotifications}
                onCheckedChange={(checked) => setReminderSettings((prev) => ({ ...prev, pushNotifications: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Calendar</CardTitle>
          <CardDescription>Upcoming payment schedule for all your subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingPayments.slice(0, 10).map((payment) => {
              const status = getPaymentStatus(payment)
              const StatusIcon = status.icon

              return (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <StatusIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{payment.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {payment.daysUntilPayment === 0
                          ? "Due today"
                          : payment.daysUntilPayment < 0
                            ? `${Math.abs(payment.daysUntilPayment)} days overdue`
                            : `Due in ${payment.daysUntilPayment} days`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold">KSh {payment.cost.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(payment.nextPayment).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={status.color as any}>{status.status}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your payment reminders and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All as Reviewed
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Test Notification
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Export Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
