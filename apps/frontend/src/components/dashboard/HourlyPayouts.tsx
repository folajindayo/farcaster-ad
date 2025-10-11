'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Activity,
  CheckCircle2,
  Clock3,
  AlertCircle
} from 'lucide-react';

interface EpochData {
  id: string;
  campaignId: number;
  epoch: number;
  merkleRoot: string;
  allocatedAmount: string;
  claimedAmount: string;
  status: 'pending' | 'finalized' | 'settled';
  finalizedAt: string | null;
  payouts?: PayoutData[];
}

interface PayoutData {
  index: number;
  hostAddress: string;
  amount: string;
  claimed: boolean;
  claimedTxHash?: string;
}

interface PayoutSummary {
  totalPending: string;
  totalClaimed: string;
  pendingCount: number;
  claimedCount: number;
}

export default function HourlyPayouts({ walletAddress }: { walletAddress?: string }) {
  const [epochs, setEpochs] = useState<EpochData[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [selectedEpoch, setSelectedEpoch] = useState<EpochData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data on mount and when wallet changes
  useEffect(() => {
    if (walletAddress) {
      fetchPayoutData();
    }
  }, [walletAddress]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (walletAddress) {
        fetchPayoutData(true);
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [walletAddress]);

  const fetchPayoutData = async (isRefresh = false) => {
    if (!walletAddress) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Fetch payout summary for the host
      const summaryRes = await fetch(`/api/hosts/${walletAddress}/payouts`);
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setPayoutSummary(data.summary);
      }

      // Fetch recent epochs (mock for now - would need campaign ID)
      // In production, you'd fetch based on the host's active campaigns
      const epochsRes = await fetch(`/api/campaigns/active/epochs?host=${walletAddress}`);
      if (epochsRes.ok) {
        const data = await epochsRes.json();
        setEpochs(data.epochs || []);
      }
    } catch (error) {
      console.error('Error fetching payout data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTime = (epoch: number) => {
    const date = new Date(epoch * 3600 * 1000);
    return date.toLocaleString('en-US', { 
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return `$${num.toFixed(2)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'settled':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'finalized':
        return <Clock3 className="w-4 h-4 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'default' | 'secondary'> = {
      settled: 'success',
      finalized: 'default',
      pending: 'secondary'
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {payoutSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Earnings</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(payoutSummary.totalPending)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {payoutSummary.pendingCount} payments
                  </p>
                </div>
                <Clock className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Claimed</p>
                  <p className="text-2xl font-bold">
                    {formatAmount(payoutSummary.totalClaimed)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {payoutSummary.claimedCount} payments
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Next Payout</p>
                  <p className="text-lg font-semibold">
                    {new Date(Math.ceil(Date.now() / 3600000) * 3600000).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Automatic</p>
                </div>
                <Activity className="w-8 h-8 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Payout Status</p>
                  <p className="text-lg font-semibold text-green-600">Active</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {refreshing ? 'Updating...' : 'Live'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Epochs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Hourly Payouts</CardTitle>
            <CardDescription>
              Your earnings are automatically paid out every hour
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchPayoutData(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {epochs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No payouts yet</p>
                <p className="text-sm mt-2">Payouts are processed hourly</p>
              </div>
            ) : (
              epochs.map((epoch) => (
                <div
                  key={epoch.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEpoch(epoch)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          Hour {epoch.epoch}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatTime(epoch.epoch)}
                        </p>
                      </div>
                      {getStatusBadge(epoch.status)}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {formatAmount(epoch.allocatedAmount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {epoch.claimedAmount && 
                          `${formatAmount(epoch.claimedAmount)} claimed`
                        }
                      </p>
                    </div>
                  </div>
                  
                  {epoch.payouts && epoch.payouts.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {epoch.payouts.filter(p => p.claimed).length} of {epoch.payouts.length} hosts paid
                        </span>
                        {epoch.finalizedTxHash && (
                          <a
                            href={`https://basescan.org/tx/${epoch.finalizedTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View TX →
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Epoch Details Modal */}
      {selectedEpoch && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedEpoch(null)}
        >
          <Card 
            className="w-full max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Epoch {selectedEpoch.epoch} Details</CardTitle>
              <CardDescription>
                {formatTime(selectedEpoch.epoch)} • Campaign #{selectedEpoch.campaignId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedEpoch.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Allocated</p>
                    <p className="font-semibold">{formatAmount(selectedEpoch.allocatedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount Claimed</p>
                    <p className="font-semibold">{formatAmount(selectedEpoch.claimedAmount || '0')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Merkle Root</p>
                    <p className="font-mono text-xs truncate">{selectedEpoch.merkleRoot}</p>
                  </div>
                </div>

                {selectedEpoch.payouts && selectedEpoch.payouts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Payouts</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">Host</th>
                            <th className="text-right p-2">Amount</th>
                            <th className="text-center p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEpoch.payouts.map((payout) => (
                            <tr key={payout.index} className="border-t">
                              <td className="p-2 font-mono text-xs">
                                {payout.hostAddress.slice(0, 6)}...{payout.hostAddress.slice(-4)}
                              </td>
                              <td className="p-2 text-right">{formatAmount(payout.amount)}</td>
                              <td className="p-2 text-center">
                                {payout.claimed ? (
                                  <Badge variant="success" className="text-xs">Paid</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Pending</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}




