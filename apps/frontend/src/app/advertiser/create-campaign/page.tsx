'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import {
  Plus,
  Upload,
  DollarCircle,
  CheckCircle,
  InfoCircle,
  MediaImage,
  Link as LinkIcon,
  Rocket,
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

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [form, setForm] = useState<CampaignForm>({
    name: '',
    description: '',
    budget: '',
    type: 'banner',
    pricingModel: 'CPM',
    cpm: '5.00',
    creative: {
      ctaText: 'Learn More',
    },
    targeting: {
      minFollowers: 100,
      maxFollowers: 100000,
    },
    schedule: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return '';

    const formData = new FormData();
    formData.append('file', imageFile);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    return data.url;
  };

  const calculateEstimatedReach = () => {
    const budget = parseFloat(form.budget) || 0;
    const cpm = parseFloat(form.cpm) || 5;

    if (form.pricingModel === 'CPM') {
      return Math.floor((budget / cpm) * 1000);
    } else {
      // CPC - estimate based on 0.1% CTR
      return Math.floor((budget / (cpm * 0.001)) * 1000);
    }
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
          imageUrl,
        },
        advertiserId: localStorage.getItem('userId'), // Get from auth
      };

      // Create campaign
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      });

      if (!res.ok) throw new Error('Failed to create campaign');

      const { data } = await res.json();

      // Fund campaign with USDC
      await fundCampaign(data.campaign.id, form.budget);

      toast({
        title: 'Campaign Created!',
        description: 'Your campaign is now pending approval.',
      });

      router.push('/advertiser/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive',
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
    switch (step) {
      case 1:
        return <StepBasicInfo form={form} setForm={setForm} />;
      case 2:
        return (
          <StepCreative
            form={form}
            setForm={setForm}
            imagePreview={imagePreview}
            handleImageUpload={handleImageUpload}
          />
        );
      case 3:
        return <StepTargeting form={form} setForm={setForm} />;
      case 4:
        return <StepBudget form={form} setForm={setForm} />;
      case 5:
        return (
          <StepReview form={form} estimatedReach={calculateEstimatedReach()} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Plus className="w-8 h-8" />
          Create Campaign
        </h1>
        <p className="text-gray-500 mt-2">
          Launch your ad campaign on Farcaster
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {['Basic Info', 'Creative', 'Targeting', 'Budget', 'Review'].map(
          (label, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${
                step > i + 1
                  ? 'bg-green-500 text-white'
                  : step === i + 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
              }
            `}
              >
                {step > i + 1 ? <CheckCircle className="w-5 h-5" /> : i + 1}
              </div>
              {i < 4 && (
                <div
                  className={`w-full h-1 mx-2 ${
                    step > i + 1 ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        )}
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
              <Button onClick={() => setStep(step + 1)}>Next</Button>
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
  );
}

// Step 1: Basic Information
function StepBasicInfo({ form, setForm }: any) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Campaign Name</Label>
        <Input
          id="name"
          placeholder="Summer Sale 2024"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your campaign objectives..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="mt-2"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="type">Ad Placement Type</Label>
        <Select
          value={form.type}
          onValueChange={(v) => setForm({ ...form, type: v })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="banner">Profile Banner</SelectItem>
            <SelectItem value="pinned_cast">Pinned Cast</SelectItem>
            <SelectItem value="frame">Frame</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="schedule">Campaign Duration</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Label className="text-sm text-gray-500">Start Date</Label>
            <Input
              type="date"
              value={form.schedule.startDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  schedule: { ...form.schedule, startDate: e.target.value },
                })
              }
            />
          </div>
          <div>
            <Label className="text-sm text-gray-500">End Date</Label>
            <Input
              type="date"
              value={form.schedule.endDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  schedule: { ...form.schedule, endDate: e.target.value },
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Creative Assets
function StepCreative({ form, setForm, imagePreview, handleImageUpload }: any) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Upload Creative</Label>
        <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 mx-auto rounded"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Change Image
              </Button>
            </div>
          ) : (
            <div>
              <MediaImage className="w-12 h-12 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drop your image here or click to upload
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          )}
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </div>

      {form.type === 'pinned_cast' && (
        <div>
          <Label htmlFor="castText">Cast Text</Label>
          <Textarea
            id="castText"
            placeholder="Write your cast message..."
            value={form.creative.text}
            onChange={(e) =>
              setForm({
                ...form,
                creative: { ...form.creative, text: e.target.value },
              })
            }
            className="mt-2"
            rows={3}
          />
        </div>
      )}

      <div>
        <Label htmlFor="ctaText">Call to Action Text</Label>
        <Input
          id="ctaText"
          placeholder="Learn More"
          value={form.creative.ctaText}
          onChange={(e) =>
            setForm({
              ...form,
              creative: { ...form.creative, ctaText: e.target.value },
            })
          }
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="ctaUrl">Landing Page URL</Label>
        <div className="flex items-center gap-2 mt-2">
          <LinkIcon className="w-4 h-4 text-gray-400" />
          <Input
            id="ctaUrl"
            type="url"
            placeholder="https://example.com"
            value={form.creative.ctaUrl}
            onChange={(e) =>
              setForm({
                ...form,
                creative: { ...form.creative, ctaUrl: e.target.value },
              })
            }
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

// Step 3: Targeting
function StepTargeting({ form, setForm }: any) {
  const categories = [
    'Tech',
    'Crypto',
    'Art',
    'Gaming',
    'Music',
    'Sports',
    'Fashion',
  ];
  const regions = ['North America', 'Europe', 'Asia', 'Global'];

  return (
    <div className="space-y-6">
      <div>
        <Label>Follower Count Range</Label>
        <div className="mt-4 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Min: {form.targeting.minFollowers?.toLocaleString()}</span>
              <span>Max: {form.targeting.maxFollowers?.toLocaleString()}</span>
            </div>
            <Slider
              value={[form.targeting.minFollowers, form.targeting.maxFollowers]}
              onValueChange={([min, max]) =>
                setForm({
                  ...form,
                  targeting: {
                    ...form.targeting,
                    minFollowers: min,
                    maxFollowers: max,
                  },
                })
              }
              min={0}
              max={100000}
              step={100}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <Label>Categories</Label>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={form.targeting.categories?.includes(cat) || false}
                onChange={(e) => {
                  const cats = form.targeting.categories || [];
                  setForm({
                    ...form,
                    targeting: {
                      ...form.targeting,
                      categories: e.target.checked
                        ? [...cats, cat]
                        : cats.filter((c: string) => c !== cat),
                    },
                  });
                }}
                className="rounded"
              />
              <span className="text-sm">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Regions</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {regions.map((region) => (
            <label key={region} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={form.targeting.regions?.includes(region) || false}
                onChange={(e) => {
                  const regs = form.targeting.regions || [];
                  setForm({
                    ...form,
                    targeting: {
                      ...form.targeting,
                      regions: e.target.checked
                        ? [...regs, region]
                        : regs.filter((r: string) => r !== region),
                    },
                  });
                }}
                className="rounded"
              />
              <span className="text-sm">{region}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 4: Budget & Pricing
function StepBudget({ form, setForm }: any) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="budget">Campaign Budget (USDC)</Label>
        <div className="flex items-center gap-2 mt-2">
          <DollarCircle className="w-5 h-5 text-gray-400" />
          <Input
            id="budget"
            type="number"
            placeholder="1000"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label>Pricing Model</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <label
            className={`
            border rounded-lg p-4 cursor-pointer transition-colors
            ${form.pricingModel === 'CPM' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
          `}
          >
            <input
              type="radio"
              value="CPM"
              checked={form.pricingModel === 'CPM'}
              onChange={(e) =>
                setForm({ ...form, pricingModel: e.target.value })
              }
              className="sr-only"
            />
            <div className="font-medium">CPM</div>
            <div className="text-sm text-gray-500">
              Cost per 1000 impressions
            </div>
          </label>

          <label
            className={`
            border rounded-lg p-4 cursor-pointer transition-colors
            ${form.pricingModel === 'CPC' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
          `}
          >
            <input
              type="radio"
              value="CPC"
              checked={form.pricingModel === 'CPC'}
              onChange={(e) =>
                setForm({ ...form, pricingModel: e.target.value })
              }
              className="sr-only"
            />
            <div className="font-medium">CPC</div>
            <div className="text-sm text-gray-500">Cost per click</div>
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="cpm">
          {form.pricingModel === 'CPM' ? 'CPM Rate' : 'CPC Rate'} (USDC)
        </Label>
        <div className="flex items-center gap-2 mt-2">
          <DollarCircle className="w-5 h-5 text-gray-400" />
          <Input
            id="cpm"
            type="number"
            step="0.01"
            placeholder="5.00"
            value={form.cpm}
            onChange={(e) => setForm({ ...form, cpm: e.target.value })}
            className="flex-1"
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {form.pricingModel === 'CPM'
            ? 'Amount you pay per 1000 ad impressions'
            : 'Amount you pay per click on your ad'}
        </p>
      </div>
    </div>
  );
}

// Step 5: Review & Launch
function StepReview({ form, estimatedReach }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <InfoCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-medium">Campaign Summary</h3>
            <p className="text-sm text-gray-600 mt-1">
              Review your campaign details before launching
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Campaign Name</h4>
          <p className="mt-1 font-medium">{form.name}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500">Placement Type</h4>
          <p className="mt-1 font-medium capitalize">
            {form.type.replace('_', ' ')}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500">Total Budget</h4>
          <p className="mt-1 font-medium">${form.budget} USDC</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500">Pricing Model</h4>
          <p className="mt-1 font-medium">
            {form.pricingModel} - ${form.cpm}/
            {form.pricingModel === 'CPM' ? '1000 impressions' : 'click'}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500">Duration</h4>
          <p className="mt-1 font-medium">
            {new Date(form.schedule.startDate).toLocaleDateString()} -
            {new Date(form.schedule.endDate).toLocaleDateString()}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500">Estimated Reach</h4>
          <p className="mt-1 font-medium">
            {estimatedReach.toLocaleString()} impressions
          </p>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-sm font-medium text-gray-500 mb-3">Targeting</h4>
        <div className="space-y-2 text-sm">
          <div>
            Followers: {form.targeting.minFollowers?.toLocaleString()} -{' '}
            {form.targeting.maxFollowers?.toLocaleString()}
          </div>
          {form.targeting.categories?.length > 0 && (
            <div>Categories: {form.targeting.categories.join(', ')}</div>
          )}
          {form.targeting.regions?.length > 0 && (
            <div>Regions: {form.targeting.regions.join(', ')}</div>
          )}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-medium">Ready to Launch!</p>
            <p className="text-sm text-gray-600">
              Your campaign will be submitted for approval after funding
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
