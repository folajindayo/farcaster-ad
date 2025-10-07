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
  X,
  Pin,
  Reply,
  Recast
} from 'iconoir-react';

interface PinnedCastAd {
  id: string;
  campaignId: string;
  campaignName: string;
  creative: {
    imageUrl?: string;
    text: string;
    ctaText: string;
    ctaUrl: string;
  };
  advertiser: {
    name: string;
    logo?: string;
    handle: string;
  };
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    likes: number;
    recasts: number;
    replies: number;
  };
  targeting: {
    categories: string[];
    regions: string[];
  };
  timestamp: string;
}

interface PinnedCastAdProps {
  hostId: string;
  onImpression?: (adId: string) => void;
  onClick?: (adId: string) => void;
  onInteraction?: (adId: string, type: 'like' | 'recast' | 'reply') => void;
  className?: string;
}

export default function PinnedCastAd({ 
  hostId, 
  onImpression, 
  onClick,
  onInteraction,
  className = '' 
}: PinnedCastAdProps) {
  const [ad, setAd] = useState<PinnedCastAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [clicked, setClicked] = useState(false);
  const [impressionTracked, setImpressionTracked] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [interactions, setInteractions] = useState({
    liked: false,
    recasted: false,
    replied: false
  });

  useEffect(() => {
    fetchPinnedCastAd();
  }, [hostId]);

  const fetchPinnedCastAd = async () => {
    try {
      const res = await fetch(`/api/ads/pinned-cast?hostId=${hostId}`);
      if (!res.ok) throw new Error('Failed to fetch pinned cast ad');
      
      const data = await res.json();
      setAd(data.ad);
      
      // Track impression
      trackImpression();
    } catch (error) {
      console.error('Failed to fetch pinned cast ad:', error);
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
          placementId: `pinned-cast-${hostId}`,
          placementType: 'pinned_cast',
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
          placementId: `pinned-cast-${hostId}`,
          placementType: 'pinned_cast',
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

  const handleInteraction = async (type: 'like' | 'recast' | 'reply') => {
    if (!ad) return;
    
    try {
      await fetch(`/api/tracking/interaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: ad.campaignId,
          placementId: `pinned-cast-${hostId}`,
          placementType: 'pinned_cast',
          interactionType: type,
          timestamp: new Date().toISOString()
        })
      });
      
      setInteractions(prev => ({ ...prev, [type]: true }));
      onInteraction?.(ad.id, type);
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (loading) {
    return (
      <div className={`w-full bg-white border border-gray-200 rounded-lg p-4 animate-pulse ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/6"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!ad || dismissed) {
    return null;
  }

  return (
    <div className={`relative w-full bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Pinned Badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge className="bg-blue-100 text-blue-800 text-xs">
          <Pin className="w-3 h-3 mr-1" />
          Pinned
        </Badge>
      </div>

      {/* Cast Header */}
      <div className="flex items-center gap-3 mb-4">
        {ad.advertiser.logo && (
          <img 
            src={ad.advertiser.logo} 
            alt={ad.advertiser.name}
            className="w-10 h-10 rounded-full"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{ad.advertiser.name}</span>
            <span className="text-gray-500 text-sm">@{ad.advertiser.handle}</span>
            <Badge className="bg-green-100 text-green-800 text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Sponsored
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            {new Date(ad.timestamp).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Cast Content */}
      <div className="mb-4">
        <p className="text-gray-900 leading-relaxed mb-3">
          {ad.creative.text}
        </p>

        {/* Creative Image */}
        {ad.creative.imageUrl && (
          <div className="mb-3">
            <img 
              src={ad.creative.imageUrl} 
              alt={ad.campaignName}
              className="w-full max-w-md rounded-lg"
            />
          </div>
        )}

        {/* CTA Button */}
        <Button 
          onClick={handleClick}
          disabled={clicked}
          className={`w-fit mb-3 ${
            clicked 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {clicked ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Opening...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {ad.creative.ctaText}
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </Button>
      </div>

      {/* Interaction Buttons */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => handleInteraction('like')}
            className={`flex items-center gap-2 text-sm transition-colors ${
              interactions.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${interactions.liked ? 'fill-current' : ''}`} />
            <span>{ad.metrics.likes + (interactions.liked ? 1 : 0)}</span>
          </button>
          
          <button 
            onClick={() => handleInteraction('recast')}
            className={`flex items-center gap-2 text-sm transition-colors ${
              interactions.recasted ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
            }`}
          >
            <Recast className={`w-4 h-4 ${interactions.recasted ? 'fill-current' : ''}`} />
            <span>{ad.metrics.recasts + (interactions.recasted ? 1 : 0)}</span>
          </button>
          
          <button 
            onClick={() => handleInteraction('reply')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors"
          >
            <Reply className="w-4 h-4" />
            <span>{ad.metrics.replies}</span>
          </button>
        </div>

        <button className="text-gray-500 hover:text-blue-500 transition-colors">
          <Share className="w-4 h-4" />
        </button>
      </div>

      {/* Performance Metrics (for advertiser) */}
      <div className="mt-3 pt-3 border-t bg-gray-50 -mx-4 -mb-4 px-4 py-2 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
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


