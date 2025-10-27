"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { aiService } from "@/lib/ai-service"
import { googleCalendarService } from "@/lib/google-calendar"
import { Brain, Sparkles, Loader2, CheckCircle, Calendar, CreditCard, Smartphone, Wallet } from "lucide-react"

interface SubscriptionFormProps {
  onSubmit: (subscription: any) => void
  onCancel: () => void
}

export function SubscriptionForm({ onSubmit, onCancel }: SubscriptionFormProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cost: "",
    billingCycle: "monthly",
    nextPayment: "",
    category: "",
    website: "",
    notes: "",
    paymentMethod: "card",
    autoRenew: true,
  })

  // Auto-categorize when name changes
  useEffect(() => {
    const autoCategorize = async () => {
      if (formData.name && formData.name.length > 2 && !formData.category) {
        try {
          const suggestion = await aiService.categorizeSubscription(formData.name, formData.description)
          setAiSuggestion(suggestion)
          setFormData((prev) => ({ ...prev, category: suggestion.category }))
        } catch (error) {
          console.error("Auto-categorization failed:", error)
        }
      }
    }

    // Debounce the categorization
    const timer = setTimeout(autoCategorize, 500)
    return () => clearTimeout(timer)
  }, [formData.name, formData.description])

  // Map AI categories to backend categories
  const mapCategoryToBackend = (aiCategory: string): string | null => {
    const mapping: Record<string, string> = {
      "Entertainment": "Entertainment",
      "Gaming": "Gaming",
      "Productivity": "Software",
      "Cloud": "Software",
      "Fitness": "Fitness",
      "Finance": "Other",
      "Social": "Entertainment",
      "Education": "Education",
      "News": "News & Media",
      "Music": "Music",
    }
    return mapping[aiCategory] || null
  }

  const handleAnalyzeService = async () => {
    if (!formData.name) return

    setIsAnalyzing(true)
    try {
      const suggestion = await aiService.categorizeSubscription(formData.name, formData.description)
      setAiSuggestion(suggestion)
      setFormData((prev) => ({ ...prev, category: suggestion.category }))
    } catch (error) {
      console.error("Failed to analyze service:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Map category name to backend category name
      const backendCategory = formData.category ? mapCategoryToBackend(formData.category) : null

      // Transform form data to match backend API expectations
      const subscriptionData = {
        name: formData.name,
        price: Number.parseFloat(formData.cost),
        billing_cycle: formData.billingCycle,
        billing_date: new Date(formData.nextPayment).toISOString(), // Convert to ISO datetime string
        status: "active",
        payment_method: formData.paymentMethod, // Send payment method to backend
        description: formData.description || null,
        website_url: formData.website || null,
        category: backendCategory, // Send category name - backend will look up the ID
      }

      // Sync with Google Calendar if enabled
      try {
        const calendarSubscription = {
          id: Date.now(),
          name: formData.name,
          cost: Number.parseFloat(formData.cost),
          billingCycle: formData.billingCycle,
          nextPayment: formData.nextPayment,
          category: formData.category || aiSuggestion?.category || "Other",
          status: "active",
          description: formData.description,
          website: formData.website,
          notes: formData.notes,
          paymentMethod: formData.paymentMethod,
          autoRenew: formData.autoRenew,
          aiConfidence: aiSuggestion?.confidence || 0.5,
          createdAt: new Date().toISOString(),
        }
        await googleCalendarService.syncSubscriptionReminders([calendarSubscription])
      } catch (error) {
        console.warn("Failed to sync with Google Calendar:", error)
      }

      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onSubmit(subscriptionData)
    } catch (error) {
      console.error("Failed to save subscription:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "mpesa":
        return <Smartphone className="h-4 w-4" />
      case "paypal":
        return <Wallet className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>Enter the details of your new subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter service name"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAnalyzeService}
                      disabled={!formData.name || isAnalyzing}
                      className="flex-shrink-0 bg-transparent"
                    >
                      {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost *</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingCycle">Billing Cycle *</Label>
                  <Select
                    value={formData.billingCycle}
                    onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextPayment">Next Payment Date *</Label>
                  <Input
                    id="nextPayment"
                    type="date"
                    value={formData.nextPayment}
                    onChange={(e) => setFormData({ ...formData, nextPayment: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Auto-suggested based on service name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Credit/Debit Card
                        </div>
                      </SelectItem>
                      <SelectItem value="paypal">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          PayPal
                        </div>
                      </SelectItem>
                      <SelectItem value="mpesa">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          M-Pesa
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://service-website.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the service"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes"
                  rows={2}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSaving} className="flex-1 md:flex-none">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Add Subscription
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions Sidebar */}
      <div className="space-y-6">
        {aiSuggestion && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Suggested Category</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{aiSuggestion.category}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {(aiSuggestion.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </div>

              {aiSuggestion.subcategory && (
                <div>
                  <Label className="text-sm font-medium">Subcategory</Label>
                  <p className="text-sm text-muted-foreground mt-1">{aiSuggestion.subcategory}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                This subscription will be automatically synced with your Google Calendar for payment reminders.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-foreground">💡 Pro Tips:</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Use the AI analyzer for accurate categorization</li>
                <li>• Set reminders 3-5 days before payment</li>
                <li>• Consider annual billing for savings</li>
                <li>• Add notes for usage tracking</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
