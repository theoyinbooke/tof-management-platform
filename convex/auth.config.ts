// This file is for Convex Auth configuration
// Since we're using Clerk's standard integration, this configuration is optional
// If CLERK_DOMAIN is not set, Clerk will use its default domain automatically

export default {
  providers: [
    {
      // Optional: Use custom domain if configured, otherwise leave empty for Clerk's default
      domain: process.env.CLERK_DOMAIN || "",
      applicationID: "convex",
    },
  ]
};