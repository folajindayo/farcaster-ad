'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  DollarCircle,
  GraphUp,
  Eye,
  CursorPointer,
  Clock,
  Wallet,
  Settings,
  Calendar,
  Pin,
  Gift,
  CheckCircle,
  WarningTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Refresh,
  Download,
  Send,
  Bell,
  Star,
  User,
  Spark
} from 'iconoir-react';

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

export default function HostDashboard() {
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
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Host Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your earnings and manage ad slots</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchHostData}>
            <Refresh className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => router.push('/host/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                <p className="text-2xl font-bold text-green-600">
                  ${stats?.todayEarnings.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  +${stats?.hourlyEarnings.toFixed(2) || '0.00'} this hour
                </p>
              </div>
              <DollarCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lifetime Earnings</p>
                <p className="text-2xl font-bold">
                  ${stats?.lifetimeEarnings.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Total USDC earned
                </p>
              </div>
              <GraphUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Slots</p>
                <p className="text-2xl font-bold">
                  {stats?.activeSlots || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {adSlots.filter(slot => slot.isActive).length} of {adSlots.length} slots
                </p>
              </div>
              <Pin className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reputation Score</p>
                <p className="text-2xl font-bold">
                  {stats?.reputationScore || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Higher score = better ad placement
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Impressions</p>
                <p className="text-2xl font-bold">{stats?.impressions.toLocaleString() || 0}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clicks</p>
                <p className="text-2xl font-bold">{stats?.clicks.toLocaleString() || 0}</p>
              </div>
              <CursorPointer className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CTR</p>
                <p className="text-2xl font-bold">
                  {stats?.ctr.toFixed(2) || '0.00'}%
                </p>
              </div>
              <GraphUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ad Slots Management */}
        <Card>
          <CardHeader>
            <CardTitle>Ad Slots</CardTitle>
            <CardDescription>Manage your monetizable profile areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getSlotIcon(slot.type)}</span>
                    <div>
                      <p className="font-medium capitalize">
                        {slot.type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {slot.impressions.toLocaleString()} impressions • 
                        {slot.clicks.toLocaleString()} clicks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ${slot.earnings.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">earned</p>
                    </div>
                    <Button
                      size="sm"
                      variant={slot.isActive ? "default" : "outline"}
                      onClick={() => handleSlotToggle(slot.id, !slot.isActive)}
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
        <Card>
          <CardHeader>
            <CardTitle>Recent Payouts</CardTitle>
            <CardDescription>Your latest USDC payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payoutHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">No payouts yet</p>
                  <p className="text-sm text-gray-400">
                    Earnings will appear here once you start receiving ads
                  </p>
                </div>
              ) : (
                payoutHistory.slice(0, 5).map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">${payout.amount.toFixed(2)} USDC</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payout.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(payout.status)}>
                        {payout.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
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
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-medium">Next Payout</p>
                  <p className="text-sm text-gray-600">
                    {stats.nextPayout}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  ${stats.hourlyEarnings.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          className="h-20 flex flex-col items-center justify-center"
          onClick={() => router.push('/host/analytics')}
        >
          <GraphUp className="w-6 h-6 mb-2" />
          <span>View Analytics</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-20 flex flex-col items-center justify-center"
          onClick={() => router.push('/host/referrals')}
        >
          <Gift className="w-6 h-6 mb-2" />
          <span>Referral Program</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-20 flex flex-col items-center justify-center"
          onClick={() => router.push('/host/settings')}
        >
          <Settings className="w-6 h-6 mb-2" />
          <span>Account Settings</span>
        </Button>
      </div>
    </div>
  );
}
