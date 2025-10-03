"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { Target, AlertTriangle, CheckCircle, TrendingUp, DollarSign } from "lucide-react"

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

interface BudgetPlannerProps {
  subscriptions: Subscription[]
  monthlyBudget: number
  setMonthlyBudget: (budget: number) => void
}

export function BudgetPlanner({ subscriptions, monthlyBudget, setMonthlyBudget }: BudgetPlannerProps) {
  const [budgetInput, setBudgetInput] = useState(monthlyBudget.toString())
  const [savingsGoal, setSavingsGoal] = useState(50)

  // Calculate current spending
  const currentSpending = subscriptions.reduce((sum, sub) => {
    if (sub.billingCycle === "monthly") return sum + sub.cost
    if (sub.billingCycle === "yearly") return sum + sub.cost / 12
    return sum
  }, 0)

  const budgetUsed = (currentSpending / monthlyBudget) * 100
  const remainingBudget = monthlyBudget - currentSpending
  const potentialSavings = remainingBudget > 0 ? remainingBudget : 0

  // Category breakdown
  const categorySpending = subscriptions.reduce(
    (acc, sub) => {
      const monthlyCost = sub.billingCycle === "monthly" ? sub.cost : sub.cost / 12
      acc[sub.category] = (acc[sub.category] || 0) + monthlyCost
      return acc
    },
    {} as Record<string, number>,
  )

  const categoryBudgets = {
    Entertainment: monthlyBudget * 0.3,
    Productivity: monthlyBudget * 0.25,
    "Cloud Services": monthlyBudget * 0.2,
    "Health & Fitness": monthlyBudget * 0.15,
    Other: monthlyBudget * 0.1,
  }

  const handleUpdateBudget = () => {
    const newBudget = Number.parseFloat(budgetInput)
    if (newBudget > 0) {
      setMonthlyBudget(newBudget)
    }
  }

  const getBudgetStatus = () => {
    if (budgetUsed > 100) return { status: "over", color: "text-red-600", icon: AlertTriangle }
    if (budgetUsed > 90) return { status: "warning", color: "text-orange-600", icon: AlertTriangle }
    return { status: "good", color: "text-green-600", icon: CheckCircle }
  }

  const budgetStatus = getBudgetStatus()
  const StatusIcon = budgetStatus.icon

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyBudget.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current budget limit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentSpending.toFixed(2)}</div>
            <p className={`text-xs ${budgetStatus.color} flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {budgetUsed.toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${remainingBudget > 0 ? remainingBudget.toFixed(2) : "0.00"}</div>
            <p className="text-xs text-muted-foreground">Available to spend</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Status Alert */}
      {budgetUsed > 90 && (
        <Alert className={budgetUsed > 100 ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}>
          <AlertTriangle className={`h-4 w-4 ${budgetUsed > 100 ? "text-red-600" : "text-orange-600"}`} />
          <AlertDescription className={budgetUsed > 100 ? "text-red-800" : "text-orange-800"}>
            {budgetUsed > 100
              ? `You're over budget by $${(currentSpending - monthlyBudget).toFixed(2)}. Consider canceling some subscriptions.`
              : `You're using ${budgetUsed.toFixed(1)}% of your budget. Consider reviewing your subscriptions.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Budget Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Settings</CardTitle>
          <CardDescription>Set your monthly subscription budget and savings goals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="budget">Monthly Budget ($)</Label>
            <div className="flex gap-2">
              <Input
                id="budget"
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="Enter monthly budget"
              />
              <Button onClick={handleUpdateBudget}>Update</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Savings Goal: ${savingsGoal}/month</Label>
            <Slider
              value={[savingsGoal]}
              onValueChange={(value) => setSavingsGoal(value[0])}
              max={200}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>$0</span>
              <span>$200</span>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Budget Progress</h4>
            <Progress value={budgetUsed} className="mb-2" />
            <div className="flex justify-between text-sm">
              <span>Used: ${currentSpending.toFixed(2)}</span>
              <span>Budget: ${monthlyBudget.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Budget Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Budget Breakdown</CardTitle>
          <CardDescription>Recommended budget allocation by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categoryBudgets).map(([category, budget]) => {
              const spent = categorySpending[category] || 0
              const percentage = budget > 0 ? (spent / budget) * 100 : 0
              const isOverBudget = percentage > 100

              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        ${spent.toFixed(2)} / ${budget.toFixed(2)}
                      </span>
                      <Badge variant={isOverBudget ? "destructive" : "secondary"}>{percentage.toFixed(0)}%</Badge>
                    </div>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className={isOverBudget ? "bg-red-100" : ""} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Savings Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Savings Recommendations</CardTitle>
          <CardDescription>AI-powered suggestions to optimize your spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetUsed > 100 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Immediate Action Required:</strong> You're over budget by $
                  {(currentSpending - monthlyBudget).toFixed(2)}. Consider canceling your least used subscriptions.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-green-600 mb-2">💡 Optimization Tip</h4>
                <p className="text-sm text-muted-foreground">
                  Consider switching to annual billing for frequently used services. This could save you up to 15%
                  annually.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-blue-600 mb-2">📊 Usage Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Your Entertainment category is{" "}
                  {(((categorySpending["Entertainment"] || 0) / monthlyBudget) * 100).toFixed(0)}% of your total budget.
                  Consider if all services are being used regularly.
                </p>
              </div>

              {potentialSavings >= savingsGoal && (
                <div className="p-4 border rounded-lg bg-green-50">
                  <h4 className="font-medium text-green-600 mb-2">🎯 Savings Goal Achievable</h4>
                  <p className="text-sm text-green-700">
                    Great! You have ${potentialSavings.toFixed(2)} remaining in your budget, which exceeds your savings
                    goal of ${savingsGoal}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
