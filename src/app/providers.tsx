"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { useAuth as useClerkAuth } from "@clerk/nextjs";

// Create Convex client conditionally to handle missing env vars during build
const createConvexClient = () => {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    console.warn("NEXT_PUBLIC_CONVEX_URL is not set, using placeholder");
    // Return a placeholder URL that will be replaced at runtime
    return new ConvexReactClient("https://placeholder.convex.cloud");
  }
  return new ConvexReactClient(url);
};

// Custom useAuth hook that uses the "convex" JWT template
function useAuth() {
  const auth = useClerkAuth();

  return useMemo(() => {
    return {
      isLoaded: auth.isLoaded,
      isSignedIn: auth.isSignedIn,
      userId: auth.userId,
      sessionId: auth.sessionId,
      orgId: auth.orgId,
      orgRole: auth.orgRole,
      orgSlug: auth.orgSlug,
      has: auth.has,
      signOut: auth.signOut,
      getToken: async (options?: any) => {
        // Always use the "convex" JWT template
        return auth.getToken({ ...options, template: "convex" });
      },
    };
  }, [
    auth.isLoaded,
    auth.isSignedIn,
    auth.userId,
    auth.sessionId,
    auth.orgId,
    auth.orgRole,
    auth.orgSlug,
    auth.has,
    auth.signOut,
    auth.getToken,
  ]);
}

export function Providers({ children }: { children: ReactNode }) {
  const convex = useMemo(() => createConvexClient(), []);

  // Handle missing Clerk key during build
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_placeholder";

  return (
    <ClerkProvider
      publishableKey={clerkKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#16a34a", // Design system primary color
          colorBackground: "#ffffff",
          colorText: "#0f172a",
          colorTextSecondary: "#64748b",
          borderRadius: "0.5rem",
        },
        elements: {
          formButtonPrimary:
            "bg-primary hover:bg-primary-hover text-white transition-all duration-200",
          card: "shadow-lg rounded-lg",
          headerTitle: "text-2xl font-bold",
          headerSubtitle: "text-gray-600",
          formFieldInput: "border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}