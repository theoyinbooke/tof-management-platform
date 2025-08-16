# Vercel Environment Variables Setup Guide

## ⚠️ IMPORTANT: Environment Variables and Build Errors

If you're experiencing the error:
```
Error: ENOENT: no such file or directory, lstat '/vercel/path0/.next/server/app/(dashboard)/page_client-reference-manifest.js'
```

This is likely due to **missing environment variables** during the Vercel build process.

## Required Environment Variables for Vercel

### 1. **Build-Time Variables (MUST be set before deployment)**

These variables with `NEXT_PUBLIC_` prefix are needed during the build process:

```env
NEXT_PUBLIC_CONVEX_URL=https://greedy-squirrel-215.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YXdhaXRlZC1zaGFyay03NC5jbGVyay5hY2NvdW50cy5kZXYk
```

⚠️ **Critical**: If these are not set in Vercel BEFORE building, the build will fail!

### 2. **Runtime Variables (Can be set after build)**

These server-side variables can be added after the build:

```env
CLERK_SECRET_KEY=sk_test_iclbuArQbc2NqA6yo8YXmZjVvrLgV4c81D2www46d2
CLERK_ISSUER_URL=https://awaited-shark-74.accounts.dev
CLERK_WEBHOOK_SECRET=your_webhook_secret_here
RESEND_API_KEY=re_BGBEiUwr_77gw2KKVeameWKzJYzFSKQ9x
SITE_URL=https://theoyinbookefoundation.com
```

## How to Add Environment Variables to Vercel

### Step 1: Access Environment Variables Settings
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on "Settings" tab
4. Click on "Environment Variables" in the left sidebar

### Step 2: Add Each Variable
For each variable:
1. Enter the **Key** (e.g., `NEXT_PUBLIC_CONVEX_URL`)
2. Enter the **Value** (e.g., `https://greedy-squirrel-215.convex.cloud`)
3. Select which environments to add it to:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

### Step 3: Add Variables in Correct Order

**Add these FIRST (before any deployment):**
```
NEXT_PUBLIC_CONVEX_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

**Then add these:**
```
CLERK_SECRET_KEY
CLERK_ISSUER_URL
```

**Optional (add if using these features):**
```
CLERK_WEBHOOK_SECRET
RESEND_API_KEY
SITE_URL
```

### Step 4: Redeploy
After adding all variables:
1. Go to the "Deployments" tab
2. Click on the three dots menu on your latest deployment
3. Select "Redeploy"
4. Choose "Use existing Build Cache" = NO (important!)
5. Click "Redeploy"

## Verify Environment Variables Locally

Run this command to check your local environment:

```bash
node scripts/verify-env.js
```

## Production vs Development URLs

Make sure you're using the correct URLs for production:

### For Production Deployment:
```env
# Production Convex URL (get from Convex dashboard)
NEXT_PUBLIC_CONVEX_URL=https://tough-ermine-675.convex.cloud

# Production Clerk (if you have a production Clerk app)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_ISSUER_URL=https://your-production.clerk.accounts.dev
```

### For Development/Preview:
```env
# Development Convex URL
NEXT_PUBLIC_CONVEX_URL=https://greedy-squirrel-215.convex.cloud

# Development Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_ISSUER_URL=https://awaited-shark-74.accounts.dev
```

## Troubleshooting

### If build still fails after adding environment variables:

1. **Clear Vercel Cache:**
   - In Vercel dashboard, go to Settings > Data Cache
   - Click "Purge Everything"

2. **Force Clean Build:**
   - When redeploying, make sure "Use existing Build Cache" is set to NO

3. **Check Build Logs:**
   - Look for warnings about missing environment variables
   - Check if the providers.tsx file is trying to access env vars

4. **Verify Variables are Available:**
   - Add this to your `next.config.ts` temporarily to debug:
   ```js
   console.log('Build-time env check:', {
     NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL ? 'SET' : 'MISSING',
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
   });
   ```

5. **Use Vercel CLI for debugging:**
   ```bash
   vercel env ls
   vercel env pull
   ```

## Contact Support

If issues persist after following this guide:
1. Check Vercel Status: https://www.vercel-status.com/
2. Contact Vercel Support with:
   - Your deployment URL
   - The exact error message
   - Screenshot of your environment variables (with values hidden)

## Summary Checklist

- [ ] Added `NEXT_PUBLIC_CONVEX_URL` to Vercel
- [ ] Added `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to Vercel
- [ ] Added `CLERK_SECRET_KEY` to Vercel
- [ ] Added `CLERK_ISSUER_URL` to Vercel
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed with cache disabled
- [ ] Verified build logs for any warnings