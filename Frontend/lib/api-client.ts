import axios, { AxiosInstance } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
            window.location.href = '/auth/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async signup(email: string, password: string, name: string) {
    const response = await this.client.post('/auth/signup', { email, password, name })
    return response.data
  }

  async logout() {
    const response = await this.client.post('/auth/logout')
    return response.data
  }

  async googleAuth(token: string) {
    const response = await this.client.post('/auth/google', { token })
    return response.data
  }

  // User endpoints
  async getCurrentUser() {
    const response = await this.client.get('/user/me')
    return response.data
  }

  async updateUser(data: any) {
    const response = await this.client.patch('/user/me', data)
    return response.data
  }

  // Subscription endpoints
  async getSubscriptions() {
    const response = await this.client.get('/subscriptions')
    return response.data
  }

  async createSubscription(data: any) {
    const response = await this.client.post('/subscriptions', data)
    return response.data
  }

  async getSubscription(id: string) {
    const response = await this.client.get(`/subscriptions/${id}`)
    return response.data
  }

  async updateSubscription(id: string, data: any) {
    const response = await this.client.patch(`/subscriptions/${id}`, data)
    return response.data
  }

  async deleteSubscription(id: string) {
    const response = await this.client.delete(`/subscriptions/${id}`)
    return response.data
  }

  // Analytics endpoints
  async getAnalyticsSummary() {
    const response = await this.client.get('/analytics/summary')
    return response.data
  }

  // Notification endpoints
  async getNotifications() {
    const response = await this.client.get('/notifications')
    return response.data
  }

  async markNotificationRead(id: string) {
    const response = await this.client.patch(`/notifications/${id}`)
    return response.data
  }

  // Budget endpoints
  async getBudget() {
    const response = await this.client.get('/budget')
    return response.data
  }

  async createBudget(data: any) {
    const response = await this.client.post('/budget', data)
    return response.data
  }

  // Calendar endpoints
  async getCalendarEvents() {
    const response = await this.client.get('/calendar/events')
    return response.data
  }

  // Payment methods
  async getPaymentMethods() {
    const response = await this.client.get('/payment-methods')
    return response.data
  }

  async createPaymentMethod(data: any) {
    const response = await this.client.post('/payment-methods', data)
    return response.data
  }

  async deletePaymentMethod(id: string) {
    const response = await this.client.delete(`/payment-methods/${id}`)
    return response.data
  }
}

export const apiClient = new ApiClient()
export default apiClient