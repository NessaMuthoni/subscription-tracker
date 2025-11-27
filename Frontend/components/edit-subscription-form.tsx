"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface EditSubscriptionFormProps {
  subscription: any
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function EditSubscriptionForm({ subscription, onSubmit, onCancel }: EditSubscriptionFormProps) {
  // Extract category name from subscription
  const getCategoryName = () => {
    if (subscription.category?.name) return subscription.category.name
    if (typeof subscription.category === 'string') return subscription.category
    return "Other"
  }

  const [formData, setFormData] = useState({
    name: subscription.name || "",
    price: subscription.price?.toString() || subscription.cost?.toString() || "",
    billing_cycle: subscription.billing_cycle || subscription.billingCycle || "monthly",
    billing_date: subscription.billing_date 
      ? new Date(subscription.billing_date).toISOString().split('T')[0]
      : subscription.nextPayment 
        ? new Date(subscription.nextPayment).toISOString().split('T')[0]
        : "",
    payment_method: subscription.payment_method || subscription.paymentMethod || "card",
    category: getCategoryName(),
    description: subscription.description || "",
    website_url: subscription.website_url || subscription.website || "",
    status: subscription.status || "active",
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const updateData = {
        name: formData.name,
        price: Number.parseFloat(formData.price),
        billing_cycle: formData.billing_cycle,
        billing_date: new Date(formData.billing_date).toISOString(),
        status: formData.status,
        payment_method: formData.payment_method,
        category: formData.category,
        description: formData.description || null,
        website_url: formData.website_url || null,
      }

      await onSubmit(updateData)
      // Close dialog after successful submission
      onCancel()
    } catch (error) {
      console.error("Failed to update subscription:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Subscription Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Netflix, Spotify, etc."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (KSh)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="1200"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing_cycle">Billing Cycle</Label>
          <Select
            value={formData.billing_cycle}
            onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
          >
            <SelectTrigger id="billing_cycle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="billing_date">Next Billing Date</Label>
          <Input
            id="billing_date"
            type="date"
            value={formData.billing_date}
            onChange={(e) => setFormData({ ...formData, billing_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method">Payment Method</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
          >
            <SelectTrigger id="payment_method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger id="category">
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
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Add notes about this subscription..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website_url">Website URL (Optional)</Label>
        <Input
          id="website_url"
          type="url"
          value={formData.website_url}
          onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
          placeholder="https://example.com"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
