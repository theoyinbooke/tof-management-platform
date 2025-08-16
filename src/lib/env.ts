// Environment variable validation and access
// This file ensures environment variables are properly typed and available

const getEnvVariable = (key: string): string => {
  const value = process.env[key];
  
  // During build time, we might not have all env vars
  // Return a placeholder that will be replaced at runtime
  if (typeof window === "undefined" && !value) {
    // Server-side during build
    console.warn(`Environment variable ${key} is not set during build`);
    return "";
  }
  
  if (!value && typeof window !== "undefined") {
    // Client-side runtime error
    throw new Error(`Environment variable ${key} is not set`);
  }
  
  return value || "";
};

export const env = {
  NEXT_PUBLIC_CONVEX_URL: getEnvVariable("NEXT_PUBLIC_CONVEX_URL"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: getEnvVariable("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "",
  CLERK_ISSUER_URL: process.env.CLERK_ISSUER_URL || "",
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET || "",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  SITE_URL: process.env.SITE_URL || "http://localhost:3000",
} as const;

// Type-safe environment variables
export type Env = typeof env;