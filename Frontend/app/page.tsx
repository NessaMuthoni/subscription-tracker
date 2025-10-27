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
import { apiClient } from "@/lib/api-client"
import { useEffect, useState } from "react"

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
}

interface ChartData {
  month: string
  amount: number
}

function DashboardContent() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch subscriptions and analytics data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        
        // Fetch subscriptions
        const subsData = await apiClient.getSubscriptions()
        setSubscriptions(subsData || [])

        // TODO: Fetch analytics data when endpoint is available
        // For now, generate chart data based on subscriptions
        const monthlySpend = (subsData || []).reduce((sum: number, sub: Subscription) => sum + sub.price, 0)
        const mockChartData: ChartData[] = [
          { month: "Jan", amount: monthlySpend * 0.8 },
          { month: "Feb", amount: monthlySpend * 0.9 },
          { month: "Mar", amount: monthlySpend * 0.85 },
          { month: "Apr", amount: monthlySpend * 1.1 },
          { month: "May", amount: monthlySpend * 1.05 },
          { month: "Jun", amount: monthlySpend },
        ]
        setChartData(mockChartData)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        addNotification({
          type: "system",
          title: "Error",
          message: "Failed to load dashboard data",
          priority: "high",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, addNotification])

  const totalMonthlySpend = subscriptions.reduce((sum, sub) => sum + sub.price, 0)
  const totalYearlySpend = totalMonthlySpend * 12
  const monthlyBudget = user?.preferences?.budget?.monthly || 300
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
                    {subscriptions.length > 0 
                      ? `Analyzing {subscriptions.length} subscriptions for potential savings...`
                      : "Add subscriptions to get AI-powered insights"
                    }
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
                <p className="text-xs text-muted-foreground">Active subscriptions</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Spend</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">KSh {totalMonthlySpend.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Current month</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Yearly Projection</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">KSh {totalYearlySpend.toFixed(2)}</div>
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
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="animate-pulse">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-muted rounded"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-24"></div>
                            <div className="h-3 bg-muted rounded w-16"></div>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div className="space-y-2">
                            <div className="h-6 bg-muted rounded w-16"></div>
                            <div className="h-3 bg-muted rounded w-12"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-muted rounded w-20"></div>
                            <div className="h-4 bg-muted rounded w-16"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : subscriptions.length === 0 ? (
                <Card className="bg-card border-border col-span-full">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">No subscriptions found</p>
                    <Link href="/subscriptions/add">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Subscription
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                subscriptions.slice(0, 6).map((subscription) => (
                  <Card key={subscription.id} className="bg-card border-border hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{subscription.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {subscription.category?.name || "Uncategorized"}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-foreground">KSh {subscription.price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">per month</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Next payment</p>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(subscription.billing_date).toLocaleDateString()}
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
                ))
              )}
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
