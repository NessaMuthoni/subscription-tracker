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
import { Edit, Trash2, MoreHorizontal, Plus, Brain, Sparkles } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    cost: "",
    billingCycle: "monthly",
    nextPayment: "",
    category: "",
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

  const getCategoryColor = (category: string) => {
    const colors = {
      Entertainment: "bg-purple-100 text-purple-800",
      Productivity: "bg-blue-100 text-blue-800",
      "Cloud Services": "bg-green-100 text-green-800",
      "Health & Fitness": "bg-orange-100 text-orange-800",
      Other: "bg-gray-100 text-gray-800",
    }
    return colors[category as keyof typeof colors] || colors.Other
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
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Leave blank for AI categorization"
                    />
                  </div>
                  <Button onClick={handleAddSubscription} className="w-full">
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
                        <DropdownMenuItem onClick={() => handleEditSubscription(subscription)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteSubscription(subscription.id)}
                          className="text-red-600"
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
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
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
