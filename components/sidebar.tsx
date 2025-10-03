"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { NotificationCenter } from "./notification-center"
import { ThemeToggle } from "./theme-toggle"
import { useAuth } from "./auth-provider"
import {
  LayoutDashboard,
  CreditCard,
  Calendar,
  PieChart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Brain,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Budget", href: "/budget", icon: PieChart },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
]

interface SidebarProps {
  className?: string
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    onNavigate?.()
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Brain className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">TrackWise</h2>
          <p className="text-xs text-muted-foreground">AI-powered tracking</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const pathname = usePathname()
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href} onClick={onNavigate}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.name}</span>
                {item.name === "Subscriptions" && (
                  <Badge variant="secondary" className="ml-auto">
                    6
                  </Badge>
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <Link href="/settings" onClick={onNavigate}>
            <Button variant="ghost" size="sm" className="h-8 w-auto px-2">
              <Settings className="h-4 w-4" />
              <span className="ml-2">Settings</span>
            </Button>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
          {user?.avatar ? (
            <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">@{user?.username || "username"}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 h-10 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  )
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:flex flex-col h-full bg-card border-r border-border", className)}>
        {/* Header with collapse button */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-semibold text-foreground">TrackWise</h2>
                <p className="text-xs text-muted-foreground">AI-powered tracking</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isCollapsed && <ThemeToggle />}
            <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8 p-0">
              {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Use the same content but conditionally render based on collapse state */}
        {!isCollapsed ? (
          <SidebarContent />
        ) : (
          <div className="flex flex-col h-full">
            {/* Collapsed navigation */}
            <nav className="flex-1 p-2 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={cn("w-full h-10 p-0", isActive && "bg-primary/10 text-primary hover:bg-primary/20")}
                      title={item.name}
                    >
                      <item.icon className="h-4 w-4" />
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>
    </>
  )
}

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="lg:hidden h-8 w-8 p-0">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
