"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { googleOAuth2Service } from "@/lib/google-auth-oauth"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  name?: string
  created_at: string
  preferences?: {
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
      reminderDays: number
    }
    budget: {
      monthly: number
      currency: string
      checkBalance: boolean
    }
    ai: {
      categorization: boolean
      predictions: boolean
      recommendations: boolean
    }
    calendar: {
      googleSync: boolean
    }
    paymentMethods?: Array<{
      type: "mpesa" | "card" | "paypal"
      balance: number
      currency: string
      enabled: boolean
      lastChecked?: Date
      error?: string
    }>
  }
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  loginWithGoogle: () => Promise<boolean>
  signup: (email: string, password: string, name?: string) => Promise<boolean>
  logout: () => void
  updateUser: (updates: Partial<User>) => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const isAuthenticated = !!user

    // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const userData = await apiClient.getCurrentUser()
          setUser(userData)
        }
      } catch (error) {
        // Token invalid, clear it
        localStorage.removeItem('auth_token')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await apiClient.login(email, password)
      
      // Store the JWT token in localStorage
      localStorage.setItem('auth_token', response.token)
      
      setUser(response.user)
      router.push('/')
      toast({
        title: "Login successful",
        description: "Welcome back!",
      })
      return true
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      // Check if Google Client ID is configured
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId || clientId === 'your-google-client-id') {
        toast({
          title: "Google Sign-In Not Available",
          description: "Google OAuth is not configured. Please contact the administrator or use email/password login.",
          variant: "destructive",
        })
        return false;
      }
      
      // Initialize Google OAuth2 service and trigger sign-in
      await googleOAuth2Service.initialize()
      
      // This will return a Promise that resolves when the popup callback sends a message
      const result = await googleOAuth2Service.signIn()
      
      if (!result || !result.user) {
        throw new Error('No user data received from Google')
      }

      // The backend already authenticated the user and returned a token
      const { user, token } = result as any

      setUser(user)
      
      // Store the JWT token with the correct key that api-client expects
      if (token) {
        localStorage.setItem('auth_token', token)
      }
      
      toast({
        title: "Welcome!",
        description: `Signed in as ${user.name || user.email}`,
      })
      
      router.push('/')
      return true
      
    } catch (error: any) {
      console.error('Google login error:', error)
      
      // Handle specific error cases
      if (error.message.includes('Google Client ID not configured')) {
        toast({
          title: "Google Sign-In Not Available",
          description: "Please use email/password login instead.",
          variant: "destructive",
        })
      } else if (error.message.includes('Popup was blocked')) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        })
      } else if (error.message.includes('cancelled by user')) {
        toast({
          title: "Sign-in Cancelled",
          description: "Google Sign-In was cancelled.",
          variant: "default",
        })
      } else if (error.message.includes('timed out')) {
        toast({
          title: "Sign-in Timeout",
          description: "Google Sign-In took too long. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Google login failed",
          description: error.message || "Failed to sign in with Google. Please try email/password login.",
          variant: "destructive",
        })
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, name?: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await apiClient.signup(email, password, name || '')
      
      // Store the JWT token in localStorage
      localStorage.setItem('auth_token', response.token)
      
      setUser(response.user)
      router.push('/')
      toast({
        title: "Account created",
        description: "Welcome to Subscription Tracker!",
      })
      return true
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      setUser(null)
      localStorage.removeItem('auth_token')
      router.push('/auth/login')
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      })
    }
  }

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await apiClient.updateUser(updates)
      setUser(updatedUser)
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        signup,
        logout,
        updateUser,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
