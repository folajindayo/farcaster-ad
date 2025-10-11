# Role Selection During Onboarding

## Summary
Added the ability for new users to choose their role (Advertiser or Host) during the onboarding process after authenticating with Farcaster.

## Changes Made

### 1. Frontend - FarcasterAuth Component
**File**: `/apps/frontend/src/components/auth/FarcasterAuth.tsx`

#### New Features:
- **Role Selection Screen**: After successful Farcaster authentication, users now see a role selection screen
- **Two Role Options**:
  - **Advertiser** 📢: Create and manage ad campaigns
  - **Host** 💰: Monetize profile by displaying ads

#### User Flow:
1. User clicks "Sign in with Farcaster"
2. Farcaster authentication completes
3. **NEW**: Role selection screen appears with two options
4. User selects their preferred role
5. Authentication completes with selected role
6. User is redirected to appropriate dashboard:
   - Advertisers → `/dashboard`
   - Hosts → `/host/dashboard`

#### Key Features:
- Visual card-based selection with emojis and descriptions
- Clear explanation of each role's benefits
- Note that roles can be switched later from settings
- Matches the dark neutral theme with orange accents

### 2. Backend - Authentication Service
**File**: `/apps/backend/src/services/farcasterAuth.ts`

#### Changes:
- Added `role` parameter to `verifyFarcasterAuth` function
- Uses provided role when creating new users
- Defaults to 'advertiser' if no role is specified
- Logs the selected role for debugging

```typescript
role?: 'advertiser' | 'host'
// ...
role: role || 'advertiser', // Use provided role or default to advertiser
```

### 3. Backend - Auth Route
**File**: `/apps/backend/src/routes/auth.ts`

#### Changes:
- Accept `role` parameter from frontend
- Validate role is either 'advertiser' or 'host'
- Pass role to authentication service

```typescript
if (role && !['advertiser', 'host'].includes(role)) {
  return res.status(400).json({ message: 'Invalid role' });
}
```

## UI Design

### Role Selection Screen
```
┌─────────────────────────────────────┐
│  Choose Your Role                   │
│  Select how you'd like to use       │
│  the platform                       │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📢  Advertiser              │   │
│  │                             │   │
│  │ Create and manage ad        │   │
│  │ campaigns to promote your   │   │
│  │ project or brand            │   │
│  │                             │   │
│  │ • Launch targeted campaigns │   │
│  │ • Track real-time metrics   │   │
│  │ • Pay with USDC on Base     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💰  Host                    │   │
│  │                             │   │
│  │ Monetize your Farcaster     │   │
│  │ profile by displaying ads   │   │
│  │ and earn USDC               │   │
│  │                             │   │
│  │ • Earn passive income       │   │
│  │ • Control what ads display  │   │
│  │ • Get paid hourly in USDC   │   │
│  └─────────────────────────────┘   │
│                                     │
│  You can switch roles anytime      │
│  from your dashboard settings      │
└─────────────────────────────────────┘
```

## Benefits

### For Users:
1. **Clear Onboarding**: Users immediately understand the two ways to use the platform
2. **Informed Choice**: Detailed descriptions help users choose the right role
3. **Appropriate Dashboard**: Users land on the dashboard that matches their needs
4. **Flexibility**: Can switch roles later if they want to try both

### For Platform:
1. **Better User Segmentation**: Know user intent from day one
2. **Improved UX**: Tailored experience from the start
3. **Higher Engagement**: Users see relevant features immediately
4. **Data Insights**: Track which role is more popular

## Testing

### Test the Flow:
1. **Start Fresh**: Clear localStorage and sign out
2. **Visit Homepage**: Go to the app
3. **Click Sign In**: Use Farcaster authentication
4. **See Role Selection**: Should appear after auth
5. **Select Advertiser**: Should redirect to `/dashboard`
6. **Sign Out and Try Again**: 
7. **Select Host**: Should redirect to `/host/dashboard`

### Verify Backend:
```bash
# Check that user was created with correct role
mongo
use farcaster-ad-rental
db.users.findOne({ farcasterId: "YOUR_FID" })
# Should show role: "advertiser" or "host"
```

## Future Enhancements

1. **Onboarding Tutorial**: Show role-specific tutorial after selection
2. **Role Recommendations**: Suggest role based on Farcaster profile data
3. **Dual Role Support**: Allow users to have both roles simultaneously
4. **Role Statistics**: Show success metrics for each role on selection screen
5. **A/B Testing**: Test different copy/designs for role cards

## Rollback Plan

If issues arise, the system gracefully falls back to:
- Default role: `advertiser`
- Existing role switching mechanism still works
- Users can change role from dashboard settings

## Related Files

- `/apps/frontend/src/components/auth/FarcasterAuth.tsx`
- `/apps/backend/src/services/farcasterAuth.ts`
- `/apps/backend/src/routes/auth.ts`
- `/apps/frontend/src/app/dashboard/page.tsx` (role-based redirect)
- `/apps/frontend/src/app/host/dashboard/page.tsx` (host dashboard)

## Notes

- The role selection happens **after** Farcaster authentication but **before** account creation
- For existing users logging back in, they skip role selection and go straight to their dashboard
- The `selectedRole` state variable is currently unused but reserved for future UI enhancements (like highlighting selected card)
- Operator role is intentionally not included in onboarding (admin only)



