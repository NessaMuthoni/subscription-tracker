"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sidebar } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { aiService } from "@/lib/ai-service"
import { apiClient } from "@/lib/api-client"
import { ArrowLeft, Brain, Sparkles, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MobileMenu } from "@/components/sidebar"

export default function AddSubscriptionPage() {
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
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
  })

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

    try {
      // Validate required fields
      if (!formData.name || !formData.cost || !formData.nextPayment) {
        console.error("Missing required fields")
        return
      }

      // Validate price
      const price = parseFloat(formData.cost)
      if (isNaN(price) || price < 0) {
        console.error("Invalid price:", formData.cost)
        alert("Please enter a valid price greater than or equal to 0")
        return
      }

      const subscriptionData = {
        name: formData.name,
        price: price,
        billing_date: new Date(formData.nextPayment + 'T00:00:00Z').toISOString(), // Convert to full timestamp
        // category_id: null, // Omit instead of sending null
        status: "active"
      }

      console.log("Sending subscription data:", subscriptionData)

      // Create subscription via API
      await apiClient.createSubscription(subscriptionData)

      // Redirect back to subscriptions page
      router.push("/subscriptions")
    } catch (error: any) {
      console.error("Failed to create subscription:", error)
      
      // Show error details to help with debugging
      if (error.response?.data?.Error) {
        console.error("Backend error:", error.response.data.Error)
      }
      
      // TODO: Show error toast with specific error message
      alert(`Failed to create subscription: ${error.response?.data?.Error || error.message}`)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar className="w-64 flex-shrink-0 hidden lg:flex" />

        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <MobileMenu />
              <Link href="/subscriptions">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-foreground">Add New Subscription</h1>
                <p className="text-muted-foreground">Let AI help you categorize and track your subscription</p>
              </div>
            </div>

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
                              {isAnalyzing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Brain className="h-4 w-4" />
                              )}
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
                        <Button type="submit" className="flex-1 md:flex-none">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Add Subscription
                        </Button>
                        <Link href="/subscriptions">
                          <Button type="button" variant="outline">
                            Cancel
                          </Button>
                        </Link>
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

                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    Our AI will automatically sync this subscription with your Google Calendar and analyze spending
                    patterns to provide personalized recommendations.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
