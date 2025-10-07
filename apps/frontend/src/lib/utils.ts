import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USDC'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USDC' ? 'USD' : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercentage(num: number): string {
  return `${(num * 100).toFixed(1)}%`
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(d)
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + '...'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    active: 'text-neon-green',
    pending: 'text-neon-yellow',
    completed: 'text-neon-cyan',
    cancelled: 'text-red-500',
    draft: 'text-cyber-400',
    paused: 'text-orange-500',
  }
  return statusColors[status] || 'text-cyber-400'
}

export function getStatusBadgeVariant(status: string): string {
  const variants: Record<string, string> = {
    active: 'bg-neon-green/20 text-neon-green border-neon-green/30',
    pending: 'bg-neon-yellow/20 text-neon-yellow border-neon-yellow/30',
    completed: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30',
    cancelled: 'bg-red-500/20 text-red-500 border-red-500/30',
    draft: 'bg-cyber-400/20 text-cyber-400 border-cyber-400/30',
    paused: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  }
  return variants[status] || 'bg-cyber-400/20 text-cyber-400 border-cyber-400/30'
}


