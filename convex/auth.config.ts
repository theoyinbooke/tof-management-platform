export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL || "https://awaited-shark-74.accounts.dev",
      applicationID: "convex",
    },
  ]
};