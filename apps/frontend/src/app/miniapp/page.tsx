'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/frame-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Pin, DollarSign, Eye, TrendingUp } from 'iconoir-react';

interface MiniAppContext {
  user?: {
    fid: number;
    username?: string;
    displayName?: string;
  };
}

export default function MiniAppPage() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<MiniAppContext | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        console.log('🚀 Initializing Farcaster Mini App SDK...');
        
        // Initialize SDK
        await sdk.actions.ready();
        setIsSDKLoaded(true);
        console.log('✅ SDK Ready');

        // Get user context
        const ctx = await sdk.context;
        console.log('👤 User context:', ctx);
        setContext(ctx);

        // Check if user has already granted permissions
        const hasPermissions = await checkPermissions(ctx.user?.fid);
        setPermissionsGranted(hasPermissions);

        setLoading(false);
      } catch (err) {
        console.error('❌ SDK initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Mini App');
        setLoading(false);
      }
    };

    initializeSDK();
  }, []);

  const checkPermissions = async (fid?: number): Promise<boolean> => {
    if (!fid) return false;
    
    try {
      const response = await fetch(`/api/miniapp/permissions?fid=${fid}`);
      if (response.ok) {
        const data = await response.json();
        return data.permissionsGranted || false;
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
    }
    return false;
  };

  const handleGrantPermissions = async () => {
    if (!context?.user) {
      setError('User context not available');
      return;
    }

    try {
      setLoading(true);
      console.log('🔐 Granting permissions...');

      // Save permission grant to backend
      const response = await fetch('/api/miniapp/grant-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: context.user.fid,
          username: context.user.username,
          displayName: context.user.displayName,
        }),
      });

      if (response.ok) {
        setPermissionsGranted(true);
        console.log('✅ Permissions granted successfully');
        
        // Show success toast
        await sdk.actions.openUrl(window.location.href);
      } else {
        throw new Error('Failed to grant permissions');
      }
    } catch (err) {
      console.error('Error granting permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to grant permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePermissions = async () => {
    if (!context?.user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/miniapp/revoke-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: context.user.fid }),
      });

      if (response.ok) {
        setPermissionsGranted(false);
        console.log('🔒 Permissions revoked');
      }
    } catch (err) {
      console.error('Error revoking permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to revoke permissions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/40 border-purple-500/30 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-purple-200">Loading Farcaster Mini App...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/40 border-red-500/30 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <p className="text-red-400 mb-4">❌ {error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!permissionsGranted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Card className="bg-black/40 border-purple-500/30 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-purple-100">
                🎯 Become an Ad Host
              </CardTitle>
              <p className="text-center text-purple-300 mt-2">
                Earn by displaying sponsored content on your Farcaster profile
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Info */}
              {context?.user && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-sm text-purple-300">Logged in as:</p>
                  <p className="text-lg font-bold text-purple-100">
                    @{context.user.username} (FID: {context.user.fid})
                  </p>
                </div>
              )}

              {/* Benefits */}
              <div className="space-y-4">
                <h3 className="font-semibold text-purple-100">What you'll get:</h3>
                
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-purple-100">Passive Income</p>
                    <p className="text-sm text-purple-300">
                      Earn from ad impressions and clicks on your profile
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-purple-100">Full Control</p>
                    <p className="text-sm text-purple-300">
                      Choose which ads to display, set your own rates
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-purple-100">Real-time Payouts</p>
                    <p className="text-sm text-purple-300">
                      Hourly settlements via blockchain
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Pin className="w-5 h-5 text-pink-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-purple-100">Non-intrusive Ads</p>
                    <p className="text-sm text-purple-300">
                      Banner ads and optional pinned casts only
                    </p>
                  </div>
                </div>
              </div>

              {/* Permissions Info */}
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-purple-100 mb-2">Required Permissions:</h4>
                <ul className="text-sm text-purple-300 space-y-1">
                  <li>✓ Post pinned casts on your behalf</li>
                  <li>✓ Read your public profile information</li>
                  <li>✗ NO access to your DMs or private data</li>
                  <li>✗ Cannot edit your profile or follow anyone</li>
                </ul>
              </div>

              {/* CTA */}
              <Button
                onClick={handleGrantPermissions}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg"
              >
                {loading ? 'Processing...' : '🚀 Grant Permissions & Start Earning'}
              </Button>

              <p className="text-xs text-center text-purple-400">
                You can revoke permissions at any time from your dashboard
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Permissions already granted - show success state
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card className="bg-black/40 border-green-500/30 backdrop-blur-xl">
          <CardContent className="p-8 text-center space-y-6">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto" />
            
            <div>
              <h2 className="text-2xl font-bold text-green-100 mb-2">
                ✅ You're All Set!
              </h2>
              <p className="text-green-300">
                You're now an approved ad host. Ads will appear on your profile when campaigns match your criteria.
              </p>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-sm text-green-300">
                Check your dashboard at <strong>farcaster-ad-rental.com/dashboard</strong> to:
              </p>
              <ul className="text-sm text-green-200 mt-2 space-y-1">
                <li>• View your earnings</li>
                <li>• Configure ad preferences</li>
                <li>• See active campaigns</li>
                <li>• Claim your payouts</li>
              </ul>
            </div>

            <Button
              onClick={handleRevokePermissions}
              disabled={loading}
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              Revoke Permissions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

