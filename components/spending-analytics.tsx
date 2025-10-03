"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, PieChartIcon, BarChart3 } from "lucide-react"

interface Subscription {
  id: number
  name: string
  cost: number
  billingCycle: string
  nextPayment: string
  category: string
  status: string
  aiConfidence: number
}

interface SpendingAnalyticsProps {
  subscriptions: Subscription[]
}

export function SpendingAnalytics({ subscriptions }: SpendingAnalyticsProps) {
  // Process data for charts
  const categoryData = subscriptions.reduce(
    (acc, sub) => {
      const monthlyCost = sub.billingCycle === "monthly" ? sub.cost : sub.cost / 12
      acc[sub.category] = (acc[sub.category] || 0) + monthlyCost
      return acc
    },
    {} as Record<string, number>,
  )

  const categoryChartData = Object.entries(categoryData).map(([category, amount]) => ({
    category,
    amount: Number.parseFloat(amount.toFixed(2)),
  }))

  // Monthly trend data (simulated)
  const monthlyTrendData = [
    { month: "Oct", amount: 180.5 },
    { month: "Nov", amount: 195.75 },
    { month: "Dec", amount: 213.23 },
    { month: "Jan", amount: 213.23 },
    { month: "Feb", amount: categoryChartData.reduce((sum, item) => sum + item.amount, 0) },
  ]

  // Individual subscription data for bar chart
  const subscriptionData = subscriptions.map((sub) => ({
    name: sub.name,
    monthly: sub.billingCycle === "monthly" ? sub.cost : sub.cost / 12,
    yearly: sub.billingCycle === "monthly" ? sub.cost * 12 : sub.cost,
  }))

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", "#d084d0"]

  const totalMonthly = categoryChartData.reduce((sum, item) => sum + item.amount, 0)
  const totalYearly = totalMonthly * 12

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryChartData.length}</div>
            <p className="text-xs text-muted-foreground">Active spending categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Category</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryChartData.length > 0
                ? categoryChartData.reduce((max, item) => (item.amount > max.amount ? item : max)).category
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              $
              {categoryChartData.length > 0
                ? categoryChartData.reduce((max, item) => (item.amount > max.amount ? item : max)).amount.toFixed(2)
                : "0.00"}
              /month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+8.2%</div>
            <p className="text-xs text-muted-foreground">Compared to last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Monthly spending breakdown by service category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: {
                  label: "Amount",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, amount }) => `${category}: $${amount}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
            <CardDescription>Monthly spending over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: {
                  label: "Amount",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} dot={{ fill: "#8884d8" }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Individual Subscriptions Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Subscriptions</CardTitle>
          <CardDescription>Monthly and yearly costs for each subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              monthly: {
                label: "Monthly",
                color: "hsl(var(--chart-1))",
              },
              yearly: {
                label: "Yearly",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subscriptionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="monthly" fill="#8884d8" name="Monthly Cost" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Category Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Category Insights</CardTitle>
          <CardDescription>Detailed breakdown of spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryChartData.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div>
                    <h4 className="font-medium">{category.category}</h4>
                    <p className="text-sm text-muted-foreground">
                      {subscriptions.filter((sub) => sub.category === category.category).length} subscription(s)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${category.amount.toFixed(2)}/month</div>
                  <div className="text-sm text-muted-foreground">${(category.amount * 12).toFixed(2)}/year</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
