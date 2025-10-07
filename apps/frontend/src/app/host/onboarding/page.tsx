'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  User,
  Wallet,
  SelectiveTool,
  CheckCircle,
  ArrowRight,
  MediaImage,
  Text,
  Frame,
  DollarCircle,
  GraphUp,
  Shield,
  Rocket,
  Gift,
  InfoCircle
} from 'iconoir-react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { injected } from 'wagmi/connectors';

interface OnboardingForm {
  fid?: number;
  username: string;
  displayName: string;
  walletAddress: string;
  bio?: string;
  avatarUrl?: string;
  followerCount: number;
  selectedSlots: string[];
  referralCode?: string;
}

export default function HostOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [farcasterProfile, setFarcasterProfile] = useState<any>(null);
  
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: injected(),
  });
  const { disconnect } = useDisconnect();

  const [form, setForm] = useState<OnboardingForm>({
    username: '',
    displayName: '',
    walletAddress: '',
    bio: '',
    followerCount: 0,
    selectedSlots: [],
    referralCode: ''
  });

  useEffect(() => {
    if (address) {
      setForm(prev => ({ ...prev, walletAddress: address }));
    }
  }, [address]);

  // Get referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setForm(prev => ({ ...prev, referralCode: ref }));
    }
  }, []);

  const connectFarcaster = async () => {
    try {
      // Mock Farcaster connection - replace with actual Farcaster auth
      const mockProfile = {
        fid: 12345,
        username: 'alice',
        displayName: 'Alice',
        bio: 'Web3 enthusiast',
        avatarUrl: 'https://i.pravatar.cc/150',
        followerCount: 5420
      };
      
      setFarcasterProfile(mockProfile);
      setForm({
        ...form,
        ...mockProfile
      });
      
      toast({
        title: 'Connected!',
        description: 'Your Farcaster profile has been connected.',
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to Farcaster.',
        variant: 'destructive'
      });
    }
  };

  const handleSlotToggle = (slot: string) => {
    setForm(prev => ({
      ...prev,
      selectedSlots: prev.selectedSlots.includes(slot)
        ? prev.selectedSlots.filter(s => s !== slot)
        : [...prev.selectedSlots, slot]
    }));
  };

  const calculateEstimatedEarnings = () => {
    const slotsCount = form.selectedSlots.length;
    const followerMultiplier = Math.log10(Math.max(10, form.followerCount));
    const baseEarning = 10; // $10 base per slot per day
    return (slotsCount * baseEarning * followerMultiplier).toFixed(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/host/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error('Onboarding failed');
      
      const data = await res.json();
      
      toast({
        title: 'Welcome aboard! 🎉',
        description: 'You can now start earning from ads on your profile.',
      });
      
      // Store auth token
      localStorage.setItem('hostId', data.host.id);
      localStorage.setItem('walletAddress', data.host.walletAddress);
      
      router.push('/host/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete onboarding',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return <StepFarcaster 
          profile={farcasterProfile} 
          onConnect={connectFarcaster} 
        />;
      case 2:
        return <StepWallet 
          isConnected={isConnected}
          address={address}
          onConnect={connect}
          onDisconnect={disconnect}
        />;
      case 3:
        return <StepSlots 
          selectedSlots={form.selectedSlots}
          onToggle={handleSlotToggle}
        />;
      case 4:
        return <StepReview 
          form={form}
          estimatedEarnings={calculateEstimatedEarnings()}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="container max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Monetize Your Farcaster Profile
          </h1>
          <p className="text-gray-600 mt-4">
            Start earning USDC every hour by displaying ads on your profile
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center p-4">
            <DollarCircle className="w-8 h-8 mx-auto text-green-500" />
            <p className="mt-2 text-sm font-medium">Hourly Payouts</p>
            <p className="text-xs text-gray-500">Get paid automatically</p>
          </Card>
          <Card className="text-center p-4">
            <Shield className="w-8 h-8 mx-auto text-blue-500" />
            <p className="mt-2 text-sm font-medium">Full Control</p>
            <p className="text-xs text-gray-500">Choose your ad slots</p>
          </Card>
          <Card className="text-center p-4">
            <GraphUp className="w-8 h-8 mx-auto text-purple-500" />
            <p className="mt-2 text-sm font-medium">Analytics</p>
            <p className="text-xs text-gray-500">Track performance</p>
          </Card>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {['Profile', 'Wallet', 'Ad Slots', 'Review'].map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center font-bold
                ${step > i + 1 ? 'bg-green-500 text-white' : 
                  step === i + 1 ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 
                  'bg-gray-200 text-gray-500'}
              `}>
                {step > i + 1 ? <CheckCircle className="w-6 h-6" /> : i + 1}
              </div>
              {i < 3 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step > i + 1 ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Card */}
        <Card className="shadow-xl">
          <CardContent className="p-8">
            {renderStep()}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
              >
                Previous
              </Button>
              
              {step < 4 ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !farcasterProfile) ||
                    (step === 2 && !isConnected) ||
                    (step === 3 && form.selectedSlots.length === 0)
                  }
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  <Rocket className="w-4 h-4" />
                  {loading ? 'Setting up...' : 'Start Earning'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Referral Notice */}
        {form.referralCode && (
          <div className="mt-6 text-center">
            <Badge variant="secondary" className="text-sm">
              <Gift className="w-4 h-4 mr-1" />
              Referred by: {form.referralCode}
            </Badge>
            <p className="text-xs text-gray-500 mt-2">You'll both receive bonus earnings!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Step 1: Connect Farcaster
function StepFarcaster({ profile, onConnect }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-16 h-16 mx-auto text-purple-500" />
        <h2 className="text-2xl font-bold mt-4">Connect Your Farcaster Profile</h2>
        <p className="text-gray-600 mt-2">
          We'll use your profile information to set up your ad hosting account
        </p>
      </div>

      {profile ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <img 
                src={profile.avatarUrl} 
                alt={profile.displayName}
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg">{profile.displayName}</h3>
                <p className="text-gray-500">@{profile.username}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <Badge variant="secondary">
                    FID: {profile.fid}
                  </Badge>
                  <span className="text-gray-600">
                    {profile.followerCount.toLocaleString()} followers
                  </span>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center">
          <Button 
            size="lg" 
            onClick={onConnect}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Connect with Farcaster
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            You'll be redirected to authorize the connection
          </p>
        </div>
      )}
    </div>
  );
}

// Step 2: Connect Wallet
function StepWallet({ isConnected, address, onConnect, onDisconnect }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Wallet className="w-16 h-16 mx-auto text-blue-500" />
        <h2 className="text-2xl font-bold mt-4">Connect Your Wallet</h2>
        <p className="text-gray-600 mt-2">
          This is where you'll receive your hourly USDC payments
        </p>
      </div>

      {isConnected ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Connected Wallet</p>
                <p className="font-mono text-sm mt-1">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onDisconnect}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center">
          <Button 
            size="lg" 
            onClick={onConnect}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Connect Wallet
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            We support MetaMask, WalletConnect, and Coinbase Wallet
          </p>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <InfoCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">About Payouts</p>
            <p className="text-gray-600 mt-1">
              You'll receive USDC payments automatically every hour based on your ad performance. 
              No need to claim manually - funds are sent directly to your wallet!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Select Ad Slots
function StepSlots({ selectedSlots, onToggle }: any) {
  const slots = [
    {
      id: 'banner',
      name: 'Profile Banner',
      icon: MediaImage,
      description: 'Display ads at the top of your profile',
      earnings: '$5-15/day',
      color: 'bg-blue-500'
    },
    {
      id: 'pinned_cast',
      name: 'Pinned Cast',
      icon: Text,
      description: 'Pin sponsored content as your top cast',
      earnings: '$10-25/day',
      color: 'bg-purple-500'
    },
    {
      id: 'frame',
      name: 'Frame',
      icon: Frame,
      description: 'Interactive ad frames in your casts',
      earnings: '$8-20/day',
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <SelectiveTool className="w-16 h-16 mx-auto text-green-500" />
        <h2 className="text-2xl font-bold mt-4">Choose Your Ad Slots</h2>
        <p className="text-gray-600 mt-2">
          Select which parts of your profile can display ads
        </p>
      </div>

      <div className="space-y-4">
        {slots.map((slot) => {
          const Icon = slot.icon;
          const isSelected = selectedSlots.includes(slot.id);
          
          return (
            <Card 
              key={slot.id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onToggle(slot.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${slot.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold">{slot.name}</h3>
                      <p className="text-sm text-gray-600">{slot.description}</p>
                      <Badge variant="secondary" className="mt-2">
                        Est. {slot.earnings}
                      </Badge>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 ${
                    isSelected 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-500">
        You can change these settings anytime from your dashboard
      </div>
    </div>
  );
}

// Step 4: Review
function StepReview({ form, estimatedEarnings }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
        <h2 className="text-2xl font-bold mt-4">Ready to Start Earning!</h2>
        <p className="text-gray-600 mt-2">
          Review your settings and start monetizing your profile
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b">
            <span className="text-gray-600">Profile</span>
            <div className="text-right">
              <p className="font-medium">@{form.username}</p>
              <p className="text-sm text-gray-500">
                {form.followerCount.toLocaleString()} followers
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pb-4 border-b">
            <span className="text-gray-600">Wallet</span>
            <p className="font-mono text-sm">
              {form.walletAddress?.slice(0, 6)}...{form.walletAddress?.slice(-4)}
            </p>
          </div>

          <div className="flex justify-between items-center pb-4 border-b">
            <span className="text-gray-600">Ad Slots</span>
            <div className="flex gap-2">
              {form.selectedSlots.map((slot: string) => (
                <Badge key={slot} variant="secondary">
                  {slot.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Estimated Daily Earnings</span>
            <p className="text-2xl font-bold text-green-600">
              ${estimatedEarnings}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-green-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <DollarCircle className="w-5 h-5 text-green-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">How Payouts Work</p>
            <ul className="text-gray-600 mt-2 space-y-1">
              <li>• Ads are automatically displayed on your selected slots</li>
              <li>• Earnings accumulate throughout the day</li>
              <li>• USDC payments sent to your wallet every hour</li>
              <li>• Track performance in your dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
