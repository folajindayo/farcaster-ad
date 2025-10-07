'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink,
  MousePointerClick,
  Eye,
  TrendingUp,
  Shield,
  CheckCircle,
  ArrowRight,
  Star,
  Heart,
  Share,
  X
} from 'iconoir-react';

interface BannerAd {
  id: string;
  campaignId: string;
  campaignName: string;
  creative: {
    imageUrl?: string;
    text?: string;
    ctaText: string;
    ctaUrl: string;
  };
  advertiser: {
    name: string;
    logo?: string;
  };
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  targeting: {
    categories: string[];
    regions: string[];
  };
}

interface ProfileBannerAdProps {
  hostId: string;
  onImpression?: (adId: string) => void;
  onClick?: (adId: string) => void;
  className?: string;
}

export default function ProfileBannerAd({ 
  hostId, 
  onImpression, 
  onClick,
  className = '' 
}: ProfileBannerAdProps) {
  const [ad, setAd] = useState<BannerAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [clicked, setClicked] = useState(false);
  const [impressionTracked, setImpressionTracked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchBannerAd();
  }, [hostId]);

  const fetchBannerAd = async () => {
    try {
      const res = await fetch(`/api/ads/banner?hostId=${hostId}`);
      if (!res.ok) throw new Error('Failed to fetch banner ad');
      
      const data = await res.json();
      setAd(data.ad);
      
      // Track impression
      trackImpression();
    } catch (error) {
      console.error('Failed to fetch banner ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackImpression = async () => {
    if (impressionTracked || !ad) return;
    
    try {
      await fetch(`/api/tracking/impression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: ad.campaignId,
          placementId: `banner-${hostId}`,
          placementType: 'banner',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer
        })
      });
      setImpressionTracked(true);
      onImpression?.(ad.id);
    } catch (error) {
      console.error('Failed to track impression:', error);
    }
  };

  const handleClick = async () => {
    if (clicked || !ad) return;
    
    setClicked(true);
    
    try {
      // Track click
      await fetch(`/api/tracking/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: ad.campaignId,
          placementId: `banner-${hostId}`,
          placementType: 'banner',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer
        })
      });
      
      onClick?.(ad.id);
      
      // Open CTA URL
      if (ad.creative.ctaUrl) {
        window.open(ad.creative.ctaUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (loading) {
    return (
      <div className={`w-full h-32 bg-gray-100 rounded-lg animate-pulse ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400">Loading ad...</div>
        </div>
      </div>
    );
  }

  if (!ad || dismissed) {
    return null;
  }

  return (
    <div className={`relative w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 z-10 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
      >
        <X className="w-3 h-3 text-gray-500" />
      </button>

      {/* Ad Content */}
      <div className="flex h-32">
        {/* Creative Image */}
        {ad.creative.imageUrl && (
          <div className="w-32 h-32 flex-shrink-0">
            <img 
              src={ad.creative.imageUrl} 
              alt={ad.campaignName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Ad Text Content */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            {/* Advertiser Info */}
            <div className="flex items-center gap-2 mb-2">
              {ad.advertiser.logo && (
                <img 
                  src={ad.advertiser.logo} 
                  alt={ad.advertiser.name}
                  className="w-4 h-4 rounded-full"
                />
              )}
              <span className="text-xs text-gray-500">{ad.advertiser.name}</span>
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Sponsored
              </Badge>
            </div>

            {/* Campaign Text */}
            <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
              {ad.creative.text || ad.campaignName}
            </h3>
          </div>

          {/* CTA Button */}
          <Button 
            onClick={handleClick}
            disabled={clicked}
            size="sm"
            className={`w-fit h-8 text-xs font-medium transition-all ${
              clicked 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {clicked ? (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Opening...
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {ad.creative.ctaText}
                <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Performance Metrics (for advertiser) */}
      <div className="px-4 py-2 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{ad.metrics.impressions.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <MousePointerClick className="w-3 h-3" />
              <span>{ad.metrics.clicks.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-gray-600">
            {ad.metrics.ctr.toFixed(2)}% CTR
          </div>
        </div>
      </div>
    </div>
  );
}


