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
import { useAuth } from "@/components/auth-provider"
import { apiClient } from "@/lib/api-client"
import { useEffect } from "react"

interface BudgetData {
  category: string
  budget: number
  spent: number
  color: string
}

export default function BudgetPage() {
  const { user, updateUser } = useAuth()
  const [budgetData, setBudgetData] = useState<BudgetData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [monthlyBudget, setMonthlyBudget] = useState(300)
  const [editableBudget, setEditableBudget] = useState(300)
  const [isEditing, setIsEditing] = useState(false)

  // Sync monthly budget from user preferences
  useEffect(() => {
    const budgetValue = user?.preferences?.budget?.monthly || 300
    setMonthlyBudget(budgetValue)
    setEditableBudget(budgetValue)
  }, [user?.preferences?.budget?.monthly])

  // Save budget changes
  const handleSaveBudget = () => {
    if (editableBudget !== monthlyBudget && user && updateUser) {
      // Create default preferences structure
      const defaultPreferences = {
        notifications: { email: true, push: true, sms: false, reminderDays: 3 },
        budget: { monthly: 300, currency: "KES", checkBalance: false },
        ai: { categorization: true, predictions: true, recommendations: true },
        calendar: { googleSync: false },
      }
      
      // Update user preferences with new budget
      updateUser({
        ...user,
        preferences: {
          ...defaultPreferences,
          ...user.preferences,
          budget: {
            ...defaultPreferences.budget,
            ...user.preferences?.budget,
            monthly: editableBudget,
          }
        }
      })
      
      setMonthlyBudget(editableBudget)
    }
    setIsEditing(false)
  }

  // Fetch budget data
  useEffect(() => {
    const fetchBudgetData = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        
        // TODO: Fetch real budget data from backend
        // For now, calculate from subscriptions
        const subscriptions = await apiClient.getSubscriptions()
        
        const categoryTotals: { [key: string]: number } = {}
        subscriptions?.forEach((sub: any) => {
          const category = (sub.category?.name || sub.category || "Other").toLowerCase()
          const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1)
          const price = sub.price || sub.cost || 0
          
          // Only count active subscriptions
          if (sub.status === 'active' || !sub.status) {
            categoryTotals[capitalizedCategory] = (categoryTotals[capitalizedCategory] || 0) + Number(price)
          }
        })

        const totalSpending = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)
        
        const colors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#f97316", "#ec4899", "#14b8a6"]
        const budgetCategories: BudgetData[] = Object.entries(categoryTotals)
          .sort(([, a], [, b]) => b - a) // Sort by spending descending
          .map(([category, spent], index) => {
            // Allocate budget proportionally based on spending
            const proportion = totalSpending > 0 ? spent / totalSpending : 1 / Object.keys(categoryTotals).length
            const allocatedBudget = monthlyBudget * proportion
            
            return {
              category,
              spent: Number(spent.toFixed(2)),
              budget: Number(allocatedBudget.toFixed(2)),
              color: colors[index % colors.length]
            }
          })

        setBudgetData(budgetCategories)
      } catch (error) {
        console.error('Failed to fetch budget data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBudgetData()
  }, [user, monthlyBudget])
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
                      value={editableBudget}
                      onChange={(e) => setEditableBudget(Number(e.target.value))}
                      className="text-2xl font-bold h-auto p-0 border-none bg-transparent"
                      onBlur={handleSaveBudget}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveBudget()
                        } else if (e.key === "Escape") {
                          setEditableBudget(monthlyBudget)
                          setIsEditing(false)
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">KSh {monthlyBudget}</div>
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
                <div className="text-2xl font-bold text-foreground">KSh {totalSpent.toFixed(2)}</div>
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
                  KSh {remainingBudget > 0 ? remainingBudget.toFixed(2) : "0.00"}
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
                            KSh {item.spent.toFixed(2)} / KSh {item.budget.toFixed(2)}
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
                  <BarChart data={budgetData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
