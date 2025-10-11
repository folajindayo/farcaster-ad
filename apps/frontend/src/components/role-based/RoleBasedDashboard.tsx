'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Monitor, Settings, Target, Users, Bell, RefreshCw, TrendingUp, DollarSign, Eye, MousePointer, LogOut, User, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateCampaignModalDetailed } from '@/components/modals/CreateCampaignModalDetailed'
import { useRouter } from 'next/navigation'

// Campaign Interface
interface Campaign {
  _id: string;
  id?: string;
  campaignId?: string;
  title?: string;
  name?: string;
  status: string;
  budget: number;
  spent?: number;
}

// Advertiser Dashboard
function AdvertiserDashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Get user data and fetch campaigns
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const userData = JSON.parse(userStr)
          setUserId(userData._id || userData.id)
          fetchCampaigns(userData._id || userData.id)
        } catch (e) {
          console.error('Error parsing user data:', e)
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
  }, []);

  const fetchCampaigns = async (id: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const url = `${backendUrl}/api/campaigns/advertiser/${id}`;
      
      console.log('📡 Fetching advertiser campaigns from:', url);
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Campaigns received:', result);
        
        const campaignsData = result.data?.campaigns || result.campaigns || result.data || [];
        setCampaigns(campaignsData);
        console.log(`✅ Loaded ${campaignsData.length} campaigns for advertiser`);
      } else {
        console.error('Failed to fetch campaigns:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const pausedCampaigns = campaigns.filter((c) => c.status === 'paused').length;
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed').length;

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
                <div className="text-2xl font-bold text-white font-mono">{activeCampaigns}</div>
                <div className="text-xs text-neutral-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">{pausedCampaigns}</div>
                <div className="text-xs text-neutral-500">Paused</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">{completedCampaigns}</div>
                <div className="text-xs text-neutral-500">Completed</div>
              </div>
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="text-center text-neutral-500 py-4">
                  Loading campaigns...
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center text-neutral-500 py-4">
                  No campaigns yet
                </div>
              ) : (
                campaigns.slice(0, 3).map((campaign) => (
                <div
                  key={campaign._id || campaign.id}
                  className="flex items-center justify-between p-2 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        campaign.status === "active"
                          ? "bg-white"
                          : campaign.status === "paused"
                            ? "bg-neutral-500"
                            : "bg-green-500"
                      }`}
                    ></div>
                    <div>
                      <div className="text-xs text-white font-mono">
                        {campaign.campaignId || campaign._id?.slice(-6) || 'N/A'}
                      </div>
                      <div className="text-xs text-neutral-500 uppercase">
                        {campaign.title || campaign.name || 'Untitled'}
                      </div>
                      <div className="text-xs text-orange-500">
                        ${campaign.spent || 0} / ${campaign.budget || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )))}
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

      {/* Campaigns Table */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            MY CAMPAIGNS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-neutral-500 py-8">
              <div className="animate-pulse">Loading campaigns...</div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center text-neutral-500 py-8">
              <div className="text-lg mb-2">No campaigns yet</div>
              <div className="text-sm">Create your first campaign to get started</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      Campaign ID
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      Spent
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const spentAmount = campaign.spent || 0;
                    const budgetAmount = campaign.budget || 0;
                    const progressPercent = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
                    
                    return (
                      <tr
                        key={campaign._id || campaign.id}
                        className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                campaign.status === 'active'
                                  ? 'bg-green-500'
                                  : campaign.status === 'paused'
                                    ? 'bg-yellow-500'
                                    : campaign.status === 'completed'
                                      ? 'bg-blue-500'
                                      : 'bg-neutral-500'
                              }`}
                            ></div>
                            <span className="text-xs text-white uppercase font-mono">
                              {campaign.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-orange-500 font-mono">
                            {campaign.campaignId || campaign._id?.slice(-8) || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-white">
                            {campaign.title || campaign.name || 'Untitled Campaign'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-white font-mono">
                            ${budgetAmount.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-orange-500 font-mono">
                            ${spentAmount.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-neutral-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  progressPercent >= 90
                                    ? 'bg-red-500'
                                    : progressPercent >= 70
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-neutral-400 font-mono min-w-[3rem]">
                              {progressPercent.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      <CreateCampaignModalDetailed
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          // Refresh campaigns after creating a new one
          if (userId) {
            fetchCampaigns(userId);
          }
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
        
        // Redirect based on new role
        if (newRole === 'host') {
          console.log('🏠 Redirecting to Host Dashboard...')
          window.location.href = '/host/dashboard'
        } else {
          console.log('🔄 Reloading page...')
          window.location.reload()
        }
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
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div
        className={`hidden md:flex ${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300`}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
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
                disabled={switchingRole || user?.role === 'advertiser'}
                className={`w-full p-4 rounded border transition-all text-left ${
                  user?.role === 'advertiser'
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : 'bg-neutral-800 border-neutral-700 text-white hover:border-orange-500 hover:bg-neutral-700'
                } disabled:opacity-50`}
              >
                <div className="font-medium text-lg">Advertiser</div>
                <div className="text-sm text-neutral-400 mt-1">
                  Create and manage ad campaigns
                </div>
                {user?.role === 'advertiser' && (
                  <div className="text-xs text-orange-400 mt-2">● Current Role</div>
                )}
              </button>

              <button
                onClick={() => handleSwitchRole('host')}
                disabled={switchingRole || user?.role === 'host'}
                className={`w-full p-4 rounded border transition-all text-left ${
                  user?.role === 'host'
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                    : 'bg-neutral-800 border-neutral-700 text-white hover:border-orange-500 hover:bg-neutral-700'
                } disabled:opacity-50`}
              >
                <div className="font-medium text-lg">Host</div>
                <div className="text-sm text-neutral-400 mt-1">
                  Earn by displaying ads on your profile
                </div>
                {user?.role === 'host' && (
                  <div className="text-xs text-orange-400 mt-2">● Current Role</div>
                )}
              </button>

              {/* Only show Operator option if user is already an operator */}
              {user?.role === 'operator' && (
                <button
                  onClick={() => handleSwitchRole('operator')}
                  disabled={true}
                  className="w-full p-4 rounded border transition-all text-left bg-orange-500/20 border-orange-500 text-orange-400 opacity-50"
                >
                  <div className="font-medium text-lg">Operator</div>
                  <div className="text-sm text-neutral-400 mt-1">
                    Manage platform operations and settlements
                  </div>
                  <div className="text-xs text-orange-400 mt-2">● Current Role (Admin Only)</div>
                </button>
              )}
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

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-700 z-50 safe-area-inset-bottom">
        <nav className="flex justify-around items-center h-16">
          {getNavigationItems().map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                activeSection === item.id
                  ? "text-orange-500"
                  : "text-neutral-400"
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}


