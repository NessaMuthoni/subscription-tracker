// AI Service for smart categorization, predictions, and recommendations
export class AIService {
  private static instance: AIService

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  // Smart categorization using AI
  async categorizeSubscription(
    serviceName: string,
    description?: string,
  ): Promise<{
    category: string
    confidence: number
    subcategory?: string
  }> {
    // Simulate AI API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    const categories = {
      netflix: { category: "Entertainment", subcategory: "Streaming", confidence: 0.95 },
      spotify: { category: "Entertainment", subcategory: "Music", confidence: 0.98 },
      adobe: { category: "Productivity", subcategory: "Design", confidence: 0.92 },
      aws: { category: "Cloud Services", subcategory: "Infrastructure", confidence: 0.88 },
      gym: { category: "Health & Fitness", subcategory: "Fitness", confidence: 0.94 },
      office: { category: "Productivity", subcategory: "Office Suite", confidence: 0.96 },
      dropbox: { category: "Cloud Services", subcategory: "Storage", confidence: 0.91 },
      youtube: { category: "Entertainment", subcategory: "Video", confidence: 0.93 },
      zoom: { category: "Productivity", subcategory: "Communication", confidence: 0.89 },
      slack: { category: "Productivity", subcategory: "Communication", confidence: 0.87 },
    }

    const key = serviceName.toLowerCase()
    for (const [service, data] of Object.entries(categories)) {
      if (key.includes(service)) {
        return data
      }
    }

    // Default categorization with lower confidence
    return { category: "Other", confidence: 0.65 }
  }

  // Predictive analytics for spending forecasts
  async generateSpendingForecast(
    subscriptions: any[],
    months = 12,
  ): Promise<{
    predictions: Array<{ month: string; predicted: number; confidence: number }>
    insights: string[]
    riskFactors: Array<{ factor: string; impact: string; probability: number }>
  }> {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const currentSpending = subscriptions.reduce((sum, sub) => {
      return sum + (sub.billingCycle === "monthly" ? sub.cost : sub.cost / 12)
    }, 0)

    const predictions = []
    const monthNames = ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"]

    for (let i = 0; i < months; i++) {
      const seasonalFactor = [1.0, 1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.3, 1.4, 1.2][i % 12]
      const growthTrend = currentSpending * Math.pow(1.05, i / 12) // 5% annual growth
      const predicted = growthTrend * seasonalFactor

      predictions.push({
        month: monthNames[i % 12],
        predicted: Number(predicted.toFixed(2)),
        confidence: Math.max(0.6, 1 - i * 0.03),
      })
    }

    const insights = [
      "Your entertainment subscriptions show 15% growth trend",
      "Consider annual billing to save up to $120/year",
      "Peak spending expected in November-December",
      "3 subscriptions haven't been used in 30+ days",
    ]

    const riskFactors = [
      { factor: "Price Increases", impact: "+$15-25/month", probability: 0.8 },
      { factor: "Subscription Creep", impact: "+$20-40/month", probability: 0.6 },
      { factor: "Seasonal Spending", impact: "+$30-50 in Q4", probability: 0.9 },
    ]

    return { predictions, insights, riskFactors }
  }

  // Smart recommendations for optimization
  async generateRecommendations(
    subscriptions: any[],
    budget: number,
  ): Promise<{
    recommendations: Array<{
      type: "cancel" | "downgrade" | "bundle" | "annual"
      title: string
      description: string
      savings: number
      effort: "low" | "medium" | "high"
      impact: "low" | "medium" | "high"
    }>
  }> {
    await new Promise((resolve) => setTimeout(resolve, 600))

    const recommendations = [
      {
        type: "annual" as const,
        title: "Switch to Annual Billing",
        description: "Switch Netflix and Spotify to annual plans for 15% savings",
        savings: 45,
        effort: "low" as const,
        impact: "medium" as const,
      },
      {
        type: "bundle" as const,
        title: "Entertainment Bundle",
        description: "Combine Disney+, Hulu, and ESPN+ for $5/month savings",
        savings: 60,
        effort: "medium" as const,
        impact: "medium" as const,
      },
      {
        type: "cancel" as const,
        title: "Cancel Unused Subscriptions",
        description: "Adobe Creative Suite shows low usage - consider alternatives",
        savings: 53,
        effort: "low" as const,
        impact: "high" as const,
      },
    ]

    return { recommendations }
  }
}

export const aiService = AIService.getInstance()
