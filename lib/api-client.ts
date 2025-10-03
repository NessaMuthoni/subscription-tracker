// Backend API client utility for frontend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.loadToken()
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    
    return headers
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Auth methods
  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  // Auth API
  async login(email: string, password: string) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    if (response.token) {
      this.setToken(response.token)
    }
    
    return response
  }

  async signup(email: string, password: string, name?: string) {
    const response = await this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
    
    if (response.token) {
      this.setToken(response.token)
    }
    
    return response
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' })
    this.clearToken()
  }

  // User API
  async getMe() {
    return this.request('/api/user/me')
  }

  async updateMe(data: { name?: string; email?: string }) {
    return this.request('/api/user/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Subscriptions API
  async getSubscriptions() {
    return this.request('/api/subscriptions')
  }

  async createSubscription(data: {
    name: string
    price: number
    billing_date: string
    category_id?: string
    status: string
  }) {
    return this.request('/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getSubscription(id: string) {
    return this.request(`/api/subscriptions/${id}`)
  }

  async updateSubscription(id: string, data: any) {
    return this.request(`/api/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteSubscription(id: string) {
    return this.request(`/api/subscriptions/${id}`, {
      method: 'DELETE',
    })
  }

  // Payment Methods API
  async getPaymentMethods() {
    return this.request('/api/payment-methods')
  }

  async createPaymentMethod(data: {
    type: string
    last4?: string
    brand?: string
  }) {
    return this.request('/api/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deletePaymentMethod(id: string) {
    return this.request(`/api/payment-methods/${id}`, {
      method: 'DELETE',
    })
  }

  // Analytics API
  async getAnalyticsSummary() {
    return this.request('/api/analytics/summary')
  }

  // Notifications API
  async getNotifications() {
    return this.request('/api/notifications')
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/api/notifications/${id}`, {
      method: 'PATCH',
    })
  }

  // Budget API
  async getBudget() {
    return this.request('/api/budget')
  }

  async createBudget(data: { amount: number; period: string }) {
    return this.request('/api/budget', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Calendar API
  async getCalendarEvents() {
    return this.request('/api/calendar/events')
  }

  // AI API (via backend proxy or direct)
  async predictSpending(data: any) {
    // This could be proxied through the Go backend or called directly
    return this.request('/ai/predict-spending', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getBudgetRecommendation(data: any) {
    return this.request('/ai/budget-recommendation', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getReminderSuggestions(data: any) {
    return this.request('/ai/reminder-suggestions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()
export default apiClient