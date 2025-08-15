"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useProfileCompletion } from "@/hooks/use-profile-completion";
import { User, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

interface ProfileCompletionCardProps {
  onSetupProfile: () => void;
  compact?: boolean;
}

export function ProfileCompletionCard({ onSetupProfile, compact = false }: ProfileCompletionCardProps) {
  const { profileCompletion, isComplete, completionPercentage, nextStep, isLoading } = useProfileCompletion();

  if (isLoading || isComplete) {
    return null;
  }

  if (compact) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">Profile Setup</p>
              <p className="text-xs text-orange-600">{completionPercentage}% complete</p>
            </div>
            <Button 
              size="sm" 
              onClick={onSetupProfile}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Complete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
            <User className="w-5 h-5" />
            Complete Your Profile
          </CardTitle>
          <Badge variant="outline" className="border-orange-300 text-orange-700">
            {completionPercentage}% Done
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-orange-700">Progress</span>
            <span className="text-sm text-orange-600">{completionPercentage}%</span>
          </div>
          <Progress 
            value={completionPercentage} 
            className="h-2 bg-orange-100"
          />
        </div>

        {nextStep && (
          <div className="bg-white/50 p-3 rounded-lg border border-orange-200">
            <p className="text-sm font-medium text-orange-800">Next Step:</p>
            <p className="text-sm text-orange-700">{nextStep.description}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button 
            onClick={onSetupProfile}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          >
            <User className="w-4 h-4 mr-2" />
            Complete Profile
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="pt-2 border-t border-orange-200">
          <p className="text-xs text-orange-600">
            Complete your profile to unlock applications, get personalized support, and access all platform features.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}