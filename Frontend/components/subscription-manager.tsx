"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Trash2, MoreHorizontal, Plus, Brain, Sparkles, CreditCard, Smartphone } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { paymentService } from "@/lib/payment-service"
import { useAuth } from "@/components/auth-provider"

interface Subscription {
  id: string
  name: string
  price: number
  billing_date: string
  category?: {
    id: string
    name: string
  }
  status: string
  created_at: string
  updated_at: string
  website_url?: string
  cancellation_url?: string
  // Additional fields for UI display
  cost: number
  billingCycle: string
  nextPayment: string
  aiConfidence?: number
}

interface SubscriptionManagerProps {
  subscriptions: Subscription[]
  setSubscriptions: (subscriptions: Subscription[]) => void
}

// AI categorization function (simulated)
const categorizeService = (serviceName: string) => {
  const categories = {
    netflix: { category: "Entertainment", confidence: 0.95 },
    spotify: { category: "Entertainment", confidence: 0.98 },
    adobe: { category: "Productivity", confidence: 0.92 },
    aws: { category: "Cloud Services", confidence: 0.88 },
    gym: { category: "Health & Fitness", confidence: 0.94 },
    office: { category: "Productivity", confidence: 0.96 },
    dropbox: { category: "Cloud Services", confidence: 0.91 },
    youtube: { category: "Entertainment", confidence: 0.93 },
  }

  const key = serviceName.toLowerCase()
  for (const [service, data] of Object.entries(categories)) {
    if (key.includes(service)) {
      return data
    }
  }

  return { category: "Other", confidence: 0.75 }
}

export function SubscriptionManager({ subscriptions, setSubscriptions }: SubscriptionManagerProps) {
  const { user } = useAuth()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    cost: "",
    billingCycle: "monthly",
    nextPayment: "",
    category: "",
    websiteUrl: "",
    cancellationUrl: "",
    paymentMethod: "card",
    description: "",
  })

  const handleAddSubscription = () => {
    const aiResult = categorizeService(formData.name)
    const cost = Number.parseFloat(formData.cost)
    const newSubscription: Subscription = {
      id: Date.now().toString(),
      name: formData.name,
      price: cost,
      billing_date: formData.nextPayment,
      category: formData.category ? { id: "1", name: formData.category } : undefined,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // UI display fields
      cost: cost,
      billingCycle: formData.billingCycle,
      nextPayment: formData.nextPayment,
      aiConfidence: aiResult.confidence,
    }

    setSubscriptions([...subscriptions, newSubscription])
    setFormData({ name: "", cost: "", billingCycle: "monthly", nextPayment: "", category: "" })
    setIsAddDialogOpen(false)
  }

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription)
    setFormData({
      name: subscription.name,
      cost: subscription.cost.toString(),
      billingCycle: subscription.billingCycle,
      nextPayment: subscription.nextPayment,
      category: subscription.category?.name || "",
      websiteUrl: subscription.website_url || "",
      cancellationUrl: subscription.cancellation_url || "",
      paymentMethod: "card",
      description: "",
    })
  }

  const handleUpdateSubscription = () => {
    if (!editingSubscription) return

    const cost = Number.parseFloat(formData.cost)
    const updatedSubscriptions = subscriptions.map((sub) =>
      sub.id === editingSubscription.id
        ? {
            ...sub,
            name: formData.name,
            price: cost,
            billing_date: formData.nextPayment,
            category: formData.category ? { id: sub.category?.id || "1", name: formData.category } : undefined,
            updated_at: new Date().toISOString(),
            // UI display fields
            cost: cost,
            billingCycle: formData.billingCycle,
            nextPayment: formData.nextPayment,
          }
        : sub,
    )

    setSubscriptions(updatedSubscriptions)
    setEditingSubscription(null)
    setFormData({ name: "", cost: "", billingCycle: "monthly", nextPayment: "", category: "" })
  }

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions(subscriptions.filter((sub) => sub.id !== id))
  }

  const { toast } = useToast()

  const handlePaystackPayment = async (subscription: Subscription) => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "User email not found. Please log in again.",
        variant: "destructive",
      })
      return
    }

    setIsProcessingPayment(subscription.id)

    try {
      // Initialize Paystack payment
      const result = await paymentService.initializePaystackPayment(
        user.email,
        subscription.cost,
        subscription.name
      )

      // Check for budget exceeded error
      if (!result.success && result.would_exceed) {
        toast({
          title: "Budget Exceeded",
          description: result.message || `This payment would exceed your monthly budget of KSh ${result.budget}. Current spending: KSh ${result.current_spent}`,
          variant: "destructive",
        })
        setIsProcessingPayment(null)
        return
      }

      if (!result.success || !result.authorization_url) {
        throw new Error(result.error || "Failed to initialize payment")
      }

      // Open Paystack payment page in popup
      const paystackWindow = window.open(
        result.authorization_url,
        "paystackPayment",
        "width=600,height=700,scrollbars=yes,resizable=yes"
      )

      if (!paystackWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.")
      }

      toast({
        title: "Payment Initiated",
        description: "Complete payment in the popup window",
      })

      // Listen for payment completion
      const checkPaymentStatus = setInterval(async () => {
        if (paystackWindow.closed) {
          clearInterval(checkPaymentStatus)

          // Verify payment
          if (result.reference) {
            const verification = await paymentService.verifyPaystackPayment(result.reference)

            if (verification.success && verification.status === "success") {
              toast({
                title: "Payment Successful",
                description: `Payment of ${verification.currency} ${verification.amount} for ${subscription.name} was successful!`,
              })
            } else {
              toast({
                title: "Payment Failed",
                description: verification.error || "Payment was not completed",
                variant: "destructive",
              })
            }
          }

          setIsProcessingPayment(null)
        }
      }, 1000)

      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(checkPaymentStatus)
        if (!paystackWindow.closed) {
          paystackWindow.close()
        }
        setIsProcessingPayment(null)
      }, 300000)
    } catch (error) {
      console.error("Payment initialization failed:", error)
      setIsProcessingPayment(null)

      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment",
        variant: "destructive",
      })
    }
  }

  const handleMpesaPayment = async (subscription: Subscription) => {
    // Prompt user for phone number
    const phoneNumber = window.prompt(
      `Enter your M-Pesa phone number to pay KSh ${subscription.cost.toFixed(2)} for ${subscription.name}:`,
      "254"
    )

    if (!phoneNumber) return

    setIsProcessingPayment(subscription.id)

    try {
      const result = await paymentService.initiateMpesaPayment(
        phoneNumber,
        subscription.cost,
        subscription.name
      )

      if (result.success) {
        toast({
          title: "STK Push Sent",
          description: result.message || "Check your phone to complete payment",
        })
      } else {
        toast({
          title: "Payment Failed",
          description: result.error || "Failed to initiate M-Pesa payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("M-Pesa payment failed:", error)
      toast({
        title: "Payment Error",
        description: "Failed to initiate M-Pesa payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayment(null)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Entertainment: "bg-red-100 text-red-800",
      Software: "bg-blue-100 text-blue-800",
      Gaming: "bg-green-100 text-green-800",
      Music: "bg-amber-100 text-amber-800",
      "News & Media": "bg-purple-100 text-purple-800",
      Fitness: "bg-cyan-100 text-cyan-800",
      "Food & Delivery": "bg-orange-100 text-orange-800",
      Transportation: "bg-lime-100 text-lime-800",
      Utilities: "bg-gray-100 text-gray-800",
      Education: "bg-teal-100 text-teal-800",
      Other: "bg-gray-100 text-gray-800",
    }
    return colors[category] || colors.Other
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Subscription Management
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  AI Categorization
                </Badge>
              </CardTitle>
              <CardDescription>Manage your subscriptions with AI-powered categorization and insights</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subscription</DialogTitle>
                  <DialogDescription>
                    Add a new subscription. Our AI will automatically categorize it for you.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Service Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Netflix, Spotify"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingCycle">Billing Cycle</Label>
                    <Select
                      value={formData.billingCycle}
                      onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nextPayment">Next Payment Date</Label>
                    <Input
                      id="nextPayment"
                      type="date"
                      value={formData.nextPayment}
                      onChange={(e) => setFormData({ ...formData, nextPayment: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category (Optional)</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Auto-categorize or select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entertainment">Entertainment</SelectItem>
                        <SelectItem value="Gaming">Gaming</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Fitness">Fitness</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="News & Media">News & Media</SelectItem>
                        <SelectItem value="Music">Music</SelectItem>
                        <SelectItem value="Food & Delivery">Food & Delivery</SelectItem>
                        <SelectItem value="Transportation">Transportation</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
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
                        <SelectItem value="mpesa">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            M-Pesa
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
                    <Input
                      id="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cancellationUrl">Cancellation URL (Optional)</Label>
                    <Input
                      id="cancellationUrl"
                      value={formData.cancellationUrl}
                      onChange={(e) => setFormData({ ...formData, cancellationUrl: e.target.value })}
                      placeholder="https://example.com/cancel"
                    />
                    <p className="text-xs text-muted-foreground">URL to cancel this subscription on the provider's website</p>
                  </div>                  <Button onClick={handleAddSubscription} className="w-full">
                    Add Subscription
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Next Payment</TableHead>
                <TableHead>AI Confidence</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="font-medium">{subscription.name}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(subscription.category?.name || "Other")}>{subscription.category?.name || "Other"}</Badge>
                  </TableCell>
                  <TableCell>KSh {subscription.cost.toFixed(2)}</TableCell>
                  <TableCell className="capitalize">{subscription.billingCycle}</TableCell>
                  <TableCell>{new Date(subscription.nextPayment).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-blue-500" />
                      {((subscription.aiConfidence || 0) * 100).toFixed(0)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePaystackPayment(subscription)} disabled={isProcessingPayment === subscription.id}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay with Card
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMpesaPayment(subscription)} disabled={isProcessingPayment === subscription.id}>
                          <Smartphone className="h-4 w-4 mr-2" />
                          Pay with M-Pesa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditSubscription(subscription)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {subscription.cancellation_url && (
                          <DropdownMenuItem onClick={() => window.open(subscription.cancellation_url, "_blank")}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Cancel on Website
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteSubscription(subscription.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete from App
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingSubscription} onOpenChange={() => setEditingSubscription(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>Update your subscription details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Service Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-cost">Cost</Label>
              <Input
                id="edit-cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-billingCycle">Billing Cycle</Label>
              <Select
                value={formData.billingCycle}
                onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-nextPayment">Next Payment Date</Label>
              <Input
                id="edit-nextPayment"
                type="date"
                value={formData.nextPayment}
                onChange={(e) => setFormData({ ...formData, nextPayment: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Gaming">Gaming</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Fitness">Fitness</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="News & Media">News & Media</SelectItem>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="Food & Delivery">Food & Delivery</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-paymentMethod">Payment Method</Label>
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
                  <SelectItem value="mpesa">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      M-Pesa
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>
            <div>
              <Label htmlFor="edit-websiteUrl">Website URL (Optional)</Label>
              <Input
                id="edit-websiteUrl"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-cancellationUrl">Cancellation URL (Optional)</Label>
              <Input
                id="edit-cancellationUrl"
                value={formData.cancellationUrl}
                onChange={(e) => setFormData({ ...formData, cancellationUrl: e.target.value })}
                placeholder="https://example.com/cancel"
              />
              <p className="text-xs text-muted-foreground">URL to cancel this subscription on the provider's website</p>
            </div>
            <Button onClick={handleUpdateSubscription} className="w-full">
              Update Subscription
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
