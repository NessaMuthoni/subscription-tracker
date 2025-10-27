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
        try {
      // TODO: Replace with real AI API call when backend AI service is available
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Enhanced keyword-based categorization with priority matching
      const patterns = {
        Entertainment: [
          "netflix", "spotify", "hulu", "disney", "disney+", "youtube", "yt", 
          "prime video", "amazon prime", "apple music", "apple tv", "apple tv+",
          "music", "video", "stream", "streaming", "showmax", "dstv",
          "paramount", "paramount+", "hbo", "hbo max", "peacock", "tidal", 
          "soundcloud", "vimeo", "plex"
        ],
        Gaming: [
          "xbox", "xbox live", "xbox game pass", "playstation", "ps plus", 
          "playstation plus", "nintendo", "switch online", "nintendo switch",
          "steam", "epic games", "origin", "ubisoft", "ea play", "game pass", 
          "gaming", "twitch", "discord nitro", "riot games"
        ],
        Productivity: [
          "adobe", "adobe creative cloud", "office", "microsoft office", 
          "microsoft 365", "office 365", "google workspace", "g suite", 
          "slack", "zoom", "notion", "asana", "trello", "monday", "monday.com",
          "jira", "confluence", "canva", "figma", "dropbox business", 
          "evernote", "todoist", "github", "gitlab", "bitbucket", "jetbrains",
          "visual studio", "vs code", "webstorm", "phpstorm", "intellij"
        ],
        Cloud: [
          "aws", "amazon web services", "azure", "microsoft azure", 
          "google cloud", "gcp", "dropbox", "icloud", "onedrive", "one drive",
          "hosting", "digitalocean", "digital ocean", "linode", "heroku", 
          "vercel", "netlify", "cloudflare"
        ],
        Fitness: [
          "gym", "fitness", "peloton", "strava", "myfitnesspal", "my fitness pal",
          "fitbit", "health", "yoga", "workout", "crossfit", "cross fit",
          "classpass", "class pass", "nike training", "nike", "24 hour fitness",
          "planet fitness", "la fitness", "gold's gym", "anytime fitness"
        ],
        Finance: [
          "bank", "banking", "credit", "investment", "trading", "finance", 
          "accounting", "quickbooks", "mint", "ynab", "you need a budget",
          "personal capital", "robinhood", "coinbase", "paypal"
        ],
        Social: [
          "twitter", "x premium", "x", "facebook", "meta", "instagram", 
          "linkedin", "linkedin premium", "tiktok", "tik tok", "social", 
          "dating", "tinder", "bumble", "match", "match.com", "hinge"
        ],
        Education: [
          "udemy", "coursera", "skillshare", "skill share", "masterclass",
          "master class", "linkedin learning", "pluralsight", "datacamp",
          "data camp", "codecademy", "code academy", "duolingo", "learning",
          "course", "tutorial", "khan academy"
        ],
        News: [
          "newspaper", "news", "medium", "substack", "times", "new york times",
          "post", "washington post", "journal", "wall street journal",
          "economist", "the economist", "atlantic", "the atlantic", 
          "new yorker", "the new yorker", "bloomberg"
        ],
      }

      const serviceLower = serviceName.toLowerCase()
      const descLower = (description || "").toLowerCase()
      let bestMatch = { category: "Other", confidence: 0.5 }

      // Check service name first (higher priority)
      for (const [category, keywords] of Object.entries(patterns)) {
        for (const keyword of keywords) {
          if (serviceLower.includes(keyword)) {
            bestMatch = {
              category: category,
              confidence: 0.85 + Math.random() * 0.1, // 0.85-0.95 range for name matches
            }
            return bestMatch // Return immediately on first match
          }
        }
      }

      // Check description if no name match found
      if (description) {
        for (const [category, keywords] of Object.entries(patterns)) {
          for (const keyword of keywords) {
            if (descLower.includes(keyword)) {
              bestMatch = {
                category: category,
                confidence: 0.7 + Math.random() * 0.1, // 0.7-0.8 range for description matches
              }
              return bestMatch
            }
          }
        }
      }

      return bestMatch
    } catch (error) {
      console.error('AI categorization failed:', error)
      return { category: "Other", confidence: 0.3 }
    }
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
    try {
      // TODO: Replace with real AI prediction API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (subscriptions.length === 0) {
        return {
          predictions: [],
          insights: ["Add subscriptions to get spending predictions"],
          riskFactors: []
        }
      }

      const currentSpending = subscriptions.reduce((sum, sub) => {
        return sum + (sub.price || sub.cost || 0) // Handle different property names
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

      // Generate insights based on actual subscription data
      const insights = []
      const categoryCount = new Set(subscriptions.map(sub => sub.category)).size
      if (categoryCount > 1) {
        insights.push(`You have subscriptions across ${categoryCount} categories`)
      }
      if (currentSpending > 100) {
        insights.push("Consider reviewing subscription usage to optimize spending")
      }
      insights.push("Consider annual billing for frequently used services")
      
      if (insights.length === 0) {
        insights.push("Looking good! Add more subscriptions to get detailed insights")
      }

      const riskFactors = [
        { factor: "Price Increases", impact: "+KSh 1,500-2,500/month", probability: 0.8 },
        { factor: "Subscription Creep", impact: "+KSh 2,000-4,000/month", probability: 0.6 },
        { factor: "Usage Decline", impact: "Wasted spending", probability: 0.4 },
      ]

      return { predictions, insights, riskFactors }
    } catch (error) {
      console.error('Spending forecast failed:', error)
      return {
        predictions: [],
        insights: ["Unable to generate predictions at this time"],
        riskFactors: []
      }
    }
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
    try {
      // TODO: Replace with real AI recommendation API call
      await new Promise((resolve) => setTimeout(resolve, 600))

      const recommendations = []
      
      if (subscriptions.length === 0) {
        return { recommendations: [] }
      }

      const totalSpending = subscriptions.reduce((sum, sub) => sum + (sub.price || sub.cost || 0), 0)
      
      // Generate recommendations based on actual data
      if (totalSpending > budget * 0.8) {
        recommendations.push({
          type: "cancel" as const,
          title: "Review High-Cost Subscriptions",
          description: "You're approaching your budget limit. Consider canceling unused services.",
          savings: totalSpending * 0.2,
          effort: "low" as const,
          impact: "high" as const,
        })
      }

      if (subscriptions.length > 3) {
        recommendations.push({
          type: "bundle" as const,
          title: "Look for Bundle Opportunities",
          description: "Combine similar services for potential savings.",
          savings: 20,
          effort: "medium" as const,
          impact: "medium" as const,
        })
      }

      recommendations.push({
        type: "annual" as const,
        title: "Switch to Annual Billing",
        description: "Save on frequently used subscriptions with annual plans.",
        savings: Math.max(10, totalSpending * 0.1),
        effort: "low" as const,
        impact: "medium" as const,
      })

      return { recommendations }
    } catch (error) {
      console.error('Recommendation generation failed:', error)
      return { recommendations: [] }
    }
  }
}

export const aiService = AIService.getInstance()
