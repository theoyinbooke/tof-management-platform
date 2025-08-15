"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  FileText, 
  Users, 
  DollarSign,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  AlertCircle,
  Upload,
  User
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PersonalInformationStep } from "@/components/application/personal-information-step";
import { EducationalBackgroundStep } from "@/components/application/educational-background-step";
import { GuardianInformationStep } from "@/components/application/guardian-information-step";
import { FinancialInformationStep } from "@/components/application/financial-information-step";
import { ApplicationEssaysStep } from "@/components/application/application-essays-step";
import { DocumentUploadStep } from "@/components/application/document-upload-step";
import { ApplicationReviewStep } from "@/components/application/application-review-step";

// Application form schema
const ApplicationSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"], { required_error: "Please select gender" }),
  phone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, "Please enter a valid Nigerian phone number").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  
  // Address Information
  address: z.object({
    street: z.string().min(5, "Please enter your full street address"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(1, "Please select your state"),
    country: z.string().default("Nigeria"),
    postalCode: z.string().optional(),
  }),
  
  // Guardian Information
  guardian: z.object({
    firstName: z.string().min(2, "Guardian first name is required"),
    lastName: z.string().min(2, "Guardian last name is required"),
    relationship: z.string().min(1, "Please specify relationship"),
    phone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, "Please enter a valid Nigerian phone number"),
    email: z.string().email("Please enter a valid email address").optional(),
    occupation: z.string().optional(),
  }),
  
  // Educational Background
  education: z.object({
    currentLevel: z.string().min(1, "Please select your current academic level"),
    currentSchool: z.string().min(2, "Current school name is required"),
    hasRepeatedClass: z.boolean().default(false),
    specialNeeds: z.string().optional(),
  }),
  
  // Financial Information
  financial: z.object({
    familyIncome: z.enum(["below_50k", "50k_100k", "100k_200k", "above_200k"]).optional(),
    hasOtherSupport: z.boolean().default(false),
  }),
  
  // Application Essays
  essays: z.object({
    personalStatement: z.string().min(100, "Personal statement must be at least 100 characters"),
    educationalGoals: z.string().min(100, "Educational goals must be at least 100 characters"),
    whyApplying: z.string().min(100, "Please explain why you're applying (at least 100 characters)"),
    additionalInfo: z.string().optional(),
  }),

  // Documents (stored as JSON string from the component)
  documents: z.string().optional(),
  
  // Terms and Conditions  
  agreedToTerms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  agreedToPrivacy: z.boolean().refine(val => val === true, "You must agree to the privacy policy"),
});

type ApplicationFormData = z.infer<typeof ApplicationSchema>;

const steps = [
  { id: 1, title: "Personal Information", icon: Users, description: "Basic personal details" },
  { id: 2, title: "Educational Background", icon: GraduationCap, description: "Academic information" },
  { id: 3, title: "Guardian Information", icon: Users, description: "Parent/guardian details" },
  { id: 4, title: "Financial Information", icon: DollarSign, description: "Family financial details" },
  { id: 5, title: "Application Essays", icon: FileText, description: "Personal statements" },
  { id: 6, title: "Document Upload", icon: Upload, description: "Upload required documents" },
  { id: 7, title: "Review & Submit", icon: CheckCircle, description: "Review and submit application" },
];

export default function ApplicationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState<string>("");
  const { user } = useCurrentUser();

  // Get the first active foundation (for demo purposes)
  const foundations = useQuery(api.foundations.getAll);
  const defaultFoundation = foundations?.[0];
  
  // Check if user can submit applications
  const applicationEligibility = useQuery(
    api.users.canSubmitApplications,
    user ? { userId: user._id } : "skip"
  );

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(ApplicationSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      middleName: user?.profile?.middleName || "",
      dateOfBirth: user?.profile?.dateOfBirth || "",
      gender: user?.profile?.gender || undefined,
      phone: user?.phone || "",
      email: user?.email || "",
      address: {
        street: user?.profile?.address?.street || "",
        city: user?.profile?.address?.city || "",
        state: user?.profile?.address?.state || "",
        country: user?.profile?.address?.country || "Nigeria",
        postalCode: user?.profile?.address?.postalCode || "",
      },
      guardian: {
        firstName: "",
        lastName: "",
        relationship: "",
        phone: "",
        email: "",
        occupation: "",
      },
      education: {
        currentLevel: user?.profile?.beneficiaryInfo?.currentLevel || "",
        currentSchool: user?.profile?.beneficiaryInfo?.currentSchool || "",
        hasRepeatedClass: user?.profile?.beneficiaryInfo?.hasRepeatedClass || false,
        specialNeeds: user?.profile?.beneficiaryInfo?.specialNeeds || "",
      },
      financial: {
        familyIncome: undefined,
        hasOtherSupport: false,
      },
      essays: {
        personalStatement: "",
        educationalGoals: "",
        whyApplying: "",
        additionalInfo: "",
      },
      acceptTerms: false,
    },
  });

  const submitApplication = useMutation(api.applications.submit);

  const progress = (currentStep / steps.length) * 100;

  const validateCurrentStep = async () => {
    const values = form.getValues();
    
    switch (currentStep) {
      case 1:
        return await form.trigger(["firstName", "lastName", "dateOfBirth", "gender", "phone", "email", "address"]);
      case 2:
        return await form.trigger(["education"]);
      case 3:
        return await form.trigger(["guardian"]);
      case 4:
        return await form.trigger(["financial"]);
      case 5:
        return await form.trigger(["essays"]);
      case 6:
        return await form.trigger(["acceptTerms"]);
      default:
        return true;
    }
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: ApplicationFormData) => {
    if (!defaultFoundation) {
      toast.error("No foundation available for applications");
      return;
    }

    // Final check before submission
    if (!applicationEligibility?.canSubmit) {
      toast.error(applicationEligibility?.reason || "Cannot submit application");
      return;
    }

    setIsSubmitting(true);
    try {
      const applicationId = await submitApplication({
        foundationId: defaultFoundation._id,
        ...data,
      });

      // Generate application number for display
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const appNumber = `TOF-${year}-${random}`;
      
      setApplicationNumber(appNumber);
      setSubmissionComplete(true);
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl text-green-800">Application Submitted Successfully!</CardTitle>
            <CardDescription className="text-lg">
              Your scholarship application has been received and is under review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Application Number</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{applicationNumber}</p>
              <p className="text-sm text-green-700 mt-1">
                Please save this number for your records. You'll need it to check your application status.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div>
                    <p className="font-medium">Application Review</p>
                    <p className="text-sm text-gray-600">Our team will review your application and documents within 2-3 weeks.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div>
                    <p className="font-medium">Notification</p>
                    <p className="text-sm text-gray-600">You'll receive an email notification about the decision.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <div>
                    <p className="font-medium">Next Steps</p>
                    <p className="text-sm text-gray-600">If approved, you'll receive information about the next steps in the process.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.location.href = "/"}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Return to Homepage
              </Button>
              <Button 
                className="flex-1"
                onClick={() => window.print()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Print Confirmation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!foundations || !applicationEligibility) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application form...</p>
        </div>
      </div>
    );
  }

  // Block access if user cannot submit applications
  if (!applicationEligibility.canSubmit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl text-red-800">Application Access Restricted</CardTitle>
            <CardDescription className="text-lg">
              {applicationEligibility.reason}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {applicationEligibility.actionRequired === "complete_profile" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-amber-600" />
                  <div>
                    <h4 className="font-semibold text-amber-800">Profile Setup Required</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Complete your profile setup to access the application system. Your profile information 
                      will be automatically used to populate application forms.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1"
                onClick={() => window.location.href = "/dashboard"}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
              {applicationEligibility.actionRequired === "complete_profile" && (
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.href = "/apply-new"}
                >
                  <User className="w-4 h-4 mr-2" />
                  Complete Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Scholarship Application</h1>
              <p className="text-gray-600">TheOyinbooke Foundation Educational Support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep} of {steps.length}
              </span>
              <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : isCompleted
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">{step.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5" })}
                  {steps[currentStep - 1].title}
                </CardTitle>
                <CardDescription>
                  {steps[currentStep - 1].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentStep === 1 && <PersonalInformationStep form={form} />}
                {currentStep === 2 && <EducationalBackgroundStep form={form} />}
                {currentStep === 3 && <GuardianInformationStep form={form} />}
                {currentStep === 4 && <FinancialInformationStep form={form} />}
                {currentStep === 5 && <ApplicationEssaysStep form={form} />}
                {currentStep === 6 && <DocumentUploadStep form={form} />}
                {currentStep === 7 && <ApplicationReviewStep form={form} onEdit={setCurrentStep} />}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}