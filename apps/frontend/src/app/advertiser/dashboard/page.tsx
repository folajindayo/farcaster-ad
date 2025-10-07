'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {} from '@/components/modals/CreateCampaignModal';
import {
  Plus,
  GraphUp,
  Eye,
  PcMouse,
  DollarCircle,
  Calendar,
  Pin,
  CandlestickChart,
  Settings,
  Play,
  Pause,
  CheckCircle,
  Clock,
  MessageAlert,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  WarningTriangle,
  CursorPointer,
} from 'iconoir-react';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  startDate: string;
  endDate: string;
  type: 'banner' | 'pinned_cast' | 'frame';
  creative: {
    imageUrl?: string;
    text?: string;
    ctaText?: string;
    ctaUrl?: string;
  };
}

export default function AdvertiserDashboard() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<
    'all' | 'active' | 'paused' | 'completed'
  >('all');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignAction = async (
    campaignId: string,
    action: 'pause' | 'resume'
  ) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'pause' ? 'paused' : 'active',
        }),
      });

      if (!res.ok) throw new Error('Failed to update campaign');

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? { ...c, status: action === 'pause' ? 'paused' : 'active' }
            : c
        )
      );

      toast({
        title: 'Campaign Updated',
        description: `Campaign ${action === 'pause' ? 'paused' : 'resumed'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update campaign',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filter === 'all') return true;
    return campaign.status === filter;
  });

  const totalStats = campaigns.reduce(
    (acc, campaign) => ({
      budget: acc.budget + campaign.budget,
      spent: acc.spent + campaign.spent,
      impressions: acc.impressions + campaign.impressions,
      clicks: acc.clicks + campaign.clicks,
    }),
    { budget: 0, spent: 0, impressions: 0, clicks: 0 }
  );

  const avgCtr =
    totalStats.impressions > 0
      ? (totalStats.clicks / totalStats.impressions) * 100
      : 0;

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
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Campaign Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage your ad campaigns and track performance
            </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Budget
                </p>
                <p className="text-2xl font-bold">
                  ${totalStats.budget.toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold">
                  ${totalStats.spent.toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Impressions</p>
                <p className="text-2xl font-bold">
                  {totalStats.impressions.toLocaleString()}
                </p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CTR</p>
                <p className="text-2xl font-bold">{avgCtr.toFixed(2)}%</p>
              </div>
              <CursorPointer className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Campaigns</CardTitle>
              <CardDescription>
                {filteredCampaigns.length} of {campaigns.length} campaigns
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
                onClick={() => setFilter('active')}
                className={filter === 'active' ? 'bg-blue-50' : ''}
              >
                Active
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter('paused')}
                className={filter === 'paused' ? 'bg-blue-50' : ''}
              >
                Paused
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter('completed')}
                className={filter === 'completed' ? 'bg-blue-50' : ''}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Pin className="w-16 h-16 mx-auto text-gray-400" />
              <h3 className="text-lg font-medium mt-4">No campaigns found</h3>
              <p className="text-gray-500 mt-2">
                {filter === 'all'
                  ? 'Create your first campaign to get started'
                  : `No ${filter} campaigns found`}
              </p>
              {filter === 'all' && (
                <Button
                  className="mt-4"
                  onClick={() => router.push('/advertiser/create-campaign')}
                >
                  Create Campaign
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onAction={handleCampaignAction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchCampaigns(); // Refresh campaigns after creation
          setIsCreateModalOpen(false);
        }}
      />
    </div>
    </ProtectedRoute>
  );
}

function CampaignCard({
  campaign,
  onAction,
}: {
  campaign: Campaign;
  onAction: (id: string, action: 'pause' | 'resume') => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <WarningTriangle className="w-4 h-4" />;
    }
  };

  const getPerformanceColor = (metric: number, type: 'ctr' | 'cpm' | 'cpc') => {
    if (type === 'ctr') {
      return metric > 2
        ? 'text-green-600'
        : metric > 1
          ? 'text-yellow-600'
          : 'text-red-600';
    }
    return 'text-gray-600';
  };

  const getPerformanceIcon = (metric: number, type: 'ctr' | 'cpm' | 'cpc') => {
    if (type === 'ctr') {
      return metric > 2 ? (
        <ArrowUpRight className="w-4 h-4" />
      ) : (
        <ArrowDownRight className="w-4 h-4" />
      );
    }
    return null;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{campaign.name}</h3>
              <Badge className={getStatusColor(campaign.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(campaign.status)}
                  {campaign.status.charAt(0).toUpperCase() +
                    campaign.status.slice(1)}
                </div>
              </Badge>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                {new Date(campaign.endDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Pin className="w-4 h-4" />
                {campaign.type.replace('_', ' ')}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="font-semibold">
                  ${campaign.budget.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Spent</p>
                <p className="font-semibold">
                  ${campaign.spent.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Impressions</p>
                <p className="font-semibold">
                  {campaign.impressions.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Clicks</p>
                <p className="font-semibold">
                  {campaign.clicks.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">CTR:</span>
                <span
                  className={`font-semibold ${getPerformanceColor(campaign.ctr, 'ctr')}`}
                >
                  {campaign.ctr.toFixed(2)}%
                </span>
                {getPerformanceIcon(campaign.ctr, 'ctr')}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">CPM:</span>
                <span className="font-semibold">
                  ${campaign.cpm.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">CPC:</span>
                <span className="font-semibold">
                  ${campaign.cpc.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Creative Preview */}
            {campaign.creative.imageUrl && (
              <div className="mb-4">
                <img
                  src={campaign.creative.imageUrl}
                  alt="Campaign creative"
                  className="w-32 h-20 object-cover rounded border"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                <GraphUp className="w-4 h-4 mr-1" />
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>

              {campaign.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction(campaign.id, 'pause')}
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </Button>
              )}

              {campaign.status === 'paused' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction(campaign.id, 'resume')}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`/advertiser/campaigns/${campaign.id}`, '_blank')
                }
              >
                <Settings className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>

            {/* Detailed View */}
            {showDetails && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Campaign Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Creative Type:</p>
                    <p className="font-medium">
                      {campaign.type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">CTA Text:</p>
                    <p className="font-medium">
                      {campaign.creative.ctaText || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Landing URL:</p>
                    <p className="font-medium text-blue-600 truncate">
                      {campaign.creative.ctaUrl || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Remaining Budget:</p>
                    <p className="font-medium text-green-600">
                      ${(campaign.budget - campaign.spent).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
