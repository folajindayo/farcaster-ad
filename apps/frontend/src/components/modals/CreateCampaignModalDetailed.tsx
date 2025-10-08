'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Upload,
  Calendar,
  DollarCircle,
  Pin,
  Eye,
  Spark,
  CheckCircle,
} from 'iconoir-react';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CampaignForm {
  // Campaign Details
  name: string;
  objective: 'awareness' | 'engagement' | 'conversions';
  adType: 'banner' | 'pinned_cast' | 'both';

  // Targeting & Duration
  duration: number;
  durationUnit: 'days' | 'weeks';
  targetAudience: string;
  followerRange: string;

  // Budget & Payment
  budget: string;
  pricingModel: 'time' | 'impression';
  cpm: string;

  // Media & CTA
  mediaUrl: string;
  ctaUrl: string;
  ctaText: string;
}

export function CreateCampaignModalDetailed({
  isOpen,
  onClose,
  onSuccess,
}: CreateCampaignModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState<CampaignForm>({
    name: '',
    objective: 'awareness',
    adType: 'banner',
    duration: 7,
    durationUnit: 'days',
    targetAudience: '',
    followerRange: '',
    budget: '',
    pricingModel: 'time',
    cpm: '5.00',
    mediaUrl: '',
    ctaUrl: '',
    ctaText: 'Learn More',
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name?.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (!form.budget || parseFloat(form.budget) <= 0) {
      newErrors.budget = 'Budget must be greater than 0';
    }

    if (!form.mediaUrl?.trim()) {
      newErrors.mediaUrl = 'Banner image or media URL is required';
    }

    if (!form.ctaUrl?.trim()) {
      newErrors.ctaUrl = 'Call to Action link is required';
    }

    if (!form.ctaText?.trim()) {
      newErrors.ctaText = 'CTA button text is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      alert('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating campaign:', form);

      // Prepare campaign data for backend
      // Get user ID from localStorage
      let advertiserId = 'default-user';
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            advertiserId = userData._id || userData.id || 'default-user';
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      }
      
      const campaignData = {
        advertiserId,
        title: form.name,
        description: `${form.objective} campaign targeting ${form.targetAudience || 'general audience'}`,
        budget: form.budget,
        type: form.adType === 'both' ? 'banner' : form.adType,
        targeting: {
          followerRange: form.followerRange,
          audience: form.targetAudience,
        },
        creative: {
          mediaUrl: form.mediaUrl,
          ctaText: form.ctaText,
          ctaUrl: form.ctaUrl,
        },
        schedule: {
          startDate: new Date().toISOString(),
          endDate: new Date(
            Date.now() +
              form.duration *
                (form.durationUnit === 'days' ? 24 : 168) *
                60 *
                60 *
                1000
          ).toISOString(),
        },
      };

      // Call backend API
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      const result = await response.json();
      console.log('Campaign created:', result);

      // Show success message
      setShowSuccess(true);

      // Wait 2 seconds before closing
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert(
        `Error: ${error instanceof Error ? error.message : 'Failed to create campaign'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = () => {
    const budget = parseFloat(form.budget) || 0;
    const duration = form.duration;
    const unit = form.durationUnit;

    if (form.pricingModel === 'time') {
      return `$${budget} for ${duration} ${unit}`;
    } else {
      const impressions = Math.floor((budget / parseFloat(form.cpm)) * 1000);
      return `$${budget} for ~${impressions.toLocaleString()} impressions`;
    }
  };

  const getAvailableSlots = () => {
    // Mock data - in real app, this would come from API
    return Math.floor(Math.random() * 50) + 20;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Create preview and set as temporary URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      // Set the data URL as mediaUrl so validation passes
      setForm({ ...form, mediaUrl: dataUrl });
      // Clear any validation errors
      if (errors.mediaUrl) {
        setErrors({ ...errors, mediaUrl: '' });
      }
    };
    reader.readAsDataURL(file);

    // Upload to backend (optional - if it fails, we still have the data URL)
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Replace data URL with actual uploaded URL
        setForm({ ...form, mediaUrl: data.url });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // Don't show error - we already have the data URL set
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-cyber-500 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-dark-900/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-cyber-100 mb-2">
                Campaign Created Successfully!
              </h3>
              <p className="text-cyber-300">
                Your campaign is now live and ready to reach your audience
              </p>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-cyber-100">
                Create Campaign
              </h2>
              <p className="text-cyber-300 text-sm">Step {step} of 5</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-cyber-300 hover:text-cyber-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`h-2 flex-1 rounded-full ${
                    stepNum <= step ? 'bg-cyber-500' : 'bg-dark-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <Card className="bg-dark-700 border-cyber-600">
                  <CardHeader>
                    <CardTitle className="text-cyber-100 flex items-center gap-2">
                      <Pin className="w-5 h-5" />
                      Campaign Details
                    </CardTitle>
                    <CardDescription className="text-cyber-300">
                      Set up your campaign basics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-cyber-200">
                        Campaign Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => {
                          setForm({ ...form, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        placeholder="e.g., Base Summer Drop, NFT Launch Awareness"
                        className={`bg-dark-600 border-cyber-500 text-cyber-100 placeholder:text-cyber-400 ${
                          errors.name ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-cyber-200">Objective</Label>
                      <Select
                        value={form.objective}
                        onValueChange={(value: any) =>
                          setForm({ ...form, objective: value })
                        }
                      >
                        <SelectTrigger className="bg-dark-600 border-cyber-500 text-cyber-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-700 border-cyber-500">
                          <SelectItem value="awareness">Awareness</SelectItem>
                          <SelectItem value="engagement">Engagement</SelectItem>
                          <SelectItem value="conversions">
                            Conversions
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-cyber-200">Ad Type</Label>
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        {[
                          {
                            value: 'banner',
                            label: 'Profile Banner',
                            icon: Eye,
                          },
                          {
                            value: 'pinned_cast',
                            label: 'Pinned Cast',
                            icon: Spark,
                          },
                          { value: 'both', label: 'Both', icon: Pin },
                        ].map(({ value, label, icon: Icon }) => (
                          <Button
                            key={value}
                            variant={
                              form.adType === value ? 'default' : 'outline'
                            }
                            onClick={() =>
                              setForm({ ...form, adType: value as any })
                            }
                            className={`h-auto p-4 flex flex-col items-center gap-2 ${
                              form.adType === value
                                ? 'bg-cyber-500 text-white border-cyber-500'
                                : 'bg-dark-600 border-cyber-500 text-cyber-200 hover:bg-dark-500'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm">{label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <Card className="bg-dark-700 border-cyber-600">
                  <CardHeader>
                    <CardTitle className="text-cyber-100 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Targeting & Duration
                    </CardTitle>
                    <CardDescription className="text-cyber-300">
                      Set your campaign duration and target audience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration" className="text-cyber-200">
                          Duration
                        </Label>
                        <Input
                          id="duration"
                          type="number"
                          value={form.duration}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              duration: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-dark-600 border-cyber-500 text-cyber-100"
                        />
                      </div>
                      <div>
                        <Label className="text-cyber-200">Unit</Label>
                        <Select
                          value={form.durationUnit}
                          onValueChange={(value: any) =>
                            setForm({ ...form, durationUnit: value })
                          }
                        >
                          <SelectTrigger className="bg-dark-600 border-cyber-500 text-cyber-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-dark-700 border-cyber-500">
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="weeks">Weeks</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="targetAudience"
                        className="text-cyber-200"
                      >
                        Target Audience (optional)
                      </Label>
                      <Input
                        id="targetAudience"
                        value={form.targetAudience}
                        onChange={(e) =>
                          setForm({ ...form, targetAudience: e.target.value })
                        }
                        placeholder="e.g., Crypto builders, Design/Tech creators"
                        className="bg-dark-600 border-cyber-500 text-cyber-100 placeholder:text-cyber-400"
                      />
                    </div>

                    <div>
                      <Label htmlFor="followerRange" className="text-cyber-200">
                        Follower Range (optional)
                      </Label>
                      <Input
                        id="followerRange"
                        value={form.followerRange}
                        onChange={(e) =>
                          setForm({ ...form, followerRange: e.target.value })
                        }
                        placeholder="e.g., 10k+ followers"
                        className="bg-dark-600 border-cyber-500 text-cyber-100 placeholder:text-cyber-400"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <Card className="bg-dark-700 border-cyber-600">
                  <CardHeader>
                    <CardTitle className="text-cyber-100 flex items-center gap-2">
                      <DollarCircle className="w-5 h-5" />
                      Budget & Payment
                    </CardTitle>
                    <CardDescription className="text-cyber-300">
                      Set your budget and pricing model
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="budget" className="text-cyber-200">
                        Budget (USDC) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="budget"
                        type="number"
                        value={form.budget}
                        onChange={(e) => {
                          setForm({ ...form, budget: e.target.value });
                          if (errors.budget)
                            setErrors({ ...errors, budget: '' });
                        }}
                        placeholder="1000"
                        className={`bg-dark-600 border-cyber-500 text-cyber-100 ${
                          errors.budget ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.budget ? (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.budget}
                        </p>
                      ) : (
                        <p className="text-cyber-400 text-sm mt-1">
                          Payment occurs on-chain (Base network)
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-cyber-200">Pricing Model</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <Button
                          variant={
                            form.pricingModel === 'time' ? 'default' : 'outline'
                          }
                          onClick={() =>
                            setForm({ ...form, pricingModel: 'time' })
                          }
                          className={`h-auto p-4 ${
                            form.pricingModel === 'time'
                              ? 'bg-cyber-500 text-white border-cyber-500'
                              : 'bg-dark-600 border-cyber-500 text-cyber-200 hover:bg-dark-500'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-semibold">Time-based</div>
                            <div className="text-sm opacity-80">
                              Fixed per day
                            </div>
                          </div>
                        </Button>
                        <Button
                          variant={
                            form.pricingModel === 'impression'
                              ? 'default'
                              : 'outline'
                          }
                          onClick={() =>
                            setForm({ ...form, pricingModel: 'impression' })
                          }
                          className={`h-auto p-4 ${
                            form.pricingModel === 'impression'
                              ? 'bg-cyber-500 text-white border-cyber-500'
                              : 'bg-dark-600 border-cyber-500 text-cyber-200 hover:bg-dark-500'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-semibold">
                              Impression-based
                            </div>
                            <div className="text-sm opacity-80">
                              Pay per 1,000 views
                            </div>
                          </div>
                        </Button>
                      </div>
                    </div>

                    {form.pricingModel === 'impression' && (
                      <div>
                        <Label htmlFor="cpm" className="text-cyber-200">
                          CPM (Cost Per Mille)
                        </Label>
                        <Input
                          id="cpm"
                          type="number"
                          step="0.01"
                          value={form.cpm}
                          onChange={(e) =>
                            setForm({ ...form, cpm: e.target.value })
                          }
                          placeholder="5.00"
                          className="bg-dark-600 border-cyber-500 text-cyber-100"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <Card className="bg-dark-700 border-cyber-600">
                  <CardHeader>
                    <CardTitle className="text-cyber-100 flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Media & CTA
                    </CardTitle>
                    <CardDescription className="text-cyber-300">
                      Upload your creative assets and set up call-to-action
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="mediaUrl" className="text-cyber-200">
                        Banner Image <span className="text-red-500">*</span>
                      </Label>

                      {/* Image Preview */}
                      {imagePreview ? (
                        <div className="mt-2 mb-3 relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-48 rounded-lg border border-cyber-500"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImagePreview('');
                              setForm({ ...form, mediaUrl: '' });
                            }}
                            className="absolute top-2 right-2 bg-dark-800/90 border-cyber-500 text-cyber-300 hover:bg-dark-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() =>
                            document.getElementById('imageUpload')?.click()
                          }
                          className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                            errors.mediaUrl
                              ? 'border-red-500 bg-red-500/5'
                              : 'border-cyber-500 bg-dark-700 hover:bg-dark-600'
                          }`}
                        >
                          <Upload className="w-12 h-12 mx-auto mb-3 text-cyber-400" />
                          <p className="text-cyber-200 font-medium mb-1">
                            Click to upload banner image
                          </p>
                          <p className="text-cyber-400 text-sm">
                            PNG, JPG or GIF (max 5MB)
                          </p>
                        </div>
                      )}

                      <input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      {errors.mediaUrl && !imagePreview && (
                        <p className="text-red-500 text-sm mt-2">
                          {errors.mediaUrl}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="ctaUrl" className="text-cyber-200">
                        Call to Action Link{' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="ctaUrl"
                        value={form.ctaUrl}
                        onChange={(e) => {
                          setForm({ ...form, ctaUrl: e.target.value });
                          if (errors.ctaUrl)
                            setErrors({ ...errors, ctaUrl: '' });
                        }}
                        placeholder="e.g., project site, campaign page, mint link"
                        className={`bg-dark-600 border-cyber-500 text-cyber-100 placeholder:text-cyber-400 ${
                          errors.ctaUrl ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.ctaUrl && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.ctaUrl}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="ctaText" className="text-cyber-200">
                        CTA Button Text <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="ctaText"
                        value={form.ctaText}
                        onChange={(e) => {
                          setForm({ ...form, ctaText: e.target.value });
                          if (errors.ctaText)
                            setErrors({ ...errors, ctaText: '' });
                        }}
                        placeholder="Learn More"
                        className={`bg-dark-600 border-cyber-500 text-cyber-100 placeholder:text-cyber-400 ${
                          errors.ctaText ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.ctaText && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.ctaText}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <Card className="bg-dark-700 border-cyber-600">
                  <CardHeader>
                    <CardTitle className="text-cyber-100 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Review & Launch
                    </CardTitle>
                    <CardDescription className="text-cyber-300">
                      Review your campaign details before launching
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-cyber-200 font-semibold">
                          Campaign Details
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-cyber-400">Name:</span>
                            <span className="text-cyber-100">{form.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyber-400">Objective:</span>
                            <Badge
                              variant="outline"
                              className="border-cyber-500 text-cyber-300"
                            >
                              {form.objective}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyber-400">Ad Type:</span>
                            <span className="text-cyber-100">
                              {form.adType}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-cyber-200 font-semibold">
                          Duration & Cost
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-cyber-400">Duration:</span>
                            <span className="text-cyber-100">
                              {form.duration} {form.durationUnit}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyber-400">Cost:</span>
                            <span className="text-cyber-100">
                              {calculateCost()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyber-400">
                              Available Slots:
                            </span>
                            <span className="text-cyber-100">
                              {getAvailableSlots()} creators
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {form.targetAudience && (
                      <div className="pt-4 border-t border-cyber-600">
                        <h4 className="text-cyber-200 font-semibold mb-2">
                          Targeting
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-cyber-400">Audience:</span>
                            <span className="text-cyber-100">
                              {form.targetAudience}
                            </span>
                          </div>
                          {form.followerRange && (
                            <div className="flex justify-between">
                              <span className="text-cyber-400">
                                Follower Range:
                              </span>
                              <span className="text-cyber-100">
                                {form.followerRange}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="border-cyber-500 text-cyber-300 hover:bg-dark-600"
            >
              Previous
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-cyber-500 text-cyber-300 hover:bg-dark-600"
              >
                Cancel
              </Button>

              {step < 5 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="bg-cyber-500 hover:bg-cyber-600 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? 'Launching...' : '🟢 Launch Campaign'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
