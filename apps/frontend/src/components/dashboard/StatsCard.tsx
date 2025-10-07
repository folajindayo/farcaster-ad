import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: LucideIcon
  className?: string
  trend?: {
    value: number
    period: string
  }
}

export function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  className,
  trend,
}: StatsCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-neon-green'
      case 'negative':
        return 'text-red-500'
      default:
        return 'text-cyber-400'
    }
  }

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return '↗'
      case 'negative':
        return '↘'
      default:
        return '→'
    }
  }

  return (
    <Card className={cn("cyber-card hover:scale-105 transition-all duration-300", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-cyber-300">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-neon-cyan animate-pulse" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold cyber-text">
          {value}
        </div>
        {change && (
          <div className="flex items-center space-x-2 mt-2">
            <Badge 
              variant={changeType === 'positive' ? 'success' : changeType === 'negative' ? 'error' : 'cyber'}
              className="text-xs"
            >
              {getChangeIcon()} {change}
            </Badge>
            {trend && (
              <span className="text-xs text-cyber-400">
                vs {trend.period}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


