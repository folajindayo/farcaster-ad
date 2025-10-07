'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Monitor, Settings, Target, Users, Bell, RefreshCw, TrendingUp, DollarSign, Eye, MousePointer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateCampaignModalDetailed } from '@/components/modals/CreateCampaignModalDetailed'

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
  const [activeSection, setActiveSection] = useState("overview");

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

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs text-white">SYSTEM ONLINE</span>
              </div>
              <div className="text-xs text-neutral-500">
                <div>UPTIME: 72:14:33</div>
                <div>ROLE: {userRole.toUpperCase()}</div>
                <div>STATUS: ACTIVE</div>
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
    </div>
  )
}


