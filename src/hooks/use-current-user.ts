"use client";

import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const { user: clerkUser, isLoaded } = useUser();
  const user = useQuery(api.auth.getCurrentUser);
  const createUserIfNeeded = useMutation(api.authHelpers.getCurrentUserOrCreate);

  // Automatically create user in Convex if they exist in Clerk but not in Convex
  useEffect(() => {
    if (isLoaded && clerkUser && user === null) {
      console.log("Creating user in Convex for:", clerkUser.emailAddresses[0]?.emailAddress);
      createUserIfNeeded({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        imageUrl: clerkUser.imageUrl,
      }).catch((error) => {
        console.error("Failed to create user in Convex:", error);
      });
    }
  }, [isLoaded, clerkUser, user, createUserIfNeeded]);
  
  return {
    user,
    isLoading: user === undefined || !isLoaded,
    isAuthenticated: user !== null,
    isAdmin: user?.role === "admin" || user?.role === "super_admin",
    isBeneficiary: user?.role === "beneficiary",
    isGuardian: user?.role === "guardian",
    isReviewer: user?.role === "reviewer",
    isSuperAdmin: user?.role === "super_admin",
    hasFoundation: !!user?.foundationId,
    foundation: user?.foundation,
  };
}
