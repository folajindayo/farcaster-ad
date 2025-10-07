'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink,
  CursorPointer,
  Eye,
  GraphUp,
  Shield,
  CheckCircle,
  ArrowRight,
  Star,
  Heart,
  Send
} from 'iconoir-react';

interface FrameAd {
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

interface FrameProps {
  params: {
    campaignId: string;
  };
}

export default function FrameAdPage({ params }: FrameProps) {
  const [ad, setAd] = useState<FrameAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [clicked, setClicked] = useState(false);
  const [impressionTracked, setImpressionTracked] = useState(false);

  useEffect(() => {
    fetchAd();
  }, [params.campaignId]);

  const fetchAd = async () => {
    try {
      const res = await fetch(`/api/frame/${params.campaignId}`);
      if (!res.ok) throw new Error('Failed to fetch ad');
      
      const data = await res.json();
      setAd(data.ad);
      
      // Track impression
      trackImpression();
    } catch (error) {
      console.error('Failed to fetch ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackImpression = async () => {
    if (impressionTracked) return;
    
    try {
      await fetch(`/api/tracking/impression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: params.campaignId,
          frameId: 'farcaster-frame',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer
        })
      });
      setImpressionTracked(true);
    } catch (error) {
      console.error('Failed to track impression:', error);
    }
  };

  const handleClick = async () => {
    if (clicked) return;
    
    setClicked(true);
    
    try {
      // Track click
      await fetch(`/api/tracking/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: params.campaignId,
          frameId: 'farcaster-frame',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer
        })
      });
      
      // Open CTA URL
      if (ad?.creative.ctaUrl) {
        window.open(ad.creative.ctaUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  };

  const handleInteraction = (type: 'like' | 'share' | 'bookmark') => {
    // Track additional interactions
    fetch(`/api/tracking/interaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: params.campaignId,
        frameId: 'farcaster-frame',
        interactionType: type,
        timestamp: new Date().toISOString()
      })
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ad...</p>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-400" />
          <h2 className="text-xl font-semibold mt-4">Ad Not Found</h2>
          <p className="text-gray-600 mt-2">This ad is no longer available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-0">
        <CardContent className="p-0">
          {/* Ad Creative */}
          {ad.creative.imageUrl && (
            <div className="relative">
              <img 
                src={ad.creative.imageUrl} 
                alt={ad.campaignName}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="absolute top-4 right-4">
                <Badge className="bg-white/90 text-gray-800">
                  <GraphUp className="w-3 h-3 mr-1" />
                  Sponsored
                </Badge>
              </div>
            </div>
          )}

          {/* Ad Content */}
          <div className="p-6">
            {/* Advertiser Info */}
            <div className="flex items-center gap-3 mb-4">
              {ad.advertiser.logo && (
                <img 
                  src={ad.advertiser.logo} 
                  alt={ad.advertiser.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-sm">{ad.advertiser.name}</p>
                <p className="text-xs text-gray-500">Sponsored</p>
              </div>
            </div>

            {/* Campaign Text */}
            {ad.creative.text && (
              <p className="text-gray-800 mb-4 leading-relaxed">
                {ad.creative.text}
              </p>
            )}

            {/* CTA Button */}
            <Button 
              onClick={handleClick}
              disabled={clicked}
              className={`w-full h-12 text-lg font-semibold transition-all ${
                clicked 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
              }`}
            >
              {clicked ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Opening...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {ad.creative.ctaText}
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>

            {/* Interaction Buttons */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleInteraction('like')}
                  className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">Like</span>
                </button>
                
                <button 
                  onClick={() => handleInteraction('share')}
                  className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-sm">Share</span>
                </button>
              </div>

              <div className="flex items-center gap-1 text-gray-500">
                <Star className="w-4 h-4" />
                <span className="text-sm">Save</span>
              </div>
            </div>

            {/* Performance Metrics (for advertiser) */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span>{ad.metrics.impressions.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CursorPointer className="w-4 h-4 text-green-500" />
                    <span>{ad.metrics.clicks.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-gray-600">
                  {ad.metrics.ctr.toFixed(2)}% CTR
                </div>
              </div>
            </div>

            {/* Targeting Info */}
            {ad.targeting.categories.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {ad.targeting.categories.slice(0, 3).map((category, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                  {ad.targeting.categories.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{ad.targeting.categories.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-xs text-gray-500">
                Powered by Farcaster Ad Network
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
