#!/usr/bin/env node

// Script to verify required environment variables for Vercel deployment

// Load environment variables from .env.local if running locally
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  console.log('📁 Loading environment variables from .env.local...\n');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const requiredEnvVars = {
  // Public variables (needed at build time)
  NEXT_PUBLIC_CONVEX_URL: {
    required: true,
    example: "https://your-deployment.convex.cloud",
    description: "Convex deployment URL"
  },
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {
    required: true,
    example: "pk_test_...",
    description: "Clerk publishable key"
  },
  
  // Server-side variables (can be added after build)
  CLERK_SECRET_KEY: {
    required: true,
    example: "sk_test_...",
    description: "Clerk secret key"
  },
  CLERK_ISSUER_URL: {
    required: true,
    example: "https://your-clerk-instance.accounts.dev",
    description: "Clerk issuer URL for JWT validation"
  },
  
  // Optional variables
  CLERK_WEBHOOK_SECRET: {
    required: false,
    example: "whsec_...",
    description: "Clerk webhook secret (required if using webhooks)"
  },
  RESEND_API_KEY: {
    required: false,
    example: "re_...",
    description: "Resend API key for email notifications"
  },
  SITE_URL: {
    required: false,
    example: "https://yourdomain.com",
    description: "Your site URL for email links"
  }
};

console.log("🔍 Verifying environment variables for Vercel deployment...\n");

let hasErrors = false;
const missing = [];
const configured = [];

for (const [key, config] of Object.entries(requiredEnvVars)) {
  const value = process.env[key];
  
  if (!value && config.required) {
    hasErrors = true;
    missing.push(key);
    console.log(`❌ ${key} - MISSING (Required)`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Example: ${config.example}\n`);
  } else if (!value && !config.required) {
    console.log(`⚠️  ${key} - Not set (Optional)`);
    console.log(`   Description: ${config.description}\n`);
  } else {
    configured.push(key);
    const maskedValue = value.substring(0, 10) + "...";
    console.log(`✅ ${key} - Configured (${maskedValue})\n`);
  }
}

console.log("\n📊 Summary:");
console.log(`   Configured: ${configured.length} variables`);
console.log(`   Missing Required: ${missing.length} variables`);

if (hasErrors) {
  console.log("\n❌ Missing required environment variables!");
  console.log("\n📝 Add these to your Vercel project:");
  console.log("   1. Go to your Vercel project settings");
  console.log("   2. Navigate to Settings > Environment Variables");
  console.log("   3. Add the missing variables listed above");
  console.log("   4. Make sure to add them for Production, Preview, and Development environments");
  console.log("\n💡 Important for Vercel:");
  console.log("   - NEXT_PUBLIC_* variables must be added BEFORE building");
  console.log("   - Non-public variables can be added after build");
  console.log("   - After adding variables, you need to redeploy");
  process.exit(1);
} else {
  console.log("\n✅ All required environment variables are configured!");
  console.log("\n🚀 Ready for Vercel deployment!");
}