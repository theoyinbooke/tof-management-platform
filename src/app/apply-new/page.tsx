"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProfileCompletionBanner } from "@/components/profile/profile-completion-banner";
import { ProfileSetupWizard } from "@/components/profile/profile-setup-wizard";
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
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

// Application types available
const APPLICATION_TYPES = [
  {
    id: "school-fees",
    title: "School Fees Support",
    description: "Apply for tuition fee assistance for the current academic term",
    icon: GraduationCap,
    color: "emerald",
    estimatedAmount: "₦50,000 - ₦200,000",
    deadline: "Every Term",
    requirements: ["Current report card", "School fee invoice", "Bank statement"],
  },
  {
    id: "upkeep-allowance",
    title: "Upkeep Allowance",
    description: "Monthly allowance for books, transportation, and school supplies",
    icon: DollarSign,
    color: "blue",
    estimatedAmount: "₦15,000 - ₦25,000/month",
    deadline: "Monthly",
    requirements: ["Expense budget", "Receipt of previous purchases", "Academic performance record"],
  },
  {
    id: "books-materials",
    title: "Books & Materials",
    description: "Support for textbooks, uniforms, and essential learning materials",
    icon: BookOpen,
    color: "purple",
    estimatedAmount: "₦20,000 - ₦40,000",
    deadline: "Beginning of Term",
    requirements: ["Book list from school", "Uniform requirements", "Store quotations"],
  },
  {
    id: "exam-fees",
    title: "Examination Fees",
    description: "Support for WAEC, JAMB, Post-UTME and other examination fees",
    icon: FileText,
    color: "orange",
    estimatedAmount: "₦10,000 - ₦30,000",
    deadline: "Before Registration",
    requirements: ["Exam registration form", "Academic transcript", "Payment receipt"],
  },
  {
    id: "emergency-support",
    title: "Emergency Support",
    description: "Urgent financial assistance for unexpected educational expenses",
    icon: AlertCircle,
    color: "red",
    estimatedAmount: "₦5,000 - ₦50,000",
    deadline: "Anytime",
    requirements: ["Emergency description", "Supporting documents", "Guardian endorsement"],
  },
  {
    id: "transportation",
    title: "Transportation Support",
    description: "Daily transport allowance or shuttle service for school commute",
    icon: Bus,
    color: "teal",
    estimatedAmount: "₦8,000 - ₦15,000/month",
    deadline: "Monthly",
    requirements: ["School location details", "Transport cost breakdown", "Attendance record"],
  },
];

export default function NewApplicationPage() {
  const { user } = useCurrentUser();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [selectedApplicationType, setSelectedApplicationType] = useState<string | null>(null);
  
  // Check profile completion
  const profileCompletion = useQuery(
    api.users.checkProfileCompletion,
    user ? { userId: user._id } : "skip"
  );

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

  const handleStartApplication = (applicationType: string) => {
    if (!profileCompletion?.isComplete) {
      toast.error("Please complete your profile before starting an application");
      return;
    }
    
    setSelectedApplicationType(applicationType);
    // TODO: Navigate to application form with pre-filled data
    console.log("Starting application for:", applicationType);
    toast.success(`Starting ${APPLICATION_TYPES.find(t => t.id === applicationType)?.title} application`);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {APPLICATION_TYPES.map((applicationType) => {
            const Icon = applicationType.icon;
            const isDisabled = !profileCompletion?.isComplete;
            
            return (
              <Card 
                key={applicationType.id}
                className={`transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                  isDisabled 
                    ? "opacity-60 cursor-not-allowed" 
                    : "cursor-pointer hover:border-emerald-200"
                }`}
                onClick={() => !isDisabled && handleStartApplication(applicationType.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      applicationType.color === "emerald" ? "bg-emerald-100 text-emerald-600" :
                      applicationType.color === "blue" ? "bg-blue-100 text-blue-600" :
                      applicationType.color === "purple" ? "bg-purple-100 text-purple-600" :
                      applicationType.color === "orange" ? "bg-orange-100 text-orange-600" :
                      applicationType.color === "red" ? "bg-red-100 text-red-600" :
                      applicationType.color === "teal" ? "bg-teal-100 text-teal-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    {isDisabled && (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  <CardTitle className="text-lg">{applicationType.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {applicationType.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Amount and Deadline */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Estimated Amount:</span>
                      <span className="font-semibold text-gray-900">{applicationType.estimatedAmount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Application Deadline:</span>
                      <Badge variant="outline" className="text-xs">
                        {applicationType.deadline}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Requirements */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Required Documents:</p>
                    <ul className="space-y-1">
                      {applicationType.requirements.slice(0, 2).map((requirement, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          {requirement}
                        </li>
                      ))}
                      {applicationType.requirements.length > 2 && (
                        <li className="text-xs text-gray-500">
                          +{applicationType.requirements.length - 2} more requirements
                        </li>
                      )}
                    </ul>
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
                    School fees support covers up to 80% of tuition costs
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