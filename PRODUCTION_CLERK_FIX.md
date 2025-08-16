# Fix for Clerk CORS Error in Production

## Problem
The production site at `https://www.theoyinbookefoundation.com` is trying to load Clerk from `clerk.theoyinbookefoundation.com` which doesn't exist, causing a CORS error.

## Root Cause
You're using development Clerk credentials in production. The current `.env.local` has:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YXdhaXRlZC1zaGFyay03NC5jbGVyay5hY2NvdW50cy5kZXYk`
- This is a TEST key that points to `awaited-shark-74.accounts.dev`

## Solution Steps

### Option 1: Use Clerk's Default Domain (Recommended for Quick Fix)

1. **Get Production Clerk Keys:**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Select your production application
   - Go to "API Keys" section
   - Copy the production keys

2. **Update Production Environment Variables on Vercel:**
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_[your-production-key]
   CLERK_SECRET_KEY=sk_live_[your-production-secret-key]
   ```

3. **Remove any custom domain configuration** if you have:
   - Don't set `CLERK_HOSTNAME` unless you've properly configured a custom domain
   - Let Clerk use its default domain (e.g., `your-app.clerk.accounts.dev` for production)

### Option 2: Set Up Custom Domain (If you want clerk.theoyinbookefoundation.com)

1. **In Clerk Dashboard:**
   - Go to "Paths & Domains" settings
   - Add custom domain: `clerk.theoyinbookefoundation.com`
   - Follow Clerk's DNS configuration instructions

2. **Add DNS Records (in your domain provider):**
   ```
   Type: CNAME
   Name: clerk
   Value: [provided by Clerk]
   ```

3. **Wait for DNS propagation** (can take up to 48 hours)

4. **Update Vercel Environment Variables:**
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_[your-production-key]
   CLERK_SECRET_KEY=sk_live_[your-production-secret-key]
   CLERK_DOMAIN=clerk.theoyinbookefoundation.com
   ```

## Immediate Fix (Do This Now)

1. **Go to Vercel Dashboard:**
   - Navigate to your project
   - Go to Settings → Environment Variables
   
2. **Check/Update these variables for Production:**
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[production key, not test key]
   CLERK_SECRET_KEY=[production secret key]
   NEXT_PUBLIC_CONVEX_URL=https://tough-ermine-675.convex.cloud
   ```

3. **Remove or comment out CLERK_HOSTNAME** if it exists

4. **Redeploy your application** on Vercel

## How to Verify Production Keys

Production Clerk keys should:
- Start with `pk_live_` (not `pk_test_`)
- Point to a valid Clerk domain
- Match your Clerk dashboard production environment

## Testing After Fix

1. Clear browser cache
2. Visit https://www.theoyinbookefoundation.com
3. Check browser console for errors
4. Try signing in

## Prevention

Create a `.env.production` file (add to .gitignore) with production values:
```env
# Production Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Production Convex
NEXT_PUBLIC_CONVEX_URL=https://tough-ermine-675.convex.cloud

# Other production configs
SITE_URL=https://www.theoyinbookefoundation.com
```

## Emergency Workaround

If you need the site working immediately while fixing Clerk:

1. Temporarily disable authentication by modifying the providers.tsx
2. Deploy a maintenance page
3. Fix the Clerk configuration properly
4. Re-enable authentication

## Contact Support

If issues persist:
- Clerk Support: https://clerk.com/support
- Check Clerk Status: https://status.clerk.com