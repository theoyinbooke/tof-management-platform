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
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-orange-800">
                Complete Your Profile
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-orange-700 mb-4">
              Please complete your profile setup to access all features and submit applications.
            </p>
            
            <div className="space-y-3">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-orange-700">
                    Profile Completion
                  </span>
                  <span className="text-sm text-orange-600">
                    {profileCompletion.completionPercentage}%
                  </span>
                </div>
                <Progress 
                  value={profileCompletion.completionPercentage} 
                  className="h-2 bg-orange-100"
                />
              </div>

              {/* Missing Fields */}
              {profileCompletion.missingFields.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-orange-700 mb-2">
                    Missing Information:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profileCompletion.missingFields.slice(0, 5).map((field) => (
                      <span
                        key={field}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {field}
                      </span>
                    ))}
                    {profileCompletion.missingFields.length > 5 && (
                      <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                        +{profileCompletion.missingFields.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={onSetupProfile}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  Complete Profile
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setIsDismissed(true)}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Remind Me Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}