'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  ChevronRight,
  Monitor,
  Settings,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  Bell,
  RefreshCw,
  LogOut,
  User,
  UserPlus,
  Wallet
} from 'lucide-react';

interface HostStats {
  totalEarnings: number;
  todayEarnings: number;
  hourlyEarnings: number;
  lifetimeEarnings: number;
  impressions: number;
  clicks: number;
  ctr: number;
  activeSlots: number;
  nextPayout: string;
  reputationScore: number;
}

interface PayoutHistory {
  id: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  epoch: number;
  campaignId: string;
  campaignName: string;
}

interface AdSlot {
  id: string;
  type: 'banner' | 'pinned_cast' | 'frame';
  isActive: boolean;
  earnings: number;
  impressions: number;
  clicks: number;
}

// Host Dashboard Content Component
function HostDashboardContent() {
  const router = useRouter();
  const [stats, setStats] = useState<HostStats | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    fetchHostData();
  }, [timeRange]);

  const fetchHostData = async () => {
    try {
      const [statsRes, payoutsRes, slotsRes] = await Promise.all([
        fetch('/api/host/stats'),
        fetch('/api/host/payouts'),
        fetch('/api/host/slots')
      ]);

      if (!statsRes.ok || !payoutsRes.ok || !slotsRes.ok) {
        throw new Error('Failed to fetch host data');
      }

      const [statsData, payoutsData, slotsData] = await Promise.all([
        statsRes.json(),
        payoutsRes.json(),
        slotsRes.json()
      ]);

      setStats(statsData.stats);
      setPayoutHistory(payoutsData.payouts || []);
      setAdSlots(slotsData.slots || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotToggle = async (slotId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/host/slots/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (!res.ok) throw new Error('Failed to update slot');
      
      setAdSlots(prev => prev.map(slot => 
        slot.id === slotId ? { ...slot, isActive } : slot
      ));
      
      toast({
        title: 'Slot Updated',
        description: `Ad slot ${isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update ad slot',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSlotIcon = (type: string) => {
    switch (type) {
      case 'banner': return '🖼️';
      case 'pinned_cast': return '📌';
      case 'frame': return '🖼️';
      default: return '📱';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-800 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-neutral-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">{/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Host Dashboard</h1>
          <p className="text-neutral-400 text-sm mt-1">Track your earnings and manage ad slots</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchHostData}
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Today's Earnings</p>
                <p className="text-2xl font-bold text-green-500 font-mono">
                  ${stats?.todayEarnings.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  +${stats?.hourlyEarnings.toFixed(2) || '0.00'} this hour
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Lifetime Earnings</p>
                <p className="text-2xl font-bold text-white font-mono">
                  ${stats?.lifetimeEarnings.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Total USDC earned
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Active Slots</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {stats?.activeSlots || 0}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {adSlots.filter(slot => slot.isActive).length} of {adSlots.length} slots
                </p>
              </div>
              <Monitor className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Reputation Score</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {stats?.reputationScore || 0}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Higher score = better placement
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Impressions</p>
                <p className="text-2xl font-bold text-white font-mono">{stats?.impressions.toLocaleString() || 0}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">Clicks</p>
                <p className="text-2xl font-bold text-white font-mono">{stats?.clicks.toLocaleString() || 0}</p>
              </div>
              <MousePointer className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-400">CTR</p>
                <p className="text-2xl font-bold text-white font-mono">
                  {stats?.ctr.toFixed(2) || '0.00'}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ad Slots Management */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">AD SLOTS MANAGEMENT</CardTitle>
            <CardDescription className="text-neutral-500">Manage your monetizable profile areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-4 border border-neutral-700 rounded-lg bg-neutral-800 hover:bg-neutral-750 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getSlotIcon(slot.type)}</span>
                    <div>
                      <p className="font-medium capitalize text-white">
                        {slot.type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-neutral-400 font-mono">
                        {slot.impressions.toLocaleString()} impressions • 
                        {slot.clicks.toLocaleString()} clicks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-green-500 font-mono">
                        ${slot.earnings.toFixed(2)}
                      </p>
                      <p className="text-xs text-neutral-500">earned</p>
                    </div>
                    <Button
                      size="sm"
                      variant={slot.isActive ? "default" : "outline"}
                      onClick={() => handleSlotToggle(slot.id, !slot.isActive)}
                      className={slot.isActive ? "bg-orange-500 hover:bg-orange-600 text-black" : "border-neutral-600 text-neutral-300"}
                    >
                      {slot.isActive ? 'Active' : 'Inactive'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payouts */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">RECENT PAYOUTS</CardTitle>
            <CardDescription className="text-neutral-500">Your latest USDC payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payoutHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 mx-auto text-neutral-600" />
                  <p className="text-neutral-400 mt-2">No payouts yet</p>
                  <p className="text-sm text-neutral-500">
                    Earnings will appear here once you start receiving ads
                  </p>
                </div>
              ) : (
                payoutHistory.slice(0, 5).map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-3 border border-neutral-700 rounded-lg bg-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium text-white font-mono">${payout.amount.toFixed(2)} USDC</p>
                        <p className="text-sm text-neutral-400">
                          {new Date(payout.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(payout.status)}>
                        {payout.status}
                      </Badge>
                      <p className="text-xs text-neutral-500 mt-1 font-mono">
                        Epoch {payout.epoch}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Payout Info */}
      {stats?.nextPayout && (
        <Card className="mt-8 bg-neutral-900 border-neutral-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-white">Next Payout</p>
                  <p className="text-sm text-neutral-400">
                    {stats.nextPayout}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-500 font-mono">
                  ${stats.hourlyEarnings.toFixed(2)}
                </p>
                <p className="text-sm text-neutral-500">pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          className="h-20 flex flex-col items-center justify-center border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:border-orange-500"
          onClick={() => router.push('/host/analytics')}
        >
          <TrendingUp className="w-6 h-6 mb-2" />
          <span>View Analytics</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-20 flex flex-col items-center justify-center border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:border-orange-500"
          onClick={() => router.push('/host/referrals')}
        >
          <DollarSign className="w-6 h-6 mb-2" />
          <span>Referral Program</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-20 flex flex-col items-center justify-center border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:border-orange-500"
          onClick={() => router.push('/host/settings')}
        >
          <Settings className="w-6 h-6 mb-2" />
          <span>Account Settings</span>
        </Button>
      </div>
    </div>
  );
}

// Main Host Dashboard Page with Sidebar
export default function HostDashboard() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [user, setUser] = useState<any>(null);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      // Check if user is authenticated
      if (!token || !userStr) {
        console.log('⚠️ User not authenticated, redirecting to home...');
        router.push('/');
        return;
      }
      
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        // Verify user is actually a host
        if (userData.role !== 'host') {
          console.log('⚠️ Non-host user accessing host dashboard, redirecting...');
          router.push('/dashboard');
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
        router.push('/');
      }
    }
  }, [router]);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    }
  };

  const handleSwitchRole = async (newRole: 'advertiser' | 'host' | 'operator') => {
    if (!user) return;
    
    setSwitchingRole(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/auth/update-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole,
          farcasterId: user.farcasterId
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        if (newRole === 'host') {
          window.location.reload();
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        alert('Failed to switch role. Please try again.');
      }
    } catch (error) {
      console.error('Error switching role:', error);
      alert('Failed to switch role. Please try again.');
    } finally {
      setSwitchingRole(false);
      setShowRoleSwitcher(false);
    }
  };

  const navigationItems = [
    { id: "dashboard", icon: Monitor, label: "DASHBOARD" },
    { id: "performance", icon: TrendingUp, label: "PERFORMANCE" },
    { id: "earnings", icon: DollarSign, label: "EARNINGS" },
    { id: "settings", icon: Settings, label: "SETTINGS" },
  ];

  // Show loading state while checking auth
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div
          className={`hidden md:flex ${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-8">
              <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
                <h1 className="text-orange-500 font-bold text-lg tracking-wider">FARCASTER ADS - HOST</h1>
                <p className="text-neutral-500 text-xs">v2.1.7 HOST DASHBOARD</p>
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
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                    activeSection === item.id
                      ? "bg-orange-500 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
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
                FARCASTER AD RENTAL / <span className="text-orange-500">HOST</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-neutral-500">LAST UPDATE: {new Date().toLocaleString()} UTC</div>
              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="flex-1 overflow-auto bg-black">
            {activeSection === "dashboard" && <HostDashboardContent />}
            {activeSection === "performance" && (
              <div className="p-6">
                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Analytics</CardTitle>
                    <CardDescription className="text-neutral-400">Coming soon...</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}
            {activeSection === "earnings" && (
              <div className="p-6">
                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-white">Earnings Details</CardTitle>
                    <CardDescription className="text-neutral-400">Coming soon...</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}
            {activeSection === "settings" && (
              <div className="p-6">
                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-white">Host Settings</CardTitle>
                    <CardDescription className="text-neutral-400">Coming soon...</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}
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
                  disabled={switchingRole}
                  className="w-full p-4 rounded border transition-all text-left bg-neutral-800 border-neutral-700 text-white hover:border-orange-500 hover:bg-neutral-700"
                >
                  <div className="font-medium text-lg">Advertiser</div>
                  <div className="text-sm text-neutral-400 mt-1">
                    Create and manage ad campaigns
                  </div>
                </button>

                <button
                  onClick={() => handleSwitchRole('host')}
                  disabled={true}
                  className="w-full p-4 rounded border transition-all text-left bg-orange-500/20 border-orange-500 text-orange-400 opacity-50"
                >
                  <div className="font-medium text-lg">Host</div>
                  <div className="text-sm text-neutral-400 mt-1">
                    Earn by displaying ads on your profile
                  </div>
                  <div className="text-xs text-orange-400 mt-2">● Current Role</div>
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

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-700 z-50 safe-area-inset-bottom">
          <nav className="flex justify-around items-center h-16">
            {navigationItems.map((item) => (
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
  );
}
