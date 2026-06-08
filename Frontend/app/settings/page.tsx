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
import { apiClient } from "@/lib/api-client"

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth()
  const { addNotification } = useNotifications()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" })
  const [deleteConfirmation, setDeleteConfirmation] = useState("")

  const [settings, setSettings] = useState({
    profile: {
      name: user?.name || "",
      email: user?.email || "",
    },
    notifications: {
      email: user?.preferences?.notifications?.email ?? true,
      push: user?.preferences?.notifications?.push ?? true,
      reminderDays: user?.preferences?.notifications?.reminderDays ?? 3,
    },
    budget: {
      monthly: user?.preferences?.budget?.monthly ?? 300,
      currency: user?.preferences?.budget?.currency ?? "KES",
      checkBalance: user?.preferences?.budget?.checkBalance ?? false,
    },
    ai: {
      categorization: user?.preferences?.ai?.categorization ?? true,
      predictions: user?.preferences?.ai?.predictions ?? true,
      recommendations: user?.preferences?.ai?.recommendations ?? true,
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
          calendar: user?.preferences?.calendar || { googleSync: false },
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

  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      addNotification({
        type: "system",
        title: "Validation Error",
        message: "Please fill in all password fields",
        priority: "medium",
      })
      return
    }

    if (passwordData.new !== passwordData.confirm) {
      addNotification({
        type: "system",
        title: "Validation Error",
        message: "New passwords do not match",
        priority: "medium",
      })
      return
    }

    if (passwordData.new.length < 8) {
      addNotification({
        type: "system",
        title: "Validation Error",
        message: "Password must be at least 8 characters",
        priority: "medium",
      })
      return
    }

    try {
      await apiClient.changePassword({
        currentPassword: passwordData.current,
        newPassword: passwordData.new,
      })
      
      addNotification({
        type: "system",
        title: "Password Changed",
        message: "Your password has been changed successfully",
        priority: "low",
      })
      setShowPasswordDialog(false)
      setPasswordData({ current: "", new: "", confirm: "" })
    } catch (error: any) {
      addNotification({
        type: "system",
        title: "Error",
        message: error.message || "Failed to change password",
        priority: "high",
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      addNotification({
        type: "system",
        title: "Validation Error",
        message: 'Please type "DELETE" to confirm',
        priority: "medium",
      })
      return
    }

    try {
      await apiClient.deleteAccount()
      
      addNotification({
        type: "system",
        title: "Account Deleted",
        message: "Your account has been permanently deleted",
        priority: "high",
      })
      setTimeout(() => {
        logout()
        window.location.href = '/auth/login'
      }, 2000)
    } catch (error) {
      addNotification({
        type: "system",
        title: "Error",
        message: "Failed to delete account",
        priority: "high",
      })
    }
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
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1">
              <TabsTrigger value="profile" className="flex items-center gap-1 md:gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1 md:gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex items-center gap-1 md:gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Budget</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-1 md:gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-1 md:gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Integrations</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-1 md:gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">AI Features</span>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-muted-foreground">Change your account password</p>
                    </div>
                    <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                      Change Password
                    </Button>
                  </div>
                  
                  <Separator />
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible account actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Password Change Dialog */}
              {showPasswordDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-md mx-4">
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>Enter your current and new password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={passwordData.current}
                          onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordData.new}
                          onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordData.confirm}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setShowPasswordDialog(false)}>
                          Cancel
                        </Button>
                        <Button className="flex-1" onClick={handleChangePassword}>
                          Change Password
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Delete Account Dialog */}
              {showDeleteDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-md mx-4 border-destructive">
                    <CardHeader>
                      <CardTitle className="text-destructive">Delete Account</CardTitle>
                      <CardDescription>
                        This action cannot be undone. All your data will be permanently deleted.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="delete-confirm">Type "DELETE" to confirm</Label>
                        <Input
                          id="delete-confirm"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="DELETE"
                        />
                      </div>
                      <Alert className="border-destructive bg-destructive/10">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Warning: This will permanently delete all your subscriptions, budgets, and preferences.
                        </AlertDescription>
                      </Alert>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => {
                          setShowDeleteDialog(false)
                          setDeleteConfirmation("")
                        }}>
                          Cancel
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={handleDeleteAccount}>
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
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
                      <Label>In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications within the app</p>
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

                  <Separator />

                  <div className="space-y-2">
                    <Label>Payment Reminder</Label>
                    <p className="text-sm text-muted-foreground">How many days before payment should we remind you?</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectItem value="KES">KES (KSh)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD (C$)</SelectItem>
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
