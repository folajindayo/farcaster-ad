import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Megaphone, 
  BarChart3, 
  Wallet, 
  Settings, 
  HelpCircle,
  Zap,
  Target,
  TrendingUp,
  Users
} from "lucide-react"
import Link from "next/link"

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Campaigns',
    href: '/campaigns',
    icon: Megaphone,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Wallet',
    href: '/wallet',
    icon: Wallet,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

const quickActions = [
  {
    name: 'Create Campaign',
    href: '/campaigns/new',
    icon: Zap,
    variant: 'neon' as const,
  },
  {
    name: 'View Analytics',
    href: '/analytics',
    icon: TrendingUp,
    variant: 'cyber' as const,
  },
  {
    name: 'Target Audience',
    href: '/targeting',
    icon: Target,
    variant: 'outline' as const,
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  // For now, we'll use a simple active state logic
  // In a real app, you'd use usePathname from next/navigation
  const pathname = '/dashboard' // This would be dynamic in a real app

  return (
    <div className={cn("flex flex-col h-full bg-dark-800/50 backdrop-blur-sm border-r border-cyber-500/20", className)}>
      {/* Logo */}
      <div className="p-6 border-b border-cyber-500/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-neon-cyan to-neon-pink rounded-lg flex items-center justify-center">
            <Zap className="h-5 w-5 text-dark-900" />
          </div>
          <div>
            <h1 className="text-lg font-bold cyber-text">Farcaster Ads</h1>
            <p className="text-xs text-cyber-400">Advertiser Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-cyber-500/20 text-neon-cyan border border-cyber-500/30 neon-glow"
                  : "text-cyber-300 hover:text-neon-cyan hover:bg-cyber-500/10"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-neon-cyan" : "text-cyber-400 group-hover:text-neon-cyan"
              )} />
              <span>{item.name}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-cyber-500/20">
        <h3 className="text-xs font-semibold text-cyber-400 uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="space-y-2">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                action.variant === 'neon' && "bg-gradient-to-r from-neon-cyan/20 to-neon-pink/20 text-neon-cyan hover:from-neon-cyan/30 hover:to-neon-pink/30",
                action.variant === 'cyber' && "bg-cyber-500/20 text-cyber-400 hover:bg-cyber-500/30",
                action.variant === 'outline' && "border border-cyber-500/30 text-cyber-300 hover:border-neon-cyan hover:text-neon-cyan"
              )}
            >
              <action.icon className="h-4 w-4" />
              <span>{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Help */}
      <div className="p-4 border-t border-cyber-500/20">
        <Link
          href="/help"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-cyber-400 hover:text-neon-cyan hover:bg-cyber-500/10 transition-all duration-200 group"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Help & Support</span>
        </Link>
      </div>
    </div>
  )
}
