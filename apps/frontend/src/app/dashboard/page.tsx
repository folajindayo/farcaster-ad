'use client';

import { useState, useEffect } from 'react';
import RoleBasedDashboard from '@/components/role-based/RoleBasedDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

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

// Advertiser Dashboard Page Component
function AdvertiserDashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('advertiser');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Log user data on mount and get role
    let userData: any = null;
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          userData = JSON.parse(userStr)
          console.log('👤 Dashboard loaded with user:', userData)
          console.log('🎭 Current Role:', userData.role)
          setUserRole(userData.role)
          setUserId(userData._id || userData.id)
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }
    }
    
    // Pass user data directly to fetch
    if (userData) {
      fetchCampaigns(userData.role, userData._id || userData.id);
    } else {
      fetchCampaigns();
    }
  }, []);

  const fetchCampaigns = async (role?: string, id?: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      let url = `${backendUrl}/api/campaigns`;
      
      const currentRole = role || userRole;
      const currentUserId = id || userId;
      
      // Fetch different campaigns based on role
      if (currentRole === 'advertiser' && currentUserId) {
        // Advertiser: Get campaigns they created
        url = `${backendUrl}/api/campaigns/advertiser/${currentUserId}`;
        console.log('📡 Fetching advertiser campaigns for user:', currentUserId);
      } else if (currentRole === 'host' && currentUserId) {
        // Host: Get active campaigns on their account (TODO: implement endpoint)
        // For now, fetch all active campaigns
        url = `${backendUrl}/api/campaigns?status=active`;
        console.log('📡 Fetching active campaigns for host');
      }
      
      console.log('📡 Fetching campaigns from:', url);
      
      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Campaigns received:', result);
        
        // Handle different response structures
        const campaignsData = result.data?.campaigns || result.campaigns || result.data || [];
        setCampaigns(campaignsData);
        console.log(`✅ Loaded ${campaignsData.length} campaigns for ${currentRole}`);
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
  const completedCampaigns = campaigns.filter(
    (c) => c.status === 'completed'
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campaign Performance Overview */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              CAMPAIGN PERFORMANCE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">
                  {activeCampaigns}
                </div>
                <div className="text-xs text-neutral-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">
                  {pausedCampaigns}
                </div>
                <div className="text-xs text-neutral-500">Paused</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">
                  {completedCampaigns}
                </div>
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
                campaigns.slice(0, 4).map((campaign) => (
                  <div
                    key={campaign._id || campaign.id}
                    className="flex items-center justify-between p-2 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          campaign.status === 'active'
                            ? 'bg-white'
                            : campaign.status === 'paused'
                              ? 'bg-neutral-500'
                              : 'bg-green-500'
                        }`}
                      ></div>
                      <div>
                        <div className="text-xs text-white font-mono">
                          {campaign.campaignId ||
                            campaign._id?.slice(-6) ||
                            'N/A'}
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
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Activity Log */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              REAL-TIME ACTIVITY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {[
                {
                  time: '25/01/2025 09:29',
                  campaign: 'summer_sale_2024',
                  action: 'campaign activated on',
                  location: 'Farcaster Network',
                  metric: '125K impressions',
                },
                {
                  time: '25/01/2025 08:12',
                  campaign: 'crypto_defi_launch',
                  action: 'impression target reached on',
                  location: 'Crypto Community',
                  metric: '75K impressions',
                },
                {
                  time: '24/01/2025 22:55',
                  campaign: 'nft_collection_drop',
                  action: 'campaign completed on',
                  location: 'NFT Space',
                  metric: '45K impressions',
                },
                {
                  time: '24/01/2025 21:33',
                  campaign: 'black_friday_blast',
                  action: 'CTR improved to',
                  location: 'Retail Sector',
                  metric: '6.2% CTR',
                },
              ].map((log, index) => (
                <div
                  key={index}
                  className="text-xs border-l-2 border-orange-500 pl-3 hover:bg-neutral-800 p-2 rounded transition-colors"
                >
                  <div className="text-neutral-500 font-mono">{log.time}</div>
                  <div className="text-white">
                    Campaign{' '}
                    <span className="text-orange-500 font-mono">
                      {log.campaign}
                    </span>{' '}
                    {log.action}{' '}
                    <span className="text-white font-mono">{log.location}</span>
                    <span className="text-orange-500 font-mono">
                      {' '}
                      - {log.metric}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Dashboard */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              ANALYTICS DASHBOARD
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <div className="absolute inset-0 border-2 border-white rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute inset-2 border border-white rounded-full opacity-40"></div>
              <div className="absolute inset-4 border border-white rounded-full opacity-20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-white opacity-30"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-px h-full bg-white opacity-30"></div>
              </div>
            </div>

            <div className="text-xs text-neutral-500 space-y-1 w-full font-mono">
              <div className="flex justify-between">
                <span># 2025-01-25 14:23 UTC</span>
              </div>
              <div className="text-white">
                {
                  '> [SYS:analytics] ::: INIT >> ^^^ loading ad performance data'
                }
              </div>
              <div className="text-orange-500">
                {'> CH#2 | 1231.9082464.500...xR3'}
              </div>
              <div className="text-white">{'> DATA LOCKED'}</div>
              <div className="text-neutral-400">
                {
                  '> MSG >> "...impression tracking active... monitoring CTR and conversions"'
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="lg:col-span-8 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              PERFORMANCE METRICS OVERVIEW
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 relative">
              {/* Chart Grid */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-20">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-neutral-700"></div>
                ))}
              </div>

              {/* Chart Line */}
              <svg className="absolute inset-0 w-full h-full">
                <polyline
                  points="0,120 50,100 100,110 150,90 200,95 250,85 300,100 350,80"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                />
                <polyline
                  points="0,140 50,135 100,130 150,125 200,130 250,135 300,125 350,120"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-neutral-500 -ml-5 font-mono">
                <span>1000</span>
                <span>800</span>
                <span>600</span>
                <span>400</span>
              </div>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-neutral-500 -mb-6 font-mono">
                <span>Jan 1, 2025</span>
                <span>Jan 25, 2025</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Statistics */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              CAMPAIGN STATISTICS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-xs text-white font-medium">
                    Successful Campaigns
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">High Budget ($5K+)</span>
                    <span className="text-white font-bold font-mono">12</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">
                      Medium Budget ($2-5K)
                    </span>
                    <span className="text-white font-bold font-mono">28</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">
                      Low Budget (&lt;$2K)
                    </span>
                    <span className="text-white font-bold font-mono">45</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-red-500 font-medium">
                    Failed Campaigns
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">High Budget ($5K+)</span>
                    <span className="text-white font-bold font-mono">3</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">
                      Medium Budget ($2-5K)
                    </span>
                    <span className="text-white font-bold font-mono">7</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">
                      Low Budget (&lt;$2K)
                    </span>
                    <span className="text-white font-bold font-mono">12</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            {userRole === 'advertiser' ? 'MY CAMPAIGNS' : userRole === 'host' ? 'ACTIVE CAMPAIGNS' : 'ALL CAMPAIGNS'}
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
              {userRole === 'advertiser' && (
                <div className="text-sm">Create your first campaign to get started</div>
              )}
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
    </div>
  );
}

// Host Network Page Component
function HostNetworkPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              HOST NETWORK STATUS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative">
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-8 opacity-20">
                {Array.from({ length: 96 }).map((_, i) => (
                  <div key={i} className="border border-neutral-700"></div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-mono text-orange-500">
                  HOST NETWORK
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              HOST STATUS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-neutral-400">Active Hosts</span>
                <span className="text-white font-mono">847</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Opted In</span>
                <span className="text-white font-mono">23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Opted Out</span>
                <span className="text-white font-mono">12</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Campaign Management Page Component
function CampaignManagementPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-12 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              CAMPAIGN MANAGEMENT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-mono text-orange-500">
                  CAMPAIGN CONTROL
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Analytics Page Component
function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-12 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              ANALYTICS & INSIGHTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-mono text-orange-500">
                  ANALYTICS
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Settings Page Component
function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-12 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              SYSTEM SETTINGS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-mono text-orange-500">
                  SETTINGS
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function FarcasterAdDashboard() {
  const [userRole, setUserRole] = useState<'advertiser' | 'host' | 'operator'>(
    'advertiser'
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // In a real app, this would come from authentication context
  useEffect(() => {
    // Simulate role detection - in real app, get from user context
    if (typeof window !== 'undefined') {
      const role =
        (localStorage.getItem('userRole') as
          | 'advertiser'
          | 'host'
          | 'operator') || 'advertiser';
      setUserRole(role);
    }
  }, []);

  return (
    <ProtectedRoute>
      <RoleBasedDashboard
        userRole={userRole}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
    </ProtectedRoute>
  );
}
