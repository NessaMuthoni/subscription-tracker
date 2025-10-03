"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Sidebar } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { useNotifications } from "@/components/notification-provider"
import { DollarSign, TrendingUp, CreditCard, Calendar, Plus, MoreHorizontal, Brain, Sparkles } from "lucide-react"
import Link from "next/link"
import { MobileMenu } from "@/components/sidebar"

// Mock data
const subscriptions = [
  {
    id: 1,
    name: "Netflix",
    cost: 15.99,
    nextPayment: "2024-02-15",
    category: "Entertainment",
    status: "active",
    icon: "🎬",
  },
  {
    id: 2,
    name: "Spotify Premium",
    cost: 9.99,
    nextPayment: "2024-02-10",
    category: "Entertainment",
    status: "active",
    icon: "🎵",
  },
  {
    id: 3,
    name: "Adobe Creative Suite",
    cost: 52.99,
    nextPayment: "2024-02-20",
    category: "Productivity",
    status: "active",
    icon: "🎨",
  },
  {
    id: 4,
    name: "AWS",
    cost: 89.5,
    nextPayment: "2024-02-12",
    category: "Cloud Services",
    status: "active",
    icon: "☁️",
  },
  {
    id: 5,
    name: "Gym Membership",
    cost: 45.0,
    nextPayment: "2024-02-18",
    category: "Health & Fitness",
    status: "active",
    icon: "💪",
  },
  {
    id: 6,
    name: "Disney+",
    cost: 7.99,
    nextPayment: "2024-02-25",
    category: "Entertainment",
    status: "active",
    icon: "🏰",
  },
]

const chartData = [
  { month: "Jan", amount: 180 },
  { month: "Feb", amount: 213 },
  { month: "Mar", amount: 195 },
  { month: "Apr", amount: 225 },
  { month: "May", amount: 240 },
  { month: "Jun", amount: 210 },
]

function DashboardContent() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()

  const totalMonthlySpend = subscriptions.reduce((sum, sub) => sum + sub.cost, 0)
  const totalYearlySpend = totalMonthlySpend * 12
  const monthlyBudget = user?.preferences.budget.monthly || 300
  const budgetUsed = (totalMonthlySpend / monthlyBudget) * 100

  const handleAddSubscription = () => {
    addNotification({
      type: "system",
      title: "Add Subscription",
      message: "Redirecting to add subscription form",
      priority: "low",
    })
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="w-64 flex-shrink-0 hidden lg:flex" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <MobileMenu />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user?.name}! 👋</p>
              </div>
            </div>
            <Link href="/subscriptions/add">
              <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto" onClick={handleAddSubscription}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subscription
              </Button>
            </Link>
          </div>

          {/* AI Insights Banner */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    AI Insights
                    <Sparkles className="h-4 w-4 text-primary" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You could save $45/year by switching to annual billing for Netflix and Spotify
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscriptions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{subscriptions.length}</div>
                <p className="text-xs text-green-500">+2 from last month</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Spend</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">${totalMonthlySpend.toFixed(2)}</div>
                <p className="text-xs text-red-500">+12% from last month</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Yearly Projection</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">${totalYearlySpend.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Based on current subscriptions</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Budget Used</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{budgetUsed.toFixed(0)}%</div>
                <Progress value={budgetUsed} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Subscriptions Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Active Subscriptions</h2>
              <Link href="/subscriptions">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {subscriptions.map((subscription) => (
                <Card key={subscription.id} className="bg-card border-border hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{subscription.icon}</div>
                        <div>
                          <h3 className="font-medium text-foreground">{subscription.name}</h3>
                          <p className="text-sm text-muted-foreground">{subscription.category}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-foreground">${subscription.cost}</p>
                        <p className="text-xs text-muted-foreground">per month</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Next payment</p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(subscription.nextPayment).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Badge variant="secondary" className="text-xs">
                        {subscription.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Spending Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Monthly Spending Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  amount: {
                    label: "Amount",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
