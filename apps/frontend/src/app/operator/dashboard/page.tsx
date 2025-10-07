'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  CheckCircle,
  Circle,
  Eye,
  PcMouse,
  DollarCircle,
  GraphUp,
  User,
  Pin,
  MessageAlert,
  CandlestickChart,
  Settings,
  Refresh,
  Download,
  Filter,
  Search,
  Calendar,
  Spark,
  Shield,
  Activity
} from 'iconoir-react';

interface PendingCampaign {
  id: string;
  name: string;
  advertiser: string;
  budget: number;
  type: 'banner' | 'pinned_cast' | 'frame';
  creative: {
    imageUrl?: string;
    text?: string;
    ctaText?: string;
    ctaUrl?: string;
  };
  targeting: {
    minFollowers: number;
    maxFollowers: number;
    categories: string[];
    regions: string[];
  };
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface NetworkStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalHosts: number;
  activeHosts: number;
  totalImpressions: number;
  totalClicks: number;
  totalRevenue: number;
  operatorFees: number;
  avgCtr: number;
  pendingApprovals: number;
}

interface EpochStatus {
  epoch: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalAmount: number;
  hostCount: number;
  completedAt?: string;
  error?: string;
}

export default function OperatorDashboard() {
  const [pendingCampaigns, setPendingCampaigns] = useState<PendingCampaign[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [epochStatus, setEpochStatus] = useState<EpochStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchOperatorData();
  }, [filter]);

  const fetchOperatorData = async () => {
    try {
      const [campaignsRes, statsRes, epochsRes] = await Promise.all([
        fetch(`/api/operator/campaigns?filter=${filter}`),
        fetch('/api/operator/stats'),
        fetch('/api/operator/epochs')
      ]);

      if (!campaignsRes.ok || !statsRes.ok || !epochsRes.ok) {
        throw new Error('Failed to fetch operator data');
      }

      const [campaignsData, statsData, epochsData] = await Promise.all([
        campaignsRes.json(),
        statsRes.json(),
        epochsRes.json()
      ]);

      setPendingCampaigns(campaignsData.campaigns || []);
      setNetworkStats(statsData.stats);
      setEpochStatus(epochsData.epochs || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load operator dashboard',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignAction = async (campaignId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const res = await fetch(`/api/operator/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason })
      });

      if (!res.ok) throw new Error('Failed to update campaign');
      
      setPendingCampaigns(prev => prev.filter(c => c.id !== campaignId));
      
      toast({
        title: 'Campaign Updated',
        description: `Campaign ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update campaign',
        variant: 'destructive'
      });
    }
  };

  const handleEpochAction = async (epoch: number, action: 'process' | 'retry') => {
    try {
      const res = await fetch(`/api/operator/epochs/${epoch}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!res.ok) throw new Error('Failed to process epoch');
      
      toast({
        title: 'Epoch Processing',
        description: `Epoch ${epoch} ${action === 'process' ? 'started' : 'retried'}`,
      });
      
      fetchOperatorData(); // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process epoch',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEpochStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold">Operator Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage campaigns, hosts, and network operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchOperatorData}>
            <Refresh className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold">{networkStats?.totalCampaigns || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {networkStats?.activeCampaigns || 0} active
                </p>
              </div>
              <Pin className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hosts</p>
                <p className="text-2xl font-bold">{networkStats?.totalHosts || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {networkStats?.activeHosts || 0} active
                </p>
              </div>
              <User className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${networkStats?.totalRevenue.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ${networkStats?.operatorFees.toFixed(2) || '0.00'} fees
                </p>
              </div>
              <DollarCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {networkStats?.pendingApprovals || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Campaigns awaiting review
                </p>
              </div>
              <MessageAlert className="w-8 h-8 text-yellow-500" />
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
                <p className="text-2xl font-bold">{networkStats?.totalImpressions.toLocaleString() || 0}</p>
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
                <p className="text-2xl font-bold">{networkStats?.totalClicks.toLocaleString() || 0}</p>
              </div>
              <PcMouse className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg CTR</p>
                <p className="text-2xl font-bold">
                  {networkStats?.avgCtr.toFixed(2) || '0.00'}%
                </p>
              </div>
              <CandlestickChart className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Campaigns */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Campaign Approvals</CardTitle>
                <CardDescription>
                  {pendingCampaigns.length} campaigns pending review
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-blue-50' : ''}
                >
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilter('pending')}
                  className={filter === 'pending' ? 'bg-blue-50' : ''}
                >
                  Pending
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">No pending campaigns</p>
                </div>
              ) : (
                pendingCampaigns.map((campaign) => (
                  <CampaignApprovalCard
                    key={campaign.id}
                    campaign={campaign}
                    onAction={handleCampaignAction}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Epoch Status */}
        <Card>
          <CardHeader>
            <CardTitle>Epoch Status</CardTitle>
            <CardDescription>Recent payout processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {epochStatus.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">No epochs processed yet</p>
                </div>
              ) : (
                epochStatus.slice(0, 5).map((epoch) => (
                  <div key={epoch.epoch} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Spark className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Epoch {epoch.epoch}</p>
                        <p className="text-sm text-gray-600">
                          {epoch.hostCount} hosts • ${epoch.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getEpochStatusColor(epoch.status)}>
                        {epoch.status}
                      </Badge>
                      {epoch.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => handleEpochAction(epoch.epoch, 'retry')}
                        >
                          Retry
                        </Button>
                      )}
                      {epoch.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => handleEpochAction(epoch.epoch, 'process')}
                        >
                          Process
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CampaignApprovalCard({ 
  campaign, 
  onAction 
}: { 
  campaign: PendingCampaign; 
  onAction: (id: string, action: 'approve' | 'reject', reason?: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold">{campaign.name}</h3>
            <Badge className={getStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
          </div>

          <div className="text-sm text-gray-600 mb-3">
            <p>Advertiser: {campaign.advertiser}</p>
            <p>Budget: ${campaign.budget.toLocaleString()}</p>
            <p>Type: {campaign.type.replace('_', ' ')}</p>
            <p>Submitted: {new Date(campaign.submittedAt).toLocaleDateString()}</p>
          </div>

          {campaign.creative.imageUrl && (
            <div className="mb-3">
              <img 
                src={campaign.creative.imageUrl} 
                alt="Campaign creative"
                className="w-24 h-16 object-cover rounded border"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
            
            {campaign.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(campaign.id, 'approve')}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction(campaign.id, 'reject', rejectReason)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <Circle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
          </div>

          {showDetails && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Campaign Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">CTA Text:</p>
                  <p className="font-medium">{campaign.creative.ctaText || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Landing URL:</p>
                  <p className="font-medium text-blue-600 truncate">
                    {campaign.creative.ctaUrl || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Follower Range:</p>
                  <p className="font-medium">
                    {campaign.targeting.minFollowers.toLocaleString()} - {campaign.targeting.maxFollowers.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Categories:</p>
                  <p className="font-medium">
                    {campaign.targeting.categories.join(', ') || 'None'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
