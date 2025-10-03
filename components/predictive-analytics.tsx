"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts"
import { TrendingUp, TrendingDown, Brain, Target, AlertTriangle, DollarSign } from "lucide-react"

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

interface PredictiveAnalyticsProps {
  subscriptions: Subscription[]
}

export function PredictiveAnalytics({ subscriptions }: PredictiveAnalyticsProps) {
  // Calculate current metrics
  const currentMonthlySpend = subscriptions.reduce((sum, sub) => {
    if (sub.billingCycle === "monthly") return sum + sub.cost
    if (sub.billingCycle === "yearly") return sum + sub.cost / 12
    return sum
  }, 0)

  // Generate predictive data (simulated AI predictions)
  const generatePredictions = () => {
    const baseSpend = currentMonthlySpend
    const growthRate = 0.05 // 5% monthly growth trend
    const seasonalFactor = [1.0, 1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.3, 1.4, 1.2] // Seasonal variations

    const predictions = []
    const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"]

    for (let i = 0; i < 12; i++) {
      const trend = baseSpend * Math.pow(1 + growthRate, i)
      const seasonal = trend * seasonalFactor[i]
      const predicted = seasonal + (Math.random() - 0.5) * 10 // Add some noise

      predictions.push({
        month: months[i],
        predicted: Number.parseFloat(predicted.toFixed(2)),
        actual: i === 0 ? baseSpend : null, // Only current month has actual data
        confidence: Math.max(0.6, 1 - i * 0.05), // Confidence decreases over time
      })
    }

    return predictions
  }

  const predictions = generatePredictions()

  // Calculate insights
  const yearEndPrediction = predictions[predictions.length - 1].predicted
  const totalYearPrediction = predictions.reduce((sum, p) => sum + p.predicted, 0)
  const growthTrend = ((yearEndPrediction - currentMonthlySpend) / currentMonthlySpend) * 100

  // Risk analysis
  const riskFactors = [
    {
      factor: "Subscription Creep",
      risk: "Medium",
      description: "Tendency to add new subscriptions without canceling unused ones",
      impact: "+$15-30/month",
      probability: 0.7,
    },
    {
      factor: "Price Increases",
      risk: "High",
      description: "Annual price increases across streaming and software services",
      impact: "+$8-15/month",
      probability: 0.9,
    },
    {
      factor: "Seasonal Spending",
      risk: "Low",
      description: "Holiday season typically sees increased subscription activity",
      impact: "+$20-40 in Q4",
      probability: 0.8,
    },
  ]

  // Optimization opportunities
  const optimizations = [
    {
      opportunity: "Annual Billing Switch",
      savings: "$45/year",
      effort: "Low",
      description: "Switch 3 monthly subscriptions to annual billing for discounts",
    },
    {
      opportunity: "Bundle Optimization",
      savings: "$25/month",
      effort: "Medium",
      description: "Combine streaming services into family plans or bundles",
    },
    {
      opportunity: "Usage-Based Cancellation",
      savings: "$35/month",
      effort: "Low",
      description: "Cancel 2 rarely used subscriptions identified by usage tracking",
    },
  ]

  const totalOptimizationSavings = optimizations.reduce((sum, opt) => {
    const monthlySavings = opt.savings.includes("/year")
      ? Number.parseFloat(opt.savings.replace("$", "").replace("/year", "")) / 12
      : Number.parseFloat(opt.savings.replace("$", "").replace("/month", ""))
    return sum + monthlySavings
  }, 0)

  return (
    <div className="space-y-6">
      {/* AI Insights Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">12-Month Forecast</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${yearEndPrediction.toFixed(2)}</div>
            <p className={`text-xs flex items-center gap-1 ${growthTrend > 0 ? "text-red-600" : "text-green-600"}`}>
              {growthTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(growthTrend).toFixed(1)}% vs current
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Projection</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalYearPrediction.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total predicted spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimization Potential</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalOptimizationSavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Monthly savings available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">Medium</div>
            <p className="text-xs text-muted-foreground">Based on spending patterns</p>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            12-Month Spending Forecast
          </CardTitle>
          <CardDescription>
            AI-powered predictions based on historical data, seasonal trends, and market analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              predicted: {
                label: "Predicted",
                color: "hsl(var(--chart-1))",
              },
              actual: {
                label: "Actual",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#82ca9d"
                  strokeWidth={3}
                  dot={{ fill: "#82ca9d", strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis</CardTitle>
          <CardDescription>Potential factors that could impact your subscription spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskFactors.map((risk, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{risk.factor}</h4>
                  <Badge
                    variant={risk.risk === "High" ? "destructive" : risk.risk === "Medium" ? "default" : "secondary"}
                  >
                    {risk.risk} Risk
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Impact: {risk.impact}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Probability:</span>
                    <Progress value={risk.probability * 100} className="w-20" />
                    <span className="text-sm">{(risk.probability * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Opportunities</CardTitle>
          <CardDescription>AI-identified ways to reduce your subscription costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizations.map((opt, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{opt.opportunity}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Save {opt.savings}
                    </Badge>
                    <Badge
                      variant={opt.effort === "Low" ? "secondary" : opt.effort === "Medium" ? "default" : "destructive"}
                    >
                      {opt.effort} Effort
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{opt.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">💡 Total Optimization Potential</h4>
            <p className="text-sm text-green-700">
              By implementing all optimization opportunities, you could save up to{" "}
              <strong>${totalOptimizationSavings.toFixed(2)}/month</strong> or{" "}
              <strong>${(totalOptimizationSavings * 12).toFixed(2)}/year</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Confidence</CardTitle>
          <CardDescription>How confident our AI model is in these predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">92%</div>
                <div className="text-sm text-muted-foreground">Next 3 months</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">78%</div>
                <div className="text-sm text-muted-foreground">6 months</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">65%</div>
                <div className="text-sm text-muted-foreground">12 months</div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">🤖 AI Model Information</h4>
              <p className="text-sm text-blue-700">
                Predictions are based on your historical spending patterns, seasonal trends, market data from similar
                users, and subscription industry growth rates. Confidence decreases over longer time horizons due to
                market uncertainty.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
