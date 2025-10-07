import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency, formatDate, getStatusBadgeVariant } from "@/lib/utils"
import { 
  Eye, 
  MousePointer, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Play,
  Pause,
  MoreHorizontal
} from "lucide-react"

interface CampaignCardProps {
  campaign: {
    id: string
    title: string
    status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
    budget: number
    spent: number
    impressions: number
    clicks: number
    ctr: number
    startDate: string
    endDate: string
    creative: {
      type: 'banner' | 'pinned_cast' | 'frame'
      url: string
    }
  }
  onEdit?: (id: string) => void
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onView?: (id: string) => void
  className?: string
}

export function CampaignCard({
  campaign,
  onEdit,
  onPause,
  onResume,
  onView,
  className,
}: CampaignCardProps) {
  const canPause = campaign.status === 'active'
  const canResume = campaign.status === 'paused'
  const canEdit = campaign.status === 'draft' || campaign.status === 'paused'

  const getStatusIcon = () => {
    switch (campaign.status) {
      case 'active':
        return <Play className="h-3 w-3" />
      case 'paused':
        return <Pause className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <Card className={cn("cyber-card hover:scale-105 transition-all duration-300 group", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold cyber-text">
              {campaign.title}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="cyber" 
                className={cn("text-xs", getStatusBadgeVariant(campaign.status))}
              >
                {getStatusIcon()}
                <span className="ml-1 capitalize">{campaign.status}</span>
              </Badge>
              <Badge variant="outline" className="text-xs">
                {campaign.creative.type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Budget and Performance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-cyber-400">Budget</div>
            <div className="text-lg font-semibold cyber-text">
              {formatCurrency(campaign.budget)}
            </div>
            <div className="text-xs text-cyber-500">
              Spent: {formatCurrency(campaign.spent)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-cyber-400">Performance</div>
            <div className="text-lg font-semibold text-neon-green">
              {campaign.ctr.toFixed(2)}% CTR
            </div>
            <div className="text-xs text-cyber-500">
              {campaign.clicks} clicks
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-cyber-500/20">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-cyber-400">
              <Eye className="h-3 w-3" />
              <span className="text-xs">Impressions</span>
            </div>
            <div className="text-sm font-semibold text-neon-cyan">
              {campaign.impressions.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-cyber-400">
              <MousePointer className="h-3 w-3" />
              <span className="text-xs">Clicks</span>
            </div>
            <div className="text-sm font-semibold text-neon-pink">
              {campaign.clicks.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-cyber-400">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">CTR</span>
            </div>
            <div className="text-sm font-semibold text-neon-green">
              {campaign.ctr.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-cyber-500 pt-2 border-t border-cyber-500/20">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Started: {formatDate(campaign.startDate)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Ends: {formatDate(campaign.endDate)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex space-x-2">
            {canEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit?.(campaign.id)}
                className="text-xs"
              >
                Edit
              </Button>
            )}
            {canPause && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onPause?.(campaign.id)}
                className="text-xs"
              >
                Pause
              </Button>
            )}
            {canResume && (
              <Button 
                variant="neon" 
                size="sm" 
                onClick={() => onResume?.(campaign.id)}
                className="text-xs"
              >
                Resume
              </Button>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onView?.(campaign.id)}
            className="text-xs text-neon-cyan hover:text-neon-cyan"
          >
            View Details →
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


