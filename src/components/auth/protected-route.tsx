"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireFoundation?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles = [],
  requireFoundation = false
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const { user, isLoading: isUserLoading, isAuthenticated } = useCurrentUser();
  
  // User is authenticated with Clerk but not yet loaded in Convex
  const isAuthLoading = !isClerkLoaded || (isSignedIn && isUserLoading);
  
  // User is fully loaded and authenticated
  const isFullyAuthenticated = isClerkLoaded && isSignedIn && isAuthenticated;
  
  // User is fully loaded but not authenticated
  const isUnauthenticated = isClerkLoaded && (!isSignedIn || (isSignedIn && !isUserLoading && !isAuthenticated));

  useEffect(() => {
    // Don't do anything while loading
    if (isAuthLoading) {
      return;
    }

    // Not authenticated with Clerk
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    // User is authenticated with Clerk but not found in Convex (might be syncing)
    if (isSignedIn && !isAuthenticated) {
      // Log this for debugging but don't redirect to avoid loops
      console.warn("User authenticated with Clerk but not found in Convex");
      return;
    }

    // User exists but no foundation assigned (except super_admin)
    if (requireFoundation && user && !user.foundationId && user.role !== "super_admin") {
      // For now, log this but don't redirect to avoid loops
      console.warn("User has no foundation assigned:", user.email);
      // TODO: Create proper foundation onboarding flow
      // router.push("/onboarding/foundation");
      // return;
    }

    // Role-based access control
    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
      router.push("/unauthorized");
      return;
    }
  }, [isAuthLoading, isSignedIn, isAuthenticated, user, allowedRoles, requireFoundation, router]);

  // Loading state
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Not authenticated with Clerk
  if (!isSignedIn) {
    return null;
  }

  // User is authenticated with Clerk but not found in Convex (might be syncing)
  if (isSignedIn && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Setting up your account...</h2>
          <p className="text-gray-600 mb-4">Please wait while we prepare your dashboard.</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // Unauthorized access
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}