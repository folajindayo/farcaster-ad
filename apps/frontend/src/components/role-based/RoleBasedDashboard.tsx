'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Monitor, Settings, Target, Users, Bell, RefreshCw, TrendingUp, DollarSign, Eye, MousePointer, LogOut, User, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateCampaignModalDetailed } from '@/components/modals/CreateCampaignModalDetailed'
import { useRouter } from 'next/navigation'

// Advertiser Dashboard
function AdvertiserDashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campaign Performance Overview */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">CAMPAIGN PERFORMANCE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">12</div>
                <div className="text-xs text-neutral-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">8</div>
                <div className="text-xs text-neutral-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">45</div>
                <div className="text-xs text-neutral-500">Completed</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { id: "AD-001A", name: "SUMMER SALE 2024", status: "active", budget: "$5,000", spent: "$3,200" },
                { id: "AD-002B", name: "CRYPTO DEFI LAUNCH", status: "pending", budget: "$3,000", spent: "$0" },
                { id: "AD-003C", name: "NFT COLLECTION DROP", status: "completed", budget: "$2,000", spent: "$2,000" },
              ].map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-2 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        campaign.status === "active"
                          ? "bg-white"
                          : campaign.status === "pending"
                            ? "bg-neutral-500"
                            : "bg-green-500"
                      }`}
                    ></div>
                    <div>
                      <div className="text-xs text-white font-mono">{campaign.id}</div>
                      <div className="text-xs text-neutral-500">{campaign.name}</div>
                      <div className="text-xs text-orange-500">{campaign.spent} / {campaign.budget}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">QUICK STATS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-neutral-400">Total Spent</span>
                <span className="text-white font-mono">$12,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total Impressions</span>
                <span className="text-white font-mono">245K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total Clicks</span>
                <span className="text-white font-mono">12.5K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Average CTR</span>
                <span className="text-white font-mono">5.1%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Campaign */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">QUICK ACTIONS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold"
            >
              <Target className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
            <Button variant="outline" className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-800">
              <DollarSign className="w-4 h-4 mr-2" />
              Add Funds
            </Button>
            <Button variant="outline" className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-800">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Create Campaign Modal */}
      <CreateCampaignModalDetailed
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          // Optionally refresh data or show success message
        }}
      />
    </div>
  )
}

// Host Dashboard
function HostDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Earnings Overview */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">EARNINGS OVERVIEW</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">$1,250</div>
                <div className="text-xs text-neutral-500">Total Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">$320</div>
                <div className="text-xs text-neutral-500">Claimable</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { campaign: "SUMMER SALE 2024", earnings: "$150", status: "claimed" },
                { campaign: "CRYPTO DEFI LAUNCH", earnings: "$80", status: "pending" },
                { campaign: "NFT COLLECTION DROP", earnings: "$90", status: "claimed" },
              ].map((earning, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-xs text-white font-mono">{earning.campaign}</div>
                    <div className="text-xs text-orange-500">{earning.earnings}</div>
                  </div>
                  <div className={`text-xs ${earning.status === 'claimed' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {earning.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PERFORMANCE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-neutral-400">Impressions Served</span>
                <span className="text-white font-mono">15.2K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Clicks Generated</span>
                <span className="text-white font-mono">760</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">CTR</span>
                <span className="text-white font-mono">5.0%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Active Campaigns</span>
                <span className="text-white font-mono">3</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Host Actions */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">HOST ACTIONS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold">
              <DollarSign className="w-4 h-4 mr-2" />
              Claim Earnings
            </Button>
            <Button variant="outline" className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-800">
              <Eye className="w-4 h-4 mr-2" />
              View Performance
            </Button>
            <Button variant="outline" className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-800">
              <Settings className="w-4 h-4 mr-2" />
              Opt In/Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Operator Dashboard
function OperatorDashboard() {
  return (
    <div className="p-6 space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Campaign Review Queue */}
      <Card className="lg:col-span-6 bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">CAMPAIGN REVIEW QUEUE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { id: "C-001", title: "NEW CRYPTO PROJECT", advertiser: "0x1234...5678", budget: "$5,000", status: "pending" },
              { id: "C-002", title: "NFT MARKETPLACE", advertiser: "0x9876...5432", budget: "$3,500", status: "pending" },
              { id: "C-003", title: "DEFI PROTOCOL", advertiser: "0x4567...8901", budget: "$7,200", status: "approved" },
            ].map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-3 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors"
              >
                <div>
                  <div className="text-sm text-white font-mono">{campaign.id}</div>
                  <div className="text-xs text-neutral-300">{campaign.title}</div>
                  <div className="text-xs text-neutral-500">{campaign.advertiser}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-orange-500 font-mono">{campaign.budget}</div>
                  <div className={`text-xs ${campaign.status === 'pending' ? 'text-yellow-500' : 'text-green-500'}`}>
                    {campaign.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Global Analytics */}
      <Card className="lg:col-span-6 bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">GLOBAL ANALYTICS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-neutral-400">Active Campaigns</span>
              <span className="text-white font-mono">23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Total Impressions</span>
              <span className="text-white font-mono">1.2M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Total Clicks</span>
              <span className="text-white font-mono">60K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Revenue Split</span>
              <span className="text-white font-mono">$45K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Operator Fee</span>
              <span className="text-white font-mono">$4.5K</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settlement Management */}
      <Card className="lg:col-span-12 bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">SETTLEMENT MANAGEMENT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-800 rounded">
              <div className="text-sm text-neutral-400">Pending Settlements</div>
              <div className="text-2xl font-bold text-white font-mono">5</div>
            </div>
            <div className="p-4 bg-neutral-800 rounded">
              <div className="text-sm text-neutral-400">Total Amount</div>
              <div className="text-2xl font-bold text-white font-mono">$25K</div>
            </div>
            <div className="p-4 bg-neutral-800 rounded">
              <div className="text-sm text-neutral-400">Merkle Roots</div>
              <div className="text-2xl font-bold text-white font-mono">3</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
  )
}

interface RoleBasedDashboardProps {
  userRole: 'advertiser' | 'host' | 'operator';
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export default function RoleBasedDashboard({ 
  userRole, 
  sidebarCollapsed, 
  setSidebarCollapsed 
}: RoleBasedDashboardProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("overview")
  const [user, setUser] = useState<any>(null)
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)
  const [switchingRole, setSwitchingRole] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const userData = JSON.parse(userStr)
          setUser(userData)
          
          // Log user data on mount (after role switch reload)
          console.log('👤 Current User Data:', userData)
          console.log('🎭 Current Role:', userData.role)
          console.log('📋 User Details:', {
            username: userData.username,
            displayName: userData.displayName,
            fid: userData.farcasterId,
            role: userData.role
          })
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }
    }
  }, [])

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/')
    }
  }

  const handleSwitchRole = async (newRole: 'advertiser' | 'host' | 'operator') => {
    if (!user) return
    
    setSwitchingRole(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/auth/update-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole,
          farcasterId: user.farcasterId
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        console.log('✅ Role switched successfully!')
        console.log('📊 Old user data:', user)
        console.log('📊 New user data:', data.user)
        console.log('🔑 New token:', data.token)
        
        // Update localStorage with new user data and token
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        
        console.log('💾 LocalStorage updated')
        console.log('🔄 Reloading page...')
        
        // Reload the page to reflect new role
        window.location.reload()
      } else {
        console.error('Failed to switch role')
        alert('Failed to switch role. Please try again.')
      }
    } catch (error) {
      console.error('Error switching role:', error)
      alert('Failed to switch role. Please try again.')
    } finally {
      setSwitchingRole(false)
      setShowRoleSwitcher(false)
    }
  }

  const getNavigationItems = () => {
    switch (userRole) {
      case 'advertiser':
        return [
          { id: "overview", icon: Monitor, label: "DASHBOARD" },
          { id: "campaigns", icon: Target, label: "CAMPAIGNS" },
          { id: "analytics", icon: TrendingUp, label: "ANALYTICS" },
          { id: "wallet", icon: DollarSign, label: "WALLET" },
          { id: "settings", icon: Settings, label: "SETTINGS" },
        ];
      case 'host':
        return [
          { id: "overview", icon: Monitor, label: "DASHBOARD" },
          { id: "performance", icon: Eye, label: "PERFORMANCE" },
          { id: "earnings", icon: DollarSign, label: "EARNINGS" },
          { id: "settings", icon: Settings, label: "SETTINGS" },
        ];
      case 'operator':
        return [
          { id: "overview", icon: Monitor, label: "DASHBOARD" },
          { id: "campaigns", icon: Target, label: "CAMPAIGNS" },
          { id: "analytics", icon: TrendingUp, label: "ANALYTICS" },
          { id: "settlement", icon: DollarSign, label: "SETTLEMENT" },
          { id: "settings", icon: Settings, label: "SETTINGS" },
        ];
      default:
        return [];
    }
  };

  const getDashboardContent = () => {
    switch (userRole) {
      case 'advertiser':
        return <AdvertiserDashboard />;
      case 'host':
        return <HostDashboard />;
      case 'operator':
        return <OperatorDashboard />;
      default:
        return <div>Invalid role</div>;
    }
  };

  const getTitle = () => {
    switch (userRole) {
      case 'advertiser':
        return 'FARCASTER ADS - ADVERTISER';
      case 'host':
        return 'FARCASTER ADS - HOST';
      case 'operator':
        return 'FARCASTER ADS - OPERATOR';
      default:
        return 'FARCASTER ADS';
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-orange-500 font-bold text-lg tracking-wider">{getTitle()}</h1>
              <p className="text-neutral-500 text-xs">v2.1.7 {userRole.toUpperCase()} DASHBOARD</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-orange-500"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className="space-y-2">
            {getNavigationItems().map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                  activeSection === item.id
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <item.icon className="w-5 h-5 md:w-5 md:h-5 sm:w-6 sm:h-6" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && user && (
            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-3 mb-3">
                {user.pfpUrl ? (
                  <img 
                    src={user.pfpUrl} 
                    alt={user.displayName || user.username}
                    className="w-10 h-10 rounded-full border-2 border-orange-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-black" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.displayName || user.username || 'User'}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">
                    @{user.username || `fid-${user.farcasterId}`}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => setShowRoleSwitcher(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 border border-orange-500/30 transition-all duration-200"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Switch Role</span>
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/30 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${!sidebarCollapsed ? "md:ml-0" : ""}`}>
        {/* Top Toolbar */}
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              FARCASTER AD RENTAL / <span className="text-orange-500">{userRole.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-neutral-500">LAST UPDATE: 25/01/2025 20:00 UTC</div>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          {getDashboardContent()}
        </div>
      </div>

      {/* Role Switcher Modal */}
      {showRoleSwitcher && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowRoleSwitcher(false)}>
          <div className="bg-neutral-900 border border-orange-500/30 rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Switch Role</h2>
            <p className="text-sm text-neutral-400 mb-6">
              Choose your role to access different dashboards and features
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleSwitchRole('advertiser')}
                disabled={switchingRole || userRole === 'advertiser'}
                className={`w-full p-4 rounded border transition-all text-left ${
                  userRole === 'advertiser'
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : 'bg-neutral-800 border-neutral-700 text-white hover:border-orange-500 hover:bg-neutral-700'
                } disabled:opacity-50`}
              >
                <div className="font-medium text-lg">Advertiser</div>
                <div className="text-sm text-neutral-400 mt-1">
                  Create and manage ad campaigns
                </div>
                {userRole === 'advertiser' && (
                  <div className="text-xs text-orange-400 mt-2">● Current Role</div>
                )}
              </button>

              <button
                onClick={() => handleSwitchRole('host')}
                disabled={switchingRole || userRole === 'host'}
                className={`w-full p-4 rounded border transition-all text-left ${
                  userRole === 'host'
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : 'bg-neutral-800 border-neutral-700 text-white hover:border-orange-500 hover:bg-neutral-700'
                } disabled:opacity-50`}
              >
                <div className="font-medium text-lg">Host</div>
                <div className="text-sm text-neutral-400 mt-1">
                  Earn by displaying ads on your profile
                </div>
                {userRole === 'host' && (
                  <div className="text-xs text-orange-400 mt-2">● Current Role</div>
                )}
              </button>

              <button
                onClick={() => handleSwitchRole('operator')}
                disabled={switchingRole || userRole === 'operator'}
                className={`w-full p-4 rounded border transition-all text-left ${
                  userRole === 'operator'
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : 'bg-neutral-800 border-neutral-700 text-white hover:border-orange-500 hover:bg-neutral-700'
                } disabled:opacity-50`}
              >
                <div className="font-medium text-lg">Operator</div>
                <div className="text-sm text-neutral-400 mt-1">
                  Manage platform operations and settlements
                </div>
                {userRole === 'operator' && (
                  <div className="text-xs text-orange-400 mt-2">● Current Role</div>
                )}
              </button>
            </div>

            <button
              onClick={() => setShowRoleSwitcher(false)}
              className="w-full mt-4 px-4 py-2 rounded bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            {switchingRole && (
              <div className="mt-4 text-center text-sm text-orange-400">
                Switching role...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


