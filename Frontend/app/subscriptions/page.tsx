"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Filter, Loader2 } from "lucide-react"
import { MobileMenu } from "@/components/sidebar"

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<any>(null)
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

  const filteredSubscriptions = subscriptions.filter((sub) => 
    sub.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const handleDeleteSubscription = async (id: string) => {
    try {
      await apiClient.deleteSubscription(id)
      const subscription = subscriptions.find((sub) => sub.id === id)
      setSubscriptions(subscriptions.filter((sub) => sub.id !== id))

      addNotification({
        type: "system",
        title: "Subscription Deleted",
        message: `${subscription?.name || 'Subscription'} has been deleted`,
        priority: "low",
      })
    } catch (error) {
      console.error('Failed to delete subscription:', error)
      addNotification({
        type: "system",
        title: "Error",
        message: "Failed to delete subscription",
        priority: "high",
      })
    }
  }

  const handleEditClick = (subscription: any) => {
    setEditingSubscription(subscription)
    setIsEditDialogOpen(true)
  }

  const handleEditSubscription = async (updatedData: any) => {
    if (!editingSubscription) return

    try {
      const updated = await apiClient.updateSubscription(editingSubscription.id, updatedData)
      setSubscriptions(subscriptions.map((sub) => 
        sub.id === editingSubscription.id ? { ...sub, ...updated } : sub
      ))
      setIsEditDialogOpen(false)
      setEditingSubscription(null)

      addNotification({
        type: "system",
        title: "Subscription Updated",
        message: `${updatedData.name} has been updated successfully`,
        priority: "low",
      })
    } catch (error) {
      console.error('Failed to update subscription:', error)
      addNotification({
        type: "system",
        title: "Error",
        message: "Failed to update subscription",
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
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <Button variant="outline" className="border-border bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
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
                            {subscription.category?.name || subscription.category || "Other"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">KSh {subscription.price?.toFixed(2) || subscription.cost?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell className="text-muted-foreground">{subscription.billingCycle || "Monthly"}</TableCell>
                        <TableCell>{getPaymentMethodBadge(subscription.paymentMethod || "card")}</TableCell>
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
                                className="text-foreground hover:bg-accent"
                                onClick={() => handleEditClick(subscription)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteSubscription(subscription.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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
    </div>
  )
}
