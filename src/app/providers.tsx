"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
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