"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  GraduationCap, 
  DollarSign, 
  BookOpen, 
  FileText, 
  AlertCircle, 
  Users, 
  Calendar,
  Settings,
  CheckCircle,
  Lock,
  User,
  UserCheck
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface EligibilityStatus {
  isEligible: boolean;
  isLocked: boolean;
  reasons: string[];
  missingProfileFields: string[];
}

interface SupportTypeSelectionStepProps {
  supportConfigs: any[];
  selectedSupportType: string;
  onSupportTypeChange: (supportTypeId: string) => void;
  userProfile?: any;
}

// Icon mapping helper
const getIconComponent = (iconName?: string) => {
  const iconMap: Record<string, any> = {
    GraduationCap: GraduationCap,
    DollarSign: DollarSign,
    BookOpen: BookOpen,
    FileText: FileText,
    AlertCircle: AlertCircle,
    Bus: Settings,
    Heart: Settings,
    Users: Users,
    Calendar: Calendar,
  };
  return iconMap[iconName || "FileText"] || FileText;
};

// Academic level mapping for comparison
const academicLevelOrder = {
  "nursery_1": 1, "nursery_2": 2,
  "primary_1": 3, "primary_2": 4, "primary_3": 5, "primary_4": 6, "primary_5": 7, "primary_6": 8,
  "jss_1": 9, "jss_2": 10, "jss_3": 11,
  "sss_1": 12, "sss_2": 13, "sss_3": 14,
  "university_1": 15, "university_2": 16, "university_3": 17, "university_4": 18, "university_5": 19, "university_6": 20
};

// Simplified academic level mapping
const simplifiedLevels: Record<string, string> = {
  "nursery": "nursery_1",
  "primary": "primary_1", 
  "jss": "jss_1",
  "sss": "sss_1",
  "university": "university_1"
};

// Check if user is eligible for a support type
const checkEligibility = (config: any, userProfile: any): EligibilityStatus => {
  const reasons: string[] = [];
  const missingProfileFields: string[] = [];
  let isEligible = true;

  // Check if profile is complete enough
  if (!userProfile) {
    return {
      isEligible: false,
      isLocked: true,
      reasons: ["User profile not found"],
      missingProfileFields: ["Complete profile setup required"]
    };
  }

  // Check required profile fields
  if (!userProfile.dateOfBirth) {
    missingProfileFields.push("Date of Birth");
    isEligible = false;
  }

  if (!userProfile.beneficiaryInfo?.currentLevel) {
    missingProfileFields.push("Current Academic Level");
    isEligible = false;
  }

  if (!userProfile.beneficiaryInfo?.currentSchool) {
    missingProfileFields.push("Current School");
    isEligible = false;
  }

  // If basic profile is incomplete, it's locked
  if (missingProfileFields.length > 0) {
    return {
      isEligible: false,
      isLocked: true,
      reasons: ["Profile incomplete"],
      missingProfileFields
    };
  }

  const rules = config.eligibilityRules || {};
  const userCurrentLevel = userProfile.beneficiaryInfo?.currentLevel;
  const userAge = userProfile.dateOfBirth ? 
    Math.floor((Date.now() - new Date(userProfile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

  // Check academic level requirements
  if (rules.minAcademicLevel) {
    const userLevelValue = academicLevelOrder[userCurrentLevel] || academicLevelOrder[simplifiedLevels[userCurrentLevel]] || 0;
    const minLevelValue = academicLevelOrder[rules.minAcademicLevel] || 0;
    
    if (userLevelValue < minLevelValue) {
      reasons.push(`Requires minimum academic level: ${rules.minAcademicLevel.replace(/_/g, ' ')}`);
      isEligible = false;
    }
  }

  if (rules.maxAcademicLevel) {
    const userLevelValue = academicLevelOrder[userCurrentLevel] || academicLevelOrder[simplifiedLevels[userCurrentLevel]] || 0;
    const maxLevelValue = academicLevelOrder[rules.maxAcademicLevel] || 999;
    
    if (userLevelValue > maxLevelValue) {
      reasons.push(`Exceeds maximum academic level: ${rules.maxAcademicLevel.replace(/_/g, ' ')}`);
      isEligible = false;
    }
  }

  // Check age requirements
  if (rules.minAge && userAge < rules.minAge) {
    reasons.push(`Requires minimum age: ${rules.minAge} years (you are ${userAge})`);
    isEligible = false;
  }

  if (rules.maxAge && userAge > rules.maxAge) {
    reasons.push(`Exceeds maximum age: ${rules.maxAge} years (you are ${userAge})`);
    isEligible = false;
  }

  // Check grade requirements
  if (rules.requiresMinGrade && userProfile.beneficiaryInfo?.lastGradePercentage) {
    if (userProfile.beneficiaryInfo.lastGradePercentage < rules.requiresMinGrade) {
      reasons.push(`Requires minimum grade: ${rules.requiresMinGrade}% (you have ${userProfile.beneficiaryInfo.lastGradePercentage}%)`);
      isEligible = false;
    }
  }

  return {
    isEligible,
    isLocked: false, // Profile is complete, so it's not locked even if not eligible
    reasons,
    missingProfileFields: []
  };
};

export function SupportTypeSelectionStep({ 
  supportConfigs, 
  selectedSupportType, 
  onSupportTypeChange,
  userProfile
}: SupportTypeSelectionStepProps) {
  // Use all configs without filtering - they should already be filtered from the server
  const activeSupportConfigs = supportConfigs || [];

  console.log("SupportTypeSelectionStep received configs:", activeSupportConfigs.length, activeSupportConfigs);

  // Group support configs by eligibility status
  const eligibleConfigs: any[] = [];
  const ineligibleConfigs: any[] = [];
  const lockedConfigs: any[] = [];

  activeSupportConfigs.forEach(config => {
    // Check if eligibility is already provided from server (for beneficiaries)
    const eligibility = config.eligibility || checkEligibility(config, userProfile);
    
    if (eligibility.isLocked) {
      lockedConfigs.push({ ...config, eligibility });
    } else if (eligibility.isEligible) {
      eligibleConfigs.push({ ...config, eligibility });
    } else {
      ineligibleConfigs.push({ ...config, eligibility });
    }
  });

  if (!activeSupportConfigs.length) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Support Programs Available</h3>
        <p className="text-gray-600">
          There are currently no active support programs available for applications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <GraduationCap className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-emerald-900 mb-1">Choose Your Support Program</h4>
            <p className="text-sm text-emerald-800">
              Please select the type of educational support you're applying for. Each program has 
              different requirements, benefits, and application processes.
            </p>
          </div>
        </div>
      </div>

      {/* Support Type Cards */}
      <div className="space-y-6">
        {/* Eligible Support Types */}
        {eligibleConfigs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Available Support Programs ({eligibleConfigs.length})
            </h3>
            <div className="grid gap-4">
              {eligibleConfigs.map((config) => {
                const Icon = getIconComponent(config.icon);
                const isSelected = selectedSupportType === config._id;
                
                // Get budget info for display
                const budgetInfo = config.amountConfig?.length > 0 ? config.amountConfig[0] : null;
                const minAmount = Math.min(...(config.amountConfig?.map((a: any) => a.minAmount) || [0]));
                const maxAmount = Math.max(...(config.amountConfig?.map((a: any) => a.maxAmount) || [0]));

                return (
                  <Card 
                    key={config._id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md h-full flex flex-col",
                      isSelected 
                        ? "ring-2 ring-emerald-500 bg-emerald-50 border-emerald-200" 
                        : "hover:border-gray-300"
                    )}
                    onClick={() => config.eligibility?.isEligible && onSupportTypeChange(config._id)}
                  >
                    {/* Existing card content */}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center",
                            config.color === "emerald" ? "bg-emerald-100 text-emerald-600" :
                            config.color === "blue" ? "bg-blue-100 text-blue-600" :
                            config.color === "purple" ? "bg-purple-100 text-purple-600" :
                            config.color === "orange" ? "bg-orange-100 text-orange-600" :
                            config.color === "red" ? "bg-red-100 text-red-600" :
                            config.color === "teal" ? "bg-teal-100 text-teal-600" :
                            "bg-gray-100 text-gray-600"
                          )}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{config.displayName}</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                            Eligible
                          </Badge>
                          {isSelected && (
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 flex-1 flex flex-col">
                      <div className="space-y-3 flex-1">
                        {/* Budget Information */}
                        {budgetInfo && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">
                              Support Range: {formatCurrency(minAmount, budgetInfo.currency)} - {formatCurrency(maxAmount, budgetInfo.currency)}
                            </span>
                          </div>
                        )}

                        {/* Processing Time */}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            Processing Time: {config.applicationSettings?.processingDays || 7} days
                          </span>
                        </div>

                        {/* Required Documents Count */}
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            Required Documents: {config.requiredDocuments?.filter((d: any) => d.isMandatory).length || 0}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Button - Always at bottom */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <Button 
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSupportTypeChange(config._id);
                          }}
                        >
                          {isSelected ? "Selected" : "Apply for This Support"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Ineligible Support Types */}
        {ineligibleConfigs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Requirements Not Met ({ineligibleConfigs.length})
            </h3>
            <div className="grid gap-4">
              {ineligibleConfigs.map((config) => {
                const Icon = getIconComponent(config.icon);
                const budgetInfo = config.amountConfig?.length > 0 ? config.amountConfig[0] : null;
                const minAmount = Math.min(...(config.amountConfig?.map((a: any) => a.minAmount) || [0]));
                const maxAmount = Math.max(...(config.amountConfig?.map((a: any) => a.maxAmount) || [0]));

                return (
                  <Card 
                    key={config._id}
                    className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 h-full flex flex-col hover:shadow-md transition-all duration-200"
                  >
                    {/* Progress Indicator */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-amber-200">
                      <div className="h-full bg-amber-400 w-0 animate-pulse" />
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600 relative">
                            <Icon className="w-6 h-6" />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                              <AlertCircle className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div>
                            <CardTitle className="text-lg text-amber-900">{config.displayName}</CardTitle>
                            <p className="text-sm text-amber-700 mt-1">{config.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-100">
                          Not Yet Eligible
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 flex-1 flex flex-col">
                      {/* Support Details */}
                      <div className="space-y-2 mb-3">
                        {budgetInfo && (
                          <div className="flex items-center gap-2 text-amber-700">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">
                              Support: {formatCurrency(minAmount, budgetInfo.currency)} - {formatCurrency(maxAmount, budgetInfo.currency)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-amber-700">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            Available when requirements are met
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 flex-1">
                        <p className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Requirements to Meet:
                        </p>
                        <ul className="text-sm text-amber-800 space-y-1.5">
                          {config.eligibility.reasons.map((reason: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                        {config.eligibility.requiredLevel && (
                          <div className="mt-3 pt-3 border-t border-amber-200">
                            <p className="text-xs text-amber-700">
                              You'll be eligible when you reach the required level
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked Support Types */}
        {lockedConfigs.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Locked - Complete Profile ({lockedConfigs.length})
            </h3>
            <div className="grid gap-4">
              {lockedConfigs.map((config) => {
                const Icon = getIconComponent(config.icon);
                const budgetInfo = config.amountConfig?.length > 0 ? config.amountConfig[0] : null;
                const minAmount = Math.min(...(config.amountConfig?.map((a: any) => a.minAmount) || [0]));
                const maxAmount = Math.max(...(config.amountConfig?.map((a: any) => a.maxAmount) || [0]));

                return (
                  <Card 
                    key={config._id}
                    className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 border-gray-300 h-full flex flex-col opacity-90 hover:opacity-100 transition-all duration-200"
                  >
                    {/* Locked Overlay Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)`
                      }} />
                    </div>
                    
                    <CardHeader className="pb-3 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-200 text-gray-500 relative">
                            <Icon className="w-6 h-6 opacity-50" />
                            <div className="absolute inset-0 rounded-lg bg-gray-900 bg-opacity-60 flex items-center justify-center">
                              <Lock className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div>
                            <CardTitle className="text-lg text-gray-700">{config.displayName}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">{config.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-100">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 flex-1 flex flex-col relative">
                      {/* Support Preview (Blurred) */}
                      <div className="space-y-2 mb-3 opacity-50 blur-[1px]">
                        {budgetInfo && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">
                              Support: {formatCurrency(minAmount, budgetInfo.currency)} - {formatCurrency(maxAmount, budgetInfo.currency)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            Unlock to see details
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 flex-1 flex flex-col">
                        <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                          <Lock className="w-4 h-4" />
                          Profile Requirements Missing:
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1.5 flex-1">
                          {config.eligibility.missingRequirements?.map((field: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <User className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <span>{field}</span>
                            </li>
                          ))}
                        </ul>
                        <Button 
                          size="sm" 
                          className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white w-full shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = "/dashboard";
                          }}
                        >
                          <User className="w-4 h-4 mr-2" />
                          Complete Profile to Unlock
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Selected Support Info */}
      {selectedSupportType && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Support Program Selected</h4>
              <p className="text-sm text-green-800">
                You've selected "{[...eligibleConfigs, ...ineligibleConfigs, ...lockedConfigs].find(c => c._id === selectedSupportType)?.displayName}". 
                The application form will adapt to this program's specific requirements.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}