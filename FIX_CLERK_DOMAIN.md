# Fix for Clerk Domain CORS Error

## The Problem
Your Convex production environment has `CLERK_DOMAIN=https://clerk.theoyinbookefoundation.com` but this subdomain doesn't exist, causing the CORS error.

## Solution - Remove the CLERK_DOMAIN Variable

### Step 1: Remove from Convex Dashboard
1. Go to your [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project: `tof` 
3. Go to **Production → tough-ermine-675**
4. Click on **Environment Variables**
5. Find `CLERK_DOMAIN` 
6. **DELETE** this environment variable completely (don't just empty it, remove it)
7. Keep the other Clerk variables as they are:
   - `CLERK_SECRET_KEY` = `sk_live_qU1WDvjz5UrZnOHT9jxofA...`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_Y2xlcmsudGhlb3lpbmJvb2t...`

### Step 2: Redeploy Convex Functions
After removing the variable, redeploy your Convex functions:

```bash
npx convex deploy --prod
```

Or if that doesn't work:
```bash
CONVEX_DEPLOYMENT=prod:tough-ermine-675 npx convex deploy
```

### Step 3: Clear Vercel Cache and Redeploy
1. Go to your Vercel dashboard
2. Trigger a new deployment (you can do this by pushing a small change or clicking "Redeploy")

## Why This Works
- When `CLERK_DOMAIN` is not set, Clerk automatically uses its default domain
- Your Clerk keys are valid production keys
- The default Clerk domain will work without CORS issues

## Alternative: If You Want a Custom Domain (Optional)

If you actually want to use `clerk.theoyinbookefoundation.com`:

1. **In Clerk Dashboard:**
   - Go to your production instance settings
   - Navigate to "Domains" or "Custom Domains"
   - Add `clerk.theoyinbookefoundation.com` as a custom domain
   - You'll get DNS records to add

2. **In Your DNS Provider (where theoyinbookefoundation.com is hosted):**
   - Add a CNAME record:
     ```
     Type: CNAME
     Name: clerk
     Value: [provided by Clerk, usually something like frontend-api.clerk.services]
     ```

3. **Wait for DNS propagation** (up to 48 hours)

4. **Only then** add back `CLERK_DOMAIN` in Convex

## Quick Test After Fix
1. Open browser console
2. Visit https://www.theoyinbookefoundation.com
3. Check that there are no CORS errors
4. Try to sign in

The error should be resolved once you remove the `CLERK_DOMAIN` variable from Convex.