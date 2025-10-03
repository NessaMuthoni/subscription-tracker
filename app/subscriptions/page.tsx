"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sidebar } from "@/components/sidebar"
import { SubscriptionForm } from "@/components/subscription-form"
import { useNotifications } from "@/components/notification-provider"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Filter } from "lucide-react"
import { MobileMenu } from "@/components/sidebar"

const initialSubscriptions = [
  {
    id: 1,
    name: "Netflix",
    cost: 15.99,
    billingCycle: "Monthly",
    nextPayment: "2024-02-15",
    category: "Entertainment",
    status: "Active",
    icon: "🎬",
    paymentMethod: "card",
  },
  {
    id: 2,
    name: "Spotify Premium",
    cost: 9.99,
    billingCycle: "Monthly",
    nextPayment: "2024-02-10",
    category: "Entertainment",
    status: "Active",
    icon: "🎵",
    paymentMethod: "paypal",
  },
  {
    id: 3,
    name: "Adobe Creative Suite",
    cost: 52.99,
    billingCycle: "Monthly",
    nextPayment: "2024-02-20",
    category: "Productivity",
    status: "Active",
    icon: "🎨",
    paymentMethod: "card",
  },
  {
    id: 4,
    name: "AWS",
    cost: 89.5,
    billingCycle: "Monthly",
    nextPayment: "2024-02-12",
    category: "Cloud Services",
    status: "Active",
    icon: "☁️",
    paymentMethod: "card",
  },
  {
    id: 5,
    name: "Gym Membership",
    cost: 45.0,
    billingCycle: "Monthly",
    nextPayment: "2024-02-18",
    category: "Health & Fitness",
    status: "Active",
    icon: "💪",
    paymentMethod: "mpesa",
  },
]

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { addNotification } = useNotifications()

  const filteredSubscriptions = subscriptions.filter((sub) => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleAddSubscription = (newSubscription: any) => {
    setSubscriptions([...subscriptions, newSubscription])
    setIsAddDialogOpen(false)

    addNotification({
      type: "system",
      title: "Subscription Added",
      message: `${newSubscription.name} has been added successfully`,
      priority: "low",
    })
  }

  const handleDeleteSubscription = (id: number) => {
    const subscription = subscriptions.find((sub) => sub.id === id)
    setSubscriptions(subscriptions.filter((sub) => sub.id !== id))

    addNotification({
      type: "system",
      title: "Subscription Deleted",
      message: `${subscription?.name} has been removed`,
      priority: "low",
    })
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
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id} className="border-border hover:bg-accent/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="text-xl">{subscription.icon}</div>
                          <div>
                            <p className="font-medium text-foreground">{subscription.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(subscription.category)}>{subscription.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">${subscription.cost.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">{subscription.billingCycle}</TableCell>
                      <TableCell>{getPaymentMethodBadge(subscription.paymentMethod)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(subscription.nextPayment).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        >
                          {subscription.status}
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
                            <DropdownMenuItem className="text-foreground hover:bg-accent">
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
                  ))}
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
    </div>
  )
}
