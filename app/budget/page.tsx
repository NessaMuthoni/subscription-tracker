"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Sidebar } from "@/components/sidebar"
import { Target, DollarSign, TrendingUp, Edit } from "lucide-react"
import { MobileMenu } from "@/components/sidebar"

const budgetData = [
  { category: "Entertainment", budget: 50, spent: 25.98, color: "#8b5cf6" },
  { category: "Productivity", budget: 80, spent: 52.99, color: "#06b6d4" },
  { category: "Cloud Services", budget: 100, spent: 89.5, color: "#10b981" },
  { category: "Health & Fitness", budget: 60, spent: 45, color: "#f59e0b" },
]

const chartData = budgetData.map((item) => ({
  category: item.category,
  budget: item.budget,
  spent: item.spent,
}))

export default function BudgetPage() {
  const [monthlyBudget, setMonthlyBudget] = useState(300)
  const [isEditing, setIsEditing] = useState(false)

  const totalSpent = budgetData.reduce((sum, item) => sum + item.spent, 0)
  const budgetUsed = (totalSpent / monthlyBudget) * 100
  const remainingBudget = monthlyBudget - totalSpent

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
                <h1 className="text-2xl font-bold text-foreground">Budget Planning</h1>
                <p className="text-muted-foreground">Track and manage your subscription spending</p>
              </div>
            </div>
          </div>

          {/* Budget Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Budget</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                      className="text-2xl font-bold h-auto p-0 border-none bg-transparent"
                      onBlur={() => setIsEditing(false)}
                      onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
                      autoFocus
                    />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">${monthlyBudget}</div>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-6 w-6 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Current budget limit</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">${totalSpent.toFixed(2)}</div>
                <p className={`text-xs ${budgetUsed > 90 ? "text-red-500" : "text-muted-foreground"}`}>
                  {budgetUsed.toFixed(1)}% of budget used
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${remainingBudget > 0 ? remainingBudget.toFixed(2) : "0.00"}
                </div>
                <p className="text-xs text-muted-foreground">Available to spend</p>
              </CardContent>
            </Card>
          </div>

          {/* Budget Progress */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Budget Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Overall Budget Usage</span>
                    <span className="text-foreground font-medium">{budgetUsed.toFixed(1)}%</span>
                  </div>
                  <Progress value={budgetUsed} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Budgets */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Category Budgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetData.map((item) => {
                  const percentage = (item.spent / item.budget) * 100
                  const isOverBudget = percentage > 100

                  return (
                    <div key={item.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            ${item.spent.toFixed(2)} / ${item.budget.toFixed(2)}
                          </span>
                          <Badge variant={isOverBudget ? "destructive" : "secondary"}>{percentage.toFixed(0)}%</Badge>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        className={`h-2 ${isOverBudget ? "bg-red-100" : ""}`}
                      />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Budget vs Spending Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Budget vs Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  budget: {
                    label: "Budget",
                    color: "hsl(var(--muted-foreground))",
                  },
                  spent: {
                    label: "Spent",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="budget" fill="hsl(var(--muted-foreground))" name="Budget" opacity={0.6} />
                    <Bar dataKey="spent" fill="hsl(var(--primary))" name="Spent" />
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
