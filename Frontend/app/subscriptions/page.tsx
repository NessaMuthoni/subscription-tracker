"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sidebar } from "@/components/sidebar"
import { SubscriptionForm } from "@/components/subscription-form"
import { EditSubscriptionForm } from "@/components/edit-subscription-form"
import { useNotifications } from "@/components/notification-provider"
import { useAuth } from "@/components/auth-provider"
import { apiClient } from "@/lib/api-client"
import { paymentService } from "@/lib/payment-service"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Filter, Loader2, Wallet, Settings as SettingsIcon, CreditCard, ExternalLink } from "lucide-react"
import { MobileMenu } from "@/components/sidebar"
import Link from "next/link"

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<any>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [payingSubscription, setPayingSubscription] = useState<any>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState("")
  const [hasSavedPhone, setHasSavedPhone] = useState(false)
  const [isCancelUrlDialogOpen, setIsCancelUrlDialogOpen] = useState(false)
  const [cancelingSubscription, setCancelingSubscription] = useState<any>(null)
  const [cancelUrlInput, setCancelUrlInput] = useState("")
  const [isSavingCancelUrl, setIsSavingCancelUrl] = useState(false)
  const [isBudgetExceededDialogOpen, setIsBudgetExceededDialogOpen] = useState(false)
  const [budgetExceededData, setBudgetExceededData] = useState<any>(null)
  const { addNotification } = useNotifications()

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
        addNotification({
          type: "system",
          title: "Error",
          message: "Failed to load subscriptions",
          priority: "high",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptions()
  }, [user, addNotification])

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = sub.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || 
      (sub.category?.name || sub.category || "Other").toLowerCase() === filterCategory.toLowerCase()
    const matchesStatus = filterStatus === "all" || 
      (sub.status || "active").toLowerCase() === filterStatus.toLowerCase()
    const matchesPaymentMethod = filterPaymentMethod === "all" || 
      (sub.payment_method || sub.paymentMethod || "card").toLowerCase() === filterPaymentMethod.toLowerCase()
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPaymentMethod
  })

  const handleAddSubscription = async (newSubscription: any) => {
    try {
      const createdSubscription = await apiClient.createSubscription(newSubscription)
      setSubscriptions([...subscriptions, createdSubscription])
      setIsAddDialogOpen(false)

      addNotification({
        type: "system",
        title: "Subscription Added",
        message: `${newSubscription.name} has been added successfully`,
        priority: "low",
      })
    } catch (error) {
      console.error('Failed to create subscription:', error)
      addNotification({
        type: "system",
        title: "Error",
        message: "Failed to add subscription",
        priority: "high",
      })
    }
  }

  const handleCancelSubscription = async (subscription: any) => {
    // Check if cancellation URL exists
    if (subscription.cancellation_url) {
      // Open the cancellation URL in a new tab
      window.open(subscription.cancellation_url, '_blank')
      addNotification({
        type: "system",
        title: "Opening Cancellation Page",
        message: `Redirecting you to cancel ${subscription.name}`,
        priority: "low",
      })
    } else {
      // Show dialog to add cancellation URL
      setCancelingSubscription(subscription)
      setCancelUrlInput("")
      setIsCancelUrlDialogOpen(true)
    }
  }

  const handleSaveCancelUrl = async () => {
    if (!cancelUrlInput.trim()) {
      addNotification({
        type: "system",
        title: "Invalid URL",
        message: "Please enter a valid cancellation URL",
        priority: "high",
      })
      return
    }

    // Validate URL format
    try {
      new URL(cancelUrlInput)
    } catch (error) {
      addNotification({
        type: "system",
        title: "Invalid URL",
        message: "Please enter a valid URL starting with http:// or https://",
        priority: "high",
      })
      return
    }

    setIsSavingCancelUrl(true)
    try {
      // Update subscription with cancellation URL
      const updateData = {
        name: cancelingSubscription.name,
        price: cancelingSubscription.price,
        billing_cycle: cancelingSubscription.billing_cycle,
        billing_date: cancelingSubscription.billing_date,
        status: cancelingSubscription.status,
        payment_method: cancelingSubscription.payment_method,
        category: cancelingSubscription.category?.name || cancelingSubscription.category,
        description: cancelingSubscription.description,
        website_url: cancelingSubscription.website_url,
        cancellation_url: cancelUrlInput,
      }

      await apiClient.updateSubscription(cancelingSubscription.id, updateData)
      
      // Update local state
      setSubscriptions(subscriptions.map(sub => 
        sub.id === cancelingSubscription.id 
          ? { ...sub, cancellation_url: cancelUrlInput }
          : sub
      ))

      // Close dialog
      setIsCancelUrlDialogOpen(false)
      
      // Open the cancellation URL
      window.open(cancelUrlInput, '_blank')
      
      addNotification({
        type: "system",
        title: "URL Saved",
        message: `Cancellation URL saved and opened for ${cancelingSubscription.name}`,
        priority: "low",
      })
    } catch (error) {
      console.error('Failed to save cancellation URL:', error)
      addNotification({
        type: "system",
        title: "Error",
        message: "Failed to save cancellation URL",
        priority: "high",
      })
    } finally {
      setIsSavingCancelUrl(false)
    }
  }

  const handleDeleteSubscription = async (id: string) => {
    const subscription = subscriptions.find((sub) => sub.id === id)
    const subscriptionName = subscription?.name || 'Subscription'
    
    const confirmDelete = confirm(
      `⚠️ WARNING: You are about to delete "${subscriptionName}" from the app.\n\n` +
      `This will ONLY remove it from your tracking list.\n\n` +
      `To actually cancel the subscription with ${subscriptionName}, you must visit their website separately.\n\n` +
      `Do you want to proceed with removing it from the app?`
    )
    
    if (!confirmDelete) return
    
    try {
      await apiClient.deleteSubscription(id)
      setSubscriptions(subscriptions.filter((sub) => sub.id !== id))

      addNotification({
        type: "system",
        title: "Removed from App",
        message: `${subscriptionName} has been removed from your tracking list. Remember to cancel it with the provider if needed.`,
        priority: "low",
      })
    } catch (error) {
      console.error('Failed to delete subscription:', error)
      addNotification({
        type: "system",
        title: "Error",
        message: "Failed to remove subscription from app",
        priority: "high",
      })
    }
  }

  const handleEditClick = (subscription: any) => {
    setEditingSubscription(subscription)
    setIsEditDialogOpen(true)
  }

  const handlePayNowClick = async (subscription: any) => {
    setPayingSubscription(subscription)
    setPaymentPhoneNumber("")
    setHasSavedPhone(false)
    
    // Try to get saved phone number from settings
    try {
      const paymentMethods = await apiClient.getPaymentMethods()
      if (paymentMethods && Array.isArray(paymentMethods)) {
        const mpesaMethod = paymentMethods.find((pm: any) => pm.type === 'mpesa')
        // Check both phone_number (from backend) and details.phoneNumber (legacy)
        const phoneNumber = mpesaMethod?.phone_number || mpesaMethod?.details?.phoneNumber
        if (phoneNumber) {
          setPaymentPhoneNumber(phoneNumber)
          setHasSavedPhone(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    }
    
    setIsPaymentDialogOpen(true)
  }

  const handlePayNow = async () => {
    if (!payingSubscription) return

    try {
      setIsProcessingPayment(true)

      // Use phone number from input field
      const mpesaPhone = paymentPhoneNumber.trim()

      if (!mpesaPhone) {
        addNotification({
          type: "system",
          title: "Phone Number Required",
          message: "Please enter your M-Pesa phone number",
          priority: "high",
        })
        setIsProcessingPayment(false)
        return
      }

      // Validate phone number format (should be 10 digits starting with 0, or 12 digits starting with 254)
      const phoneDigits = mpesaPhone.replace(/\D/g, '')
      if (phoneDigits.length < 9 || phoneDigits.length > 12) {
        addNotification({
          type: "system",
          title: "Invalid Phone Number",
          message: "Please enter a valid M-Pesa phone number (e.g., 0712345678)",
          priority: "high",
        })
        setIsProcessingPayment(false)
        return
      }

      const result = await paymentService.initiateMpesaPayment(
        mpesaPhone,
        payingSubscription.price,
        payingSubscription.name
      )

      // Check if budget was exceeded
      if (!result.success && result.budget_exceeded) {
        setBudgetExceededData({
          budget: result.budget,
          current_spent: result.current_spent,
          payment_amount: result.payment_amount,
          subscription_name: payingSubscription.name,
        })
        setIsBudgetExceededDialogOpen(true)
        setIsPaymentDialogOpen(false)
        setIsProcessingPayment(false)
        return
      }

      if (result.success) {
        addNotification({
          type: "payment",
          title: "Payment Initiated",
          message: result.message || "Check your phone for the M-Pesa prompt",
          priority: "high",
        })
        setIsPaymentDialogOpen(false)
        setPayingSubscription(null)
      } else {
        addNotification({
          type: "system",
          title: "Payment Failed",
          message: result.error || "Failed to initiate payment",
          priority: "high",
        })
      }
    } catch (error) {
      console.error('Payment error:', error)
      addNotification({
        type: "system",
        title: "Payment Error",
        message: "An error occurred while processing your payment",
        priority: "high",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleEditSubscription = async (updatedData: any) => {
    if (!editingSubscription) return

    try {
      const updated = await apiClient.updateSubscription(editingSubscription.id, updatedData)
      setSubscriptions(subscriptions.map((sub) => 
        sub.id === editingSubscription.id ? { ...sub, ...updated } : sub
      ))
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Failed to update subscription:', error)
    }
  }

  const handlePaystackPayment = async (subscription: any) => {
    if (!user?.email) {
      addNotification({
        type: "system",
        title: "Error",
        message: "User email not found. Please log in again.",
        priority: "high",
      })
      return
    }

    try {
      setIsProcessingPayment(true)

      // Initialize Paystack payment
      const result = await paymentService.initializePaystackPayment(
        user.email,
        subscription.price,
        subscription.name
      )

      // Check if budget was exceeded
      if (!result.success && result.budget_exceeded) {
        setBudgetExceededData({
          budget: result.budget,
          current_spent: result.current_spent,
          payment_amount: result.payment_amount,
          subscription_name: subscription.name,
        })
        setIsBudgetExceededDialogOpen(true)
        setIsProcessingPayment(false)
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

      addNotification({
        type: "payment",
        title: "Payment Initiated",
        message: "Complete payment in the popup window",
        priority: "high",
      })

      // Listen for payment completion
      const checkPaymentStatus = setInterval(async () => {
        if (paystackWindow.closed) {
          clearInterval(checkPaymentStatus)

          // Verify payment
          if (result.reference) {
            const verification = await paymentService.verifyPaystackPayment(result.reference)

            if (verification.success && verification.status === "success") {
              addNotification({
                type: "payment",
                title: "Payment Successful",
                message: `Payment of ${verification.currency} ${verification.amount} for ${subscription.name} was successful!`,
                priority: "high",
              })
            } else {
              addNotification({
                type: "system",
                title: "Payment Failed",
                message: verification.error || "Payment was not completed",
                priority: "high",
              })
            }
          }

          setIsProcessingPayment(false)
        }
      }, 1000)

      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(checkPaymentStatus)
        if (!paystackWindow.closed) {
          paystackWindow.close()
        }
        setIsProcessingPayment(false)
      }, 300000)
    } catch (error) {
      console.error("Payment initialization failed:", error)
      setIsProcessingPayment(false)

      addNotification({
        type: "system",
        title: "Payment Error",
        message: error instanceof Error ? error.message : "Failed to initialize payment",
        priority: "high",
      })
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Entertainment: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
      Productivity: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      "Cloud Services": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      "Health & Fitness": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
  }

  const getPaymentMethodBadge = (method: string) => {
    const methods = {
      card: { label: "Card", color: "bg-blue-100 text-blue-800" },
      paypal: { label: "PayPal", color: "bg-yellow-100 text-yellow-800" },
      mpesa: { label: "M-Pesa", color: "bg-green-100 text-green-800" },
    }
    const methodInfo = methods[method as keyof typeof methods] || {
      label: "Unknown",
      color: "bg-gray-100 text-gray-800",
    }
    return <Badge className={methodInfo.color}>{methodInfo.label}</Badge>
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
                <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
                <p className="text-muted-foreground">Manage all your subscriptions in one place</p>
              </div>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subscription
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">All Categories</option>
              <option value="entertainment">Entertainment</option>
              <option value="productivity">Productivity</option>
              <option value="cloud">Cloud</option>
              <option value="gaming">Gaming</option>
              <option value="fitness">Fitness</option>
              <option value="finance">Finance</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">All Payment Methods</option>
              <option value="card">Card</option>
              <option value="mpesa">M-Pesa</option>
              <option value="paypal">PayPal</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Subscriptions Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">All Subscriptions ({filteredSubscriptions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Service</TableHead>
                    <TableHead className="text-muted-foreground">Category</TableHead>
                    <TableHead className="text-muted-foreground">Cost</TableHead>
                    <TableHead className="text-muted-foreground">Billing</TableHead>
                    <TableHead className="text-muted-foreground">Payment Method</TableHead>
                    <TableHead className="text-muted-foreground">Next Payment</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Loading subscriptions...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-muted-foreground">No subscriptions found</p>
                          {searchTerm ? (
                            <p className="text-sm text-muted-foreground mt-1">
                              Try adjusting your search terms
                            </p>
                          ) : (
                            <Button 
                              variant="outline" 
                              onClick={() => setIsAddDialogOpen(true)}
                              className="mt-2"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add your first subscription
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id} className="border-border hover:bg-accent/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="text-xl">{subscription.icon || "📋"}</div>
                            <div>
                              <p className="font-medium text-foreground">{subscription.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(subscription.category?.name || subscription.category || "Other")}>
                            {(subscription.category?.name || subscription.category || "Other").charAt(0).toUpperCase() + (subscription.category?.name || subscription.category || "Other").slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">KSh {subscription.price?.toFixed(2) || subscription.cost?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell className="text-muted-foreground capitalize">{subscription.billing_cycle || subscription.billingCycle || "monthly"}</TableCell>
                        <TableCell>{getPaymentMethodBadge(subscription.payment_method || subscription.paymentMethod || "card")}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {subscription.billing_date ? new Date(subscription.billing_date).toLocaleDateString() : 
                           subscription.nextPayment ? new Date(subscription.nextPayment).toLocaleDateString() : "Not set"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          >
                            {subscription.status || "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem 
                                className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                onClick={() => handlePaystackPayment(subscription)}
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pay with Card
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                onClick={() => handlePayNowClick(subscription)}
                              >
                                <Wallet className="h-4 w-4 mr-2" />
                                Pay with M-Pesa
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-foreground hover:bg-accent"
                                onClick={() => handleEditClick(subscription)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                onClick={() => handleCancelSubscription(subscription)}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Cancel Subscription
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteSubscription(subscription.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove from App
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Subscription Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Subscription</DialogTitle>
          </DialogHeader>
          <SubscriptionForm onSubmit={handleAddSubscription} onCancel={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Subscription Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
          </DialogHeader>
          {editingSubscription && (
            <EditSubscriptionForm 
              subscription={editingSubscription}
              onSubmit={handleEditSubscription} 
              onCancel={() => {
                setIsEditDialogOpen(false)
                setEditingSubscription(null)
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* M-Pesa Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pay with M-Pesa</DialogTitle>
          </DialogHeader>
          {payingSubscription && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Subscription</p>
                <p className="font-semibold">{payingSubscription.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold">KSh {payingSubscription.price?.toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mpesa-phone" className="flex items-center gap-2">
                  M-Pesa Phone Number
                  {hasSavedPhone && (
                    <Badge variant="secondary" className="text-xs">
                      Saved
                    </Badge>
                  )}
                </Label>
                <Input
                  id="mpesa-phone"
                  type="tel"
                  placeholder="0712345678 or 254712345678"
                  value={paymentPhoneNumber}
                  onChange={(e) => {
                    setPaymentPhoneNumber(e.target.value)
                    setHasSavedPhone(false) // Mark as modified if user changes it
                  }}
                  disabled={isProcessingPayment}
                  className="font-mono"
                />
                {hasSavedPhone ? (
                  <p className="text-xs text-muted-foreground">
                    Using your saved M-Pesa number from Settings. You can change it here if needed.
                  </p>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>No saved number.</span>
                    <Link 
                      href="/settings?tab=payment" 
                      className="text-primary hover:underline inline-flex items-center gap-1"
                      onClick={() => setIsPaymentDialogOpen(false)}
                    >
                      <SettingsIcon className="h-3 w-3" />
                      Add in Settings
                    </Link>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPaymentDialogOpen(false)
                    setPayingSubscription(null)
                    setPaymentPhoneNumber("")
                  }}
                  disabled={isProcessingPayment}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePayNow}
                  disabled={isProcessingPayment || !paymentPhoneNumber.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Send Payment Prompt
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel URL Dialog */}
      <Dialog open={isCancelUrlDialogOpen} onOpenChange={setIsCancelUrlDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Cancellation URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No cancellation URL found for <strong>{cancelingSubscription?.name}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Please enter the URL where you can cancel this subscription on the provider's website.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancel-url">Cancellation URL</Label>
              <Input
                id="cancel-url"
                type="url"
                value={cancelUrlInput}
                onChange={(e) => setCancelUrlInput(e.target.value)}
                placeholder="https://example.com/cancel"
                disabled={isSavingCancelUrl}
              />
              <p className="text-xs text-muted-foreground">
                Example: https://netflix.com/cancelplan or https://spotify.com/account/subscription
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCancelUrlDialogOpen(false)
                  setCancelingSubscription(null)
                  setCancelUrlInput("")
                }}
                disabled={isSavingCancelUrl}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCancelUrl}
                disabled={isSavingCancelUrl || !cancelUrlInput.trim()}
              >
                {isSavingCancelUrl ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save & Open URL"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Budget Exceeded Dialog */}
      <Dialog open={isBudgetExceededDialogOpen} onOpenChange={setIsBudgetExceededDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Budget Exceeded
            </DialogTitle>
          </DialogHeader>
          
          {budgetExceededData && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
                  Cannot process payment for <strong>{budgetExceededData.subscription_name}</strong>
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Your active subscriptions exceed your monthly budget limit.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Monthly Budget:</span>
                  <span className="text-lg font-bold text-foreground">KSh {budgetExceededData.budget?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Active Subscriptions:</span>
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">KSh {budgetExceededData.current_spent?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">Over Budget By:</span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    KSh {(budgetExceededData.current_spent - budgetExceededData.budget)?.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">💡 What you can do:</p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Cancel or pause some subscriptions to reduce spending</li>
                  <li>Increase your monthly budget in Budget Settings</li>
                  <li>Wait until subscriptions are cancelled with providers</li>
                </ul>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsBudgetExceededDialogOpen(false)}
                >
                  Close
                </Button>
                <Link href="/budget">
                  <Button className="bg-primary hover:bg-primary/90">
                    Adjust Budget
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
