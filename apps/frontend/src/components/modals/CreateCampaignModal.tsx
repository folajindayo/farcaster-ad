'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { 
  Upload,
  CheckCircle,
  MediaImage,
  Rocket,
  X
} from 'iconoir-react';

interface CampaignForm {
  name: string;
  description: string;
  budget: string;
  type: 'banner' | 'pinned_cast' | 'frame';
  pricingModel: 'CPM' | 'CPC';
  cpm: string;
  creative: {
    imageUrl?: string;
    text?: string;
    ctaText?: string;
    ctaUrl?: string;
  };
  targeting: {
    minFollowers?: number;
    maxFollowers?: number;
    categories?: string[];
    regions?: string[];
  };
  schedule: {
    startDate: string;
    endDate: string;
  };
}

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCampaignModal({ isOpen, onClose, onSuccess }: CreateCampaignModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [form, setForm] = useState<CampaignForm>({
    name: '',
    description: '',
    budget: '',
    type: 'banner',
    pricingModel: 'CPM',
    cpm: '5.00',
    creative: {
      text: '',
      ctaText: 'Learn More',
      ctaUrl: ''
    },
    targeting: {
      minFollowers: 1000,
      maxFollowers: 100000,
      categories: [],
      regions: []
    },
    schedule: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setForm((prev) => ({
          ...prev,
          creative: { ...prev.creative, imageUrl: e.target?.result as string },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imagePreview) return '';
    
    // TODO: Implement actual image upload
    return imagePreview;
  };

  const calculateEstimatedReach = () => {
    const budget = parseFloat(form.budget) || 0;
    const cpm = parseFloat(form.cpm) || 5;
    return Math.floor((budget / cpm) * 1000);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Upload image first
      const imageUrl = await uploadImage();
      
      // Prepare campaign data
      const campaignData = {
        ...form,
        creative: {
          ...form.creative,
          imageUrl
        },
        advertiserId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null // Get from auth
      };

      // Create campaign
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });

      if (!res.ok) throw new Error('Failed to create campaign');
      
      const { data } = await res.json();
      
      // Fund campaign with USDC
      await fundCampaign(data.campaign.id, form.budget);
      
      toast({
        title: 'Campaign Created!',
        description: 'Your campaign is now pending approval.',
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fundCampaign = async (campaignId: string, amount: string) => {
    // TODO: Integrate with smart contract
    console.log('Funding campaign:', campaignId, amount);
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return <StepBasicInfo form={form} setForm={setForm} />;
      case 2:
        return <StepCreative 
          form={form} 
          setForm={setForm}
          imagePreview={imagePreview}
          setImagePreview={setImagePreview}
          handleImageUpload={handleImageUpload}
        />;
      case 3:
        return <StepTargeting form={form} setForm={setForm} />;
      case 4:
        return <StepBudget form={form} setForm={setForm} />;
      case 5:
        return <StepReview form={form} estimatedReach={calculateEstimatedReach()} />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Create Campaign</h2>
              <p className="text-gray-600">Set up your advertising campaign</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[
              { label: 'Basic Info', step: 1 },
              { label: 'Creative', step: 2 },
              { label: 'Targeting', step: 3 },
              { label: 'Budget', step: 4 },
              { label: 'Review', step: 5 }
            ].map(({ label, step: stepNum }, i) => (
              <div key={stepNum} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= stepNum 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNum ? <CheckCircle className="w-4 h-4" /> : stepNum}
                </div>
                <span className={`ml-2 text-sm ${
                  step >= stepNum ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {i < 4 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <Card>
            <CardContent className="p-6">
              {renderStep()}
              
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep(Math.max(1, step - 1))}
                  disabled={step === 1}
                >
                  Previous
                </Button>
                
                {step < 5 ? (
                  <Button onClick={() => setStep(step + 1)}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Rocket className="w-4 h-4" />
                    {loading ? 'Creating...' : 'Launch Campaign'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Step 1: Basic Information
function StepBasicInfo({ form, setForm }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Campaign Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter campaign name"
            />
          </div>
          <div>
            <Label htmlFor="type">Campaign Type</Label>
            <Select value={form.type} onValueChange={(value: any) => setForm({ ...form, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="banner">Profile Banner</SelectItem>
                <SelectItem value="pinned_cast">Pinned Cast</SelectItem>
                <SelectItem value="frame">Frame</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe your campaign"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

// Step 2: Creative
function StepCreative({ form, setForm, imagePreview, setImagePreview, handleImageUpload }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Creative Assets</h3>
        
        {/* Image Upload */}
        <div className="mb-6">
          <Label>Campaign Image</Label>
          <div className="mt-2">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImagePreview(null);
                    setForm({ ...form, creative: { ...form.creative, imageUrl: '' } });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <MediaImage className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Upload your campaign image</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Image
                    </span>
                  </Button>
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Text Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="text">Ad Text</Label>
            <Textarea
              id="text"
              value={form.creative.text}
              onChange={(e) => setForm({ 
                ...form, 
                creative: { ...form.creative, text: e.target.value }
              })}
              placeholder="Enter your ad message"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="ctaText">Call-to-Action Text</Label>
            <Input
              id="ctaText"
              value={form.creative.ctaText}
              onChange={(e) => setForm({ 
                ...form, 
                creative: { ...form.creative, ctaText: e.target.value }
              })}
              placeholder="Learn More"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <Label htmlFor="ctaUrl">Call-to-Action URL</Label>
          <Input
            id="ctaUrl"
            value={form.creative.ctaUrl}
            onChange={(e) => setForm({ 
              ...form, 
              creative: { ...form.creative, ctaUrl: e.target.value }
            })}
            placeholder="https://example.com"
          />
        </div>
      </div>
    </div>
  );
}

// Step 3: Targeting
function StepTargeting({ form, setForm }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Audience Targeting</h3>
        
        <div className="space-y-4">
          <div>
            <Label>Follower Range</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Min: {form.targeting.minFollowers?.toLocaleString()}</span>
                <span className="text-sm text-gray-600">Max: {form.targeting.maxFollowers?.toLocaleString()}</span>
              </div>
              <Slider
                value={[form.targeting.minFollowers || 1000, form.targeting.maxFollowers || 100000]}
                onValueChange={([min, max]) => setForm({
                  ...form,
                  targeting: { ...form.targeting, minFollowers: min, maxFollowers: max }
                })}
                min={100}
                max={1000000}
                step={1000}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 4: Budget
function StepBudget({ form, setForm }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Budget & Pricing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget">Total Budget (USDC)</Label>
            <Input
              id="budget"
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="1000"
            />
          </div>
          <div>
            <Label htmlFor="pricingModel">Pricing Model</Label>
            <Select value={form.pricingModel} onValueChange={(value: any) => setForm({ ...form, pricingModel: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPM">CPM (Cost Per Mille)</SelectItem>
                <SelectItem value="CPC">CPC (Cost Per Click)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-4">
          <Label htmlFor="cpm">CPM Rate (USDC)</Label>
          <Input
            id="cpm"
            type="number"
            step="0.01"
            value={form.cpm}
            onChange={(e) => setForm({ ...form, cpm: e.target.value })}
            placeholder="5.00"
          />
        </div>
      </div>
    </div>
  );
}

// Step 5: Review
function StepReview({ form, estimatedReach }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Campaign Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Campaign Details</h4>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p><strong>Name:</strong> {form.name}</p>
                <p><strong>Type:</strong> {form.type}</p>
                <p><strong>Description:</strong> {form.description}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Creative</h4>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p><strong>Text:</strong> {form.creative.text}</p>
                <p><strong>CTA:</strong> {form.creative.ctaText}</p>
                <p><strong>URL:</strong> {form.creative.ctaUrl}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Targeting</h4>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p><strong>Followers:</strong> {form.targeting.minFollowers?.toLocaleString()} - {form.targeting.maxFollowers?.toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Budget</h4>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p><strong>Total Budget:</strong> ${form.budget} USDC</p>
                <p><strong>Pricing:</strong> {form.pricingModel} @ ${form.cpm}</p>
                <p><strong>Estimated Reach:</strong> {estimatedReach.toLocaleString()} impressions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
