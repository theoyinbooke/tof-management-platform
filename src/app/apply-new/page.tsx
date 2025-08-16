"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProfileCompletionBanner } from "@/components/profile/profile-completion-banner";
import { ProfileSetupWizard } from "@/components/profile/profile-setup-wizard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { 
  GraduationCap, 
  DollarSign, 
  BookOpen, 
  ShirtIcon as Uniform,
  Bus,
  Utensils,
  FileText,
  AlertCircle,
  CheckCircle,
  Lock,
  ArrowRight,
  Loader2,
  Calendar,
  Info
} from "lucide-react";
import { toast } from "sonner";
import * as Icons from "lucide-react";

// Icon mapping for dynamic icons
const getIconComponent = (iconName?: string) => {
  if (!iconName) return FileText;
  
  const iconMap: Record<string, any> = {
    GraduationCap,
    DollarSign,
    BookOpen,
    FileText,
    AlertCircle,
    Bus,
    Utensils,
    Uniform,
  };
  
  return iconMap[iconName] || FileText;
};

// Frequency display mapping
const getFrequencyDisplay = (frequency: string) => {
  const frequencyMap: Record<string, string> = {
    once: "One-time",
    termly: "Every Term",
    monthly: "Monthly",
    yearly: "Yearly",
    per_semester: "Per Semester",
  };
  
  return frequencyMap[frequency] || frequency;
};

export default function NewApplicationPage() {
  const { user } = useCurrentUser();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [selectedApplicationType, setSelectedApplicationType] = useState<string | null>(null);
  const [initializingSupport, setInitializingSupport] = useState(false);
  
  // Check profile completion
  const profileCompletion = useQuery(
    api.users.checkProfileCompletion,
    user ? { userId: user._id } : "skip"
  );
  
  // Get eligible support configurations
  const supportConfigs = useQuery(
    api.supportConfig.getEligibleSupports,
    user ? { userId: user._id, foundationId: user.foundationId! } : "skip"
  );
  
  // Initialize support configs if none exist
  const initializeSupport = useMutation(api.supportConfig.initializeDefaultConfigs);

  // If showing profile setup wizard
  if (showProfileSetup && user) {
    return (
      <ProfileSetupWizard
        userId={user._id}
        userRole={user.role}
        userName={`${user.firstName} ${user.lastName}`}
        onComplete={() => setShowProfileSetup(false)}
      />
    );
  }

  const handleStartApplication = (supportType: string) => {
    if (!profileCompletion?.isComplete) {
      toast.error("Please complete your profile before applying");
      setShowProfileSetup(true);
      return;
    }
    
    // Navigate to application form with selected type
    toast.success(`Starting ${supportType} application`);
    setSelectedApplicationType(supportType);
    // TODO: Navigate to actual application form
  };
  
  const handleInitializeSupport = async () => {
    if (!user?.foundationId) return;
    
    setInitializingSupport(true);
    try {
      await initializeSupport({ foundationId: user.foundationId });
      toast.success("Support configurations initialized successfully");
    } catch (error) {
      toast.error("Failed to initialize support configurations");
      console.error(error);
    } finally {
      setInitializingSupport(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only allow beneficiaries to access this page
  if (user.role !== "beneficiary") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Applications are only available for beneficiaries. Please contact an administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Start New Application</h1>
              <p className="text-gray-600">Choose the type of support you need</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Profile Completion Banner */}
        <ProfileCompletionBanner onSetupProfile={() => setShowProfileSetup(true)} />

        {/* Profile Incomplete Warning */}
        {!profileCompletion?.isComplete && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Profile Required:</strong> You must complete your profile before submitting any applications. 
              All your personal, academic, and contact information will be automatically used in your applications.
            </AlertDescription>
          </Alert>
        )}

        {/* Application Types Grid */}
        {supportConfigs === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : supportConfigs && supportConfigs.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Support Configurations Available
              </h3>
              <p className="text-gray-600 text-center mb-6">
                {user?.role === "admin" || user?.role === "super_admin" 
                  ? "Initialize support configurations to get started."
                  : "No support types are currently available. Please contact an administrator."}
              </p>
              {(user?.role === "admin" || user?.role === "super_admin") && (
                <Button 
                  onClick={handleInitializeSupport}
                  disabled={initializingSupport}
                >
                  {initializingSupport ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    "Initialize Default Configurations"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supportConfigs?.map((config) => {
              const Icon = getIconComponent(config.icon);
              const isDisabled = !profileCompletion?.isComplete;
              const estimatedAmount = config.estimatedAmount;
              
              return (
                <Card 
                  key={config._id}
                  className={`transition-all duration-200 ${
                    isDisabled 
                      ? "opacity-60 cursor-not-allowed" 
                      : "cursor-pointer hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1"
                  }`}
                  onClick={() => !isDisabled && handleStartApplication(config.supportType)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        config.color === "emerald" ? "bg-emerald-100 text-emerald-600" :
                        config.color === "blue" ? "bg-blue-100 text-blue-600" :
                        config.color === "purple" ? "bg-purple-100 text-purple-600" :
                        config.color === "orange" ? "bg-orange-100 text-orange-600" :
                        config.color === "red" ? "bg-red-100 text-red-600" :
                        config.color === "teal" ? "bg-teal-100 text-teal-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      {isDisabled && (
                        <Lock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    
                    <CardTitle className="text-lg">{config.displayName}</CardTitle>
                    <CardDescription className="text-sm">
                      {config.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Amount and Frequency */}
                    <div className="space-y-2">
                      {estimatedAmount && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Amount Range:</span>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(estimatedAmount.min, estimatedAmount.currency)} - 
                              {formatCurrency(estimatedAmount.max, estimatedAmount.currency)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Frequency:</span>
                            <Badge variant="outline" className="text-xs">
                              {getFrequencyDisplay(estimatedAmount.frequency)}
                            </Badge>
                          </div>
                        </>
                      )}
                      {config.applicationSettings.applicationDeadline && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Deadline:</span>
                          <span className="text-xs text-gray-700">
                            {config.applicationSettings.applicationDeadline}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Requirements */}
                    {config.requiredDocuments.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Required Documents:</p>
                        <ul className="space-y-1">
                          {config.requiredDocuments
                            .filter(doc => doc.isMandatory)
                            .slice(0, 2)
                            .map((doc, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                {doc.displayName}
                              </li>
                            ))}
                          {config.requiredDocuments.filter(doc => doc.isMandatory).length > 2 && (
                            <li className="text-xs text-gray-500">
                              +{config.requiredDocuments.filter(doc => doc.isMandatory).length - 2} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {/* Processing Time */}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      Processing time: {config.applicationSettings.processingDays} days
                    </div>
                    
                    {/* Action Button */}
                    <Button 
                      className="w-full mt-4" 
                      disabled={isDisabled}
                      variant={isDisabled ? "secondary" : "default"}
                    >
                      {isDisabled ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Complete Profile First
                        </>
                      ) : (
                        <>
                          Start Application
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Need Help Choosing?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Application Tips</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    You can submit multiple applications for different types of support
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Your profile information will be automatically filled in each application
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Emergency support applications are reviewed within 24-48 hours
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Support Guidelines</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Support amounts are calculated based on your academic level and school type
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Monthly allowances are paid directly to verified accounts
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Academic performance affects approval and renewal decisions
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-semibold text-emerald-800">Academic Excellence Bonus</h5>
                  <p className="text-sm text-emerald-700 mt-1">
                    Students with outstanding academic performance (85%+ average) may receive additional support
                    and priority consideration for special programs and opportunities.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}