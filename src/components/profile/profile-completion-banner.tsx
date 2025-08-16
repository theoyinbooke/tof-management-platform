"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, User, CheckCircle, X } from "lucide-react";
import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { getProfileCompletionSteps } from "@/lib/profile-utils";

interface ProfileCompletionBannerProps {
  onSetupProfile: () => void;
}

export function ProfileCompletionBanner({ onSetupProfile }: ProfileCompletionBannerProps) {
  const { user } = useCurrentUser();
  const [isDismissed, setIsDismissed] = useState(false);
  
  const profileCompletion = useQuery(
    api.users.checkProfileCompletion,
    user ? { userId: user._id } : "skip"
  );

  // Don't show banner if user not loaded, profile is complete, or banner is dismissed
  if (!user || !profileCompletion || profileCompletion.isComplete || isDismissed) {
    return null;
  }

  // Only show for beneficiaries and guardians who need to complete profiles
  if (!["beneficiary", "guardian"].includes(user.role)) {
    return null;
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-orange-800">
                Complete Your Profile
              </h3>
              <span className="text-xs text-orange-600">
                {profileCompletion.completionPercentage}% complete
              </span>
            </div>
            
            <p className="text-xs text-orange-700 mt-1">
              Please complete your profile to access all features.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Progress 
              value={profileCompletion.completionPercentage} 
              className="h-1.5 w-20 bg-orange-100"
            />
            
            <Button 
              onClick={onSetupProfile}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white h-7 px-3 text-xs"
            >
              Complete Profile
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-100 h-7 w-7 p-0"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}