'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  User,
  CheckCircle,
  ArrowRight,
  MediaImage,
  Text,
  DollarCircle,
  InfoCircle,
  Rocket
} from 'iconoir-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface HostPreferences {
  adTypes: string[];
  categories: string[];
  minimumCPM: number;
  autoAcceptCampaigns: boolean;
}

export default function HostOnboardingPage() {
  return (
    <ProtectedRoute>
      <HostOnboardingContent />
    </ProtectedRoute>
  );
}

function HostOnboardingContent() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  const [preferences, setPreferences] = useState<HostPreferences>({
    adTypes: ['banner', 'pinned_cast'],
    categories: [],
    minimumCPM: 0,
    autoAcceptCampaigns: true
  });

  const [customCategory, setCustomCategory] = useState('');

  // Load user data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserData(user);
      }
    }
  }, []);

  const toggleAdType = (type: string) => {
    setPreferences(prev => ({
      ...prev,
      adTypes: prev.adTypes.includes(type)
        ? prev.adTypes.filter(t => t !== type)
        : [...prev.adTypes, type]
    }));
  };

  const addCategory = () => {
    if (customCategory && !preferences.categories.includes(customCategory)) {
      setPreferences(prev => ({
        ...prev,
        categories: [...prev.categories, customCategory]
      }));
      setCustomCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setPreferences(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      const res = await fetch(`${backendUrl}/api/hosts/onboard`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          farcasterId: userData.farcasterId,
          username: userData.username,
          displayName: userData.displayName,
          followerCount: userData.followerCount || 0,
          preferences
        })
      });

      if (!res.ok) throw new Error('Onboarding failed');
      
      const data = await res.json();
      
      console.log('✅ Host onboarded:', data);
      
      // Update user role to host
      const updatedUser = { ...userData, role: 'host', isHost: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      router.push('/host/dashboard');
    } catch (error) {
      console.error('❌ Onboarding error:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return <StepProfile userData={userData} />;
      case 2:
        return <StepPreferences 
          preferences={preferences}
          onToggleAdType={toggleAdType}
          onAddCategory={addCategory}
          onRemoveCategory={removeCategory}
          customCategory={customCategory}
          setCustomCategory={setCustomCategory}
          setPreferences={setPreferences}
        />;
      case 3:
        return <StepReview 
          userData={userData}
          preferences={preferences}
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
            Become a Host
          </h1>
          <p className="text-gray-600 mt-4">
            Start earning USDC automatically by hosting ads on your Farcaster profile
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center p-4">
            <DollarCircle className="w-8 h-8 mx-auto text-green-500" />
            <p className="mt-2 text-sm font-medium">Auto Payouts</p>
            <p className="text-xs text-gray-500">Hourly via Merkle</p>
          </Card>
          <Card className="text-center p-4">
            <MediaImage className="w-8 h-8 mx-auto text-blue-500" />
            <p className="mt-2 text-sm font-medium">Auto-Matching</p>
            <p className="text-xs text-gray-500">No manual work</p>
          </Card>
          <Card className="text-center p-4">
            <Rocket className="w-8 h-8 mx-auto text-purple-500" />
            <p className="mt-2 text-sm font-medium">Full Control</p>
            <p className="text-xs text-gray-500">Set your rules</p>
          </Card>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {['Profile', 'Preferences', 'Review'].map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center font-bold
                ${step > i + 1 ? 'bg-green-500 text-white' : 
                  step === i + 1 ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 
                  'bg-gray-200 text-gray-500'}
              `}>
                {step > i + 1 ? <CheckCircle className="w-6 h-6" /> : i + 1}
              </div>
              {i < 2 && (
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
              
              {step < 3 ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  disabled={step === 2 && preferences.adTypes.length === 0}
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
      </div>
    </div>
  );
}

// Step 1: Confirm Profile
function StepProfile({ userData }: any) {
  if (!userData) {
    return <div className="text-center">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-16 h-16 mx-auto text-purple-500" />
        <h2 className="text-2xl font-bold mt-4">Confirm Your Profile</h2>
        <p className="text-gray-600 mt-2">
          We'll use your Farcaster profile information
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {userData.pfpUrl && (
              <img 
                src={userData.pfpUrl} 
                alt={userData.displayName}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div className="flex-1">
              <h3 className="font-bold text-lg">{userData.displayName}</h3>
              <p className="text-gray-500">@{userData.username}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <Badge variant="secondary">
                  FID: {userData.farcasterId}
                </Badge>
                {userData.followerCount && (
                  <span className="text-gray-600">
                    {userData.followerCount.toLocaleString()} followers
                  </span>
                )}
              </div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <InfoCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">How Auto-Assignment Works</p>
            <p className="text-gray-600 mt-1">
              When advertisers fund campaigns, our algorithm automatically matches you with compatible 
              campaigns based on your preferences. Ads go live instantly on your profile!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Set Preferences
function StepPreferences({ preferences, onToggleAdType, onAddCategory, onRemoveCategory, customCategory, setCustomCategory, setPreferences }: any) {
  const adTypeOptions = [
    {
      id: 'banner',
      name: 'Profile Banner',
      icon: MediaImage,
      description: 'Display banner ads at the top of your profile',
      color: 'bg-blue-500'
    },
    {
      id: 'pinned_cast',
      name: 'Pinned Cast',
      icon: Text,
      description: 'Pin sponsored content as your top cast',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <MediaImage className="w-16 h-16 mx-auto text-green-500" />
        <h2 className="text-2xl font-bold mt-4">Set Your Preferences</h2>
        <p className="text-gray-600 mt-2">
          Control which ads can be displayed on your profile
        </p>
      </div>

      {/* Ad Types */}
      <div>
        <Label className="text-base font-semibold">Ad Types You'll Show</Label>
        <p className="text-sm text-gray-500 mb-4">Select at least one</p>
        <div className="space-y-3">
          {adTypeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = preferences.adTypes.includes(option.id);
            
            return (
              <Card 
                key={option.id}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => onToggleAdType(option.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${option.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">{option.name}</h3>
                        <p className="text-xs text-gray-600">{option.description}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      <div>
        <Label className="text-base font-semibold">Categories/Niches (Optional)</Label>
        <p className="text-sm text-gray-500 mb-4">Leave empty to accept all categories</p>
        <div className="flex gap-2 mb-2">
          <Input
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="e.g., tech, crypto, defi"
            onKeyPress={(e) => e.key === 'Enter' && onAddCategory()}
          />
          <Button onClick={onAddCategory} variant="outline">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {preferences.categories.map((cat: string) => (
            <Badge key={cat} variant="secondary" className="cursor-pointer" onClick={() => onRemoveCategory(cat)}>
              {cat} ×
            </Badge>
          ))}
        </div>
      </div>

      {/* Minimum CPM */}
      <div>
        <Label className="text-base font-semibold">Minimum CPM Rate (USDC)</Label>
        <p className="text-sm text-gray-500 mb-4">Set to 0 to accept all rates</p>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={preferences.minimumCPM}
          onChange={(e) => setPreferences((prev: any) => ({
            ...prev,
            minimumCPM: parseFloat(e.target.value) || 0
          }))}
          placeholder="0.00"
        />
      </div>

      {/* Auto-Accept */}
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
        <div>
          <Label className="text-base font-semibold">Auto-Accept Campaigns</Label>
          <p className="text-sm text-gray-600">Automatically accept matching campaigns (recommended)</p>
        </div>
        <Switch
          checked={preferences.autoAcceptCampaigns}
          onCheckedChange={(checked) => setPreferences((prev: any) => ({
            ...prev,
            autoAcceptCampaigns: checked
          }))}
        />
      </div>
    </div>
  );
}

// Step 3: Review
function StepReview({ userData, preferences }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
        <h2 className="text-2xl font-bold mt-4">Ready to Start!</h2>
        <p className="text-gray-600 mt-2">
          Review your settings and start earning
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b">
            <span className="text-gray-600">Profile</span>
            <div className="text-right">
              <p className="font-medium">@{userData?.username}</p>
              {userData?.followerCount && (
                <p className="text-sm text-gray-500">
                  {userData.followerCount.toLocaleString()} followers
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pb-4 border-b">
            <span className="text-gray-600">Ad Types</span>
            <div className="flex gap-2">
              {preferences.adTypes.map((type: string) => (
                <Badge key={type} variant="secondary">
                  {type.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {preferences.categories.length > 0 && (
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600">Categories</span>
              <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                {preferences.categories.map((cat: string) => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pb-4 border-b">
            <span className="text-gray-600">Minimum CPM</span>
            <p className="font-medium">
              {preferences.minimumCPM > 0 ? `$${preferences.minimumCPM}` : 'Any'}
            </p>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Auto-Accept</span>
            <Badge variant={preferences.autoAcceptCampaigns ? 'default' : 'secondary'}>
              {preferences.autoAcceptCampaigns ? 'ON' : 'OFF'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="bg-green-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <DollarCircle className="w-5 h-5 text-green-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">What Happens Next?</p>
            <ul className="text-gray-600 mt-2 space-y-1">
              <li>✅ Campaigns are auto-assigned based on your preferences</li>
              <li>✅ Ads go live on your profile automatically</li>
              <li>✅ Earn USDC every hour via Merkle payouts</li>
              <li>✅ Track earnings in your dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
