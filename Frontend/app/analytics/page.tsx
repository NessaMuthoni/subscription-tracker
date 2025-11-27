"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts"
import { Sidebar } from "@/components/sidebar"
import { TrendingUp, PieChartIcon, BarChart3, DollarSign, Loader2 } from "lucide-react"
import { MobileMenu } from "@/components/sidebar"
import { useAuth } from "@/components/auth-provider"
import { apiClient } from "@/lib/api-client"

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [monthlyTrendData, setMonthlyTrendData] = useState<any[]>([])

  const chartColors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#f97316"]

  // Fetch subscriptions and calculate analytics
  useEffect(() => {
    async function fetchAnalytics() {
      if (!user) return

      try {
        setIsLoading(true)
        const data = await apiClient.getSubscriptions()
        setSubscriptions(data || [])

        // Calculate category data
        const categoryTotals: Record<string, number> = {}
        
        if (data) {
          data.forEach((sub: any) => {
            const category = sub.category?.name || "Other"
            const amount = sub.price || sub.cost || 0
            categoryTotals[category] = (categoryTotals[category] || 0) + amount
          })
        }

        const categoryDataArray = Object.entries(categoryTotals).map(([category, amount], index) => ({
          category,
          amount,
          color: chartColors[index % chartColors.length]
        }))
        setCategoryData(categoryDataArray)

        // Generate trend data (last 6 months with current month data)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        // Helper function to check if a subscription is billed in a specific month
        const isSubscriptionBilledInMonth = (sub: any, targetMonth: Date): boolean => {
          const billingDate = sub.billing_date ? new Date(sub.billing_date) : null
          if (!billingDate) return false
          
          const createdDate = sub.created_at ? new Date(sub.created_at) : billingDate
          
          // If the subscription wasn't created yet, don't count it
          if (targetMonth < new Date(createdDate.getFullYear(), createdDate.getMonth(), 1)) {
            return false
          }
          
          // If the billing date is in the future relative to target month, don't count it
          if (billingDate > new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0)) {
            return false
          }
          
          return true
        }
        
        const trendData = []
        const today = new Date()
        
        for (let i = 5; i >= 0; i--) {
          // Calculate the date for this month in the trend
          const trendMonth = new Date(today.getFullYear(), today.getMonth() - i, 1)
          const monthIndex = trendMonth.getMonth()
          
          // Calculate spending for this specific month
          let monthSpending = 0
          
          if (i === 0) {
            // Current month - only count subscriptions that have been billed or are due this month
            monthSpending = (data || []).reduce((sum: number, sub: any) => {
              const billingDate = sub.billing_date ? new Date(sub.billing_date) : null
              if (!billingDate) return sum
              
              // Only count if billing date is today or in the past of current month
              const isBilledThisMonth = billingDate.getMonth() === today.getMonth() && 
                                        billingDate.getFullYear() === today.getFullYear() &&
                                        billingDate <= today
              
              return isBilledThisMonth ? sum + (sub.price || sub.cost || 0) : sum
            }, 0)
          } else {
            // Past months - estimate based on subscriptions that were active then
            monthSpending = (data || []).reduce((sum: number, sub: any) => {
              if (isSubscriptionBilledInMonth(sub, trendMonth)) {
                return sum + (sub.price || sub.cost || 0)
              }
              return sum
            }, 0)
          }
          
          trendData.push({
            month: monthNames[monthIndex],
            amount: Math.round(monthSpending * 100) / 100
          })
        }
        setMonthlyTrendData(trendData)

      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        setSubscriptions([])
        setCategoryData([])
        setMonthlyTrendData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [user])

  const totalMonthly = categoryData.reduce((sum, item) => sum + item.amount, 0)

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
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-muted-foreground">Detailed insights into your subscription spending</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Categories</CardTitle>
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{categoryData.length}</div>
                <p className="text-xs text-muted-foreground">Active spending categories</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Highest Category</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-2xl font-bold text-foreground">--</div>
                ) : categoryData.length > 0 ? (
                  <>
                    <div className="text-2xl font-bold text-foreground">
                      {categoryData.sort((a, b) => b.amount - a.amount)[0]?.category || "None"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      KSh {categoryData.sort((a, b) => b.amount - a.amount)[0]?.amount.toFixed(2) || "0.00"}/month
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-foreground">No Data</div>
                    <p className="text-xs text-muted-foreground">Add subscriptions to see data</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-2xl font-bold text-foreground">--</div>
                ) : monthlyTrendData.length >= 2 ? (
                  <>
                    <div className="text-2xl font-bold text-foreground">
                      {(((monthlyTrendData[monthlyTrendData.length - 1]?.amount || 0) - 
                         (monthlyTrendData[monthlyTrendData.length - 2]?.amount || 0)) / 
                         (monthlyTrendData[monthlyTrendData.length - 2]?.amount || 1) * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Compared to last month</p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-foreground">N/A</div>
                    <p className="text-xs text-muted-foreground">Insufficient data</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Monthly</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">KSh {totalMonthly.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Current spending</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend Line Chart - Full Width at Top */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Spending Trend Over Time</CardTitle>
              <CardDescription className="text-muted-foreground">6-month spending history</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="flex items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading trend data...</span>
                  </div>
                </div>
              ) : monthlyTrendData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No trend data available</p>
                    <p className="text-sm text-muted-foreground mt-1">Historical data will appear here over time</p>
                  </div>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    amount: {
                      label: "Amount",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 'auto']} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Charts Grid - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Pie Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Spending by Category</CardTitle>
                <CardDescription className="text-muted-foreground">Monthly spending breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[350px] flex items-center justify-center">
                    <div className="flex items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading chart data...</span>
                    </div>
                  </div>
                ) : categoryData.length === 0 ? (
                  <div className="h-[350px] flex items-center justify-center">
                    <div className="text-center">
                      <PieChartIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No spending data available</p>
                      <p className="text-sm text-muted-foreground mt-1">Add subscriptions to see the breakdown</p>
                    </div>
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      amount: {
                        label: "Amount",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[350px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, amount }: any) => `${category}: KSh ${amount.toFixed(0)}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Individual Subscriptions Bar Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Individual Subscriptions</CardTitle>
                <CardDescription className="text-muted-foreground">Monthly costs comparison</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[350px] flex items-center justify-center">
                    <div className="flex items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading subscriptions...</span>
                    </div>
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="h-[350px] flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No subscription data available</p>
                      <p className="text-sm text-muted-foreground mt-1">Add subscriptions to see individual costs</p>
                    </div>
                  </div>
                ) : (
                  <ChartContainer
                    config={{
                      monthly: {
                        label: "Monthly",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-[350px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subscriptions.map(sub => ({ 
                        name: sub.name, 
                        monthly: sub.price || sub.cost || 0 
                      }))}>
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={100}
                          interval={0}
                        />
                        <YAxis domain={[0, 'auto']} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="monthly" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
