// This file is for Convex Auth configuration
// Since we're using Clerk's standard integration, this configuration is optional
// If CLERK_DOMAIN is not set, Clerk will use its default domain automatically

// Check if this is actually being used - if not, just export an empty config
const domain = process.env.CLERK_DOMAIN || 
               process.env.CLERK_JWT_ISSUER_DOMAIN || 
               process.env.CLERK_ISSUER_URL ||
               "https://clerk.com"; // Fallback to a valid domain

export default {
  providers: [
    {
      domain: domain,
      applicationID: "convex",
    },
  ]
};