import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCurrentUser } from "./use-current-user";
import { calculateProfileCompletion } from "@/lib/profile-utils";

/**
 * Hook for checking and managing user profile completion status
 */
export function useProfileCompletion() {
  const { user } = useCurrentUser();
  
  // Get profile completion from Convex
  const convexProfileCompletion = useQuery(
    api.users.checkProfileCompletion,
    user ? { userId: user._id } : "skip"
  );

  // Also calculate local completion for consistency
  const localProfileCompletion = user 
    ? calculateProfileCompletion(user, user.role)
    : null;

  // Use Convex data as primary source, fallback to local calculation
  const profileCompletion = convexProfileCompletion || (localProfileCompletion ? {
    isComplete: localProfileCompletion.percentage === 100,
    completionPercentage: localProfileCompletion.percentage,
    missingFields: localProfileCompletion.missingFields,
    requiredFields: [...localProfileCompletion.completedFields, ...localProfileCompletion.missingFields],
  } : null);

  // Determine if user can submit applications
  const canSubmitApplications = user?.role === "beneficiary" && profileCompletion?.isComplete;

  // Get the next step for profile completion
  const getNextStep = () => {
    if (!profileCompletion || profileCompletion.isComplete) return null;
    
    const missingFields = profileCompletion.missingFields;
    if (!missingFields || missingFields.length === 0) return null;
    
    // Return the first missing field as the next step
    return {
      field: missingFields[0],
      description: getStepDescription(missingFields[0])
    };
  };

  const getStepDescription = (field: string): string => {
    const descriptions: Record<string, string> = {
      "First Name": "Add your first name to your profile",
      "Last Name": "Add your last name to your profile", 
      "Email": "Verify your email address",
      "Phone Number": "Add a valid Nigerian phone number",
      "Date of Birth": "Add your date of birth",
      "Gender": "Specify your gender",
      "Address": "Complete your address information",
      "Academic Level": "Select your current academic level",
      "Current School": "Enter your current school name",
      "Emergency Contact": "Add emergency contact details"
    };
    
    return descriptions[field] || `Complete your ${field.toLowerCase()}`;
  };

  return {
    profileCompletion,
    isComplete: profileCompletion?.isComplete ?? false,
    completionPercentage: profileCompletion?.completionPercentage ?? 0,
    missingFields: profileCompletion?.missingFields ?? [],
    canSubmitApplications,
    nextStep: getNextStep(),
    isLoading: !user || convexProfileCompletion === undefined,
  };
}