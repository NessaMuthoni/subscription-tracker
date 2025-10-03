"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sidebar } from "@/components/sidebar"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { PaymentMethodSetup } from "@/components/payment-method-setup"
import { PaymentBalanceChecker } from "@/components/payment-balance-checker"
import { useAuth } from "@/components/auth-provider"
import { useNotifications } from "@/components/notification-provider"
import { useSearchParams } from "next/navigation"
import { User, Bell, Brain, CreditCard, Save, CheckCircle, AlertTriangle, Calendar, Wallet } from "lucide-react"
import { MobileMenu } from "@/components/sidebar"

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { addNotification } = useNotifications()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const [settings, setSettings] = useState({
    profile: {
      name: user?.name || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
    },
    notifications: {
      email: user?.preferences.notifications.email || true,
      push: user?.preferences.notifications.push || true,
      sms: user?.preferences.notifications.sms || false,
      reminderDays: user?.preferences.notifications.reminderDays || 3,
    },
    budget: {
      monthly: user?.preferences.budget.monthly || 300,
      currency: user?.preferences.budget.currency || "USD",
      checkBalance: user?.preferences.budget.checkBalance || false,
    },
    ai: {
      categorization: user?.preferences.ai.categorization || true,
      predictions: user?.preferences.ai.predictions || true,
      recommendations: user?.preferences.ai.recommendations || true,
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      marketing: false,
    },
  })

  useEffect(() => {
    // Request notification permission if push notifications are enabled
    if (settings.notifications.push && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission()
      }
    }
  }, [settings.notifications.push])

  const handleSave = async () => {
    setSaveStatus("saving")

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update user preferences
      updateUser({
        ...user!,
        name: settings.profile.name,
        preferences: {
          ...user!.preferences,
          notifications: settings.notifications,
          budget: settings.budget,
          ai: settings.ai,
        },
      })

      setSaveStatus("saved")

      // Add success notification
      addNotification({
        type: "system",
        title: "Settings Updated",
        message: "Your preferences have been saved successfully",
        priority: "low",
      })

      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (error) {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }
  }

  const testNotification = () => {
    addNotification({
      type: "system",
      title: "Test Notification",
      message: "This is a test notification to verify your settings",
      priority: "medium",
    })
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
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your account and application preferences</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saveStatus === "saving"}>
              {saveStatus === "saving" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  Saving...
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {saveStatus === "error" && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">Failed to save settings. Please try again.</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Budget
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Features
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information and account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={settings.profile.name}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, name: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, email: e.target.value },
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>Manage your password and security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline">Change Password</Button>
                  <Button variant="outline">Enable Two-Factor Authentication</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified about subscription updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, email: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                    </div>
                    <Switch
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, push: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive text message alerts</p>
                    </div>
                    <Switch
                      checked={settings.notifications.sms}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, sms: checked },
                        }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Payment Reminder</Label>
                    <Select
                      value={settings.notifications.reminderDays.toString()}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, reminderDays: Number.parseInt(value) },
                        }))
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

                  <Button variant="outline" onClick={testNotification}>
                    Test Notification
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Budget Settings */}
            <TabsContent value="budget" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Configuration</CardTitle>
                  <CardDescription>Set your monthly budget and currency preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthly-budget">Monthly Budget</Label>
                      <Input
                        id="monthly-budget"
                        type="number"
                        value={settings.budget.monthly}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            budget: { ...prev.budget, monthly: Number.parseInt(e.target.value) || 0 },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select
                        value={settings.budget.currency}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            budget: { ...prev.budget, currency: value },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD (C$)</SelectItem>
                          <SelectItem value="KES">KES (KSh)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Methods */}
            <TabsContent value="payments" className="space-y-6">
              <PaymentMethodSetup />
              <PaymentBalanceChecker />
            </TabsContent>

            {/* Integrations */}
            <TabsContent value="integrations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Google Calendar Integration</CardTitle>
                  <CardDescription>Sync your subscription payment reminders with Google Calendar</CardDescription>
                </CardHeader>
                <CardContent>
                  <GoogleAuthButton />
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Features */}
            <TabsContent value="ai" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Powered Features</CardTitle>
                  <CardDescription>Configure how AI assists with your subscription management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Smart Categorization</Label>
                      <p className="text-sm text-muted-foreground">Automatically categorize new subscriptions</p>
                    </div>
                    <Switch
                      checked={settings.ai.categorization}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          ai: { ...prev.ai, categorization: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Predictive Analytics</Label>
                      <p className="text-sm text-muted-foreground">Get AI-powered spending forecasts</p>
                    </div>
                    <Switch
                      checked={settings.ai.predictions}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          ai: { ...prev.ai, predictions: checked },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Smart Recommendations</Label>
                      <p className="text-sm text-muted-foreground">Receive personalized optimization suggestions</p>
                    </div>
                    <Switch
                      checked={settings.ai.recommendations}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          ai: { ...prev.ai, recommendations: checked },
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
