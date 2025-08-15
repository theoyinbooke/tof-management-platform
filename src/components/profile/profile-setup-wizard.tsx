"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, 
  MapPin, 
  GraduationCap, 
  Users, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  Calendar,
  Phone,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { validateNigerianPhone } from "@/lib/profile-utils";

// Nigerian states for the address form
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa", 
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", 
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
];

// Academic levels
const ACADEMIC_LEVELS = [
  { value: "nursery-1", label: "Nursery 1" },
  { value: "nursery-2", label: "Nursery 2" },
  { value: "primary-1", label: "Primary 1" },
  { value: "primary-2", label: "Primary 2" },
  { value: "primary-3", label: "Primary 3" },
  { value: "primary-4", label: "Primary 4" },
  { value: "primary-5", label: "Primary 5" },
  { value: "primary-6", label: "Primary 6" },
  { value: "jss-1", label: "JSS 1" },
  { value: "jss-2", label: "JSS 2" },
  { value: "jss-3", label: "JSS 3" },
  { value: "sss-1", label: "SSS 1" },
  { value: "sss-2", label: "SSS 2" },
  { value: "sss-3", label: "SSS 3" },
  { value: "university-year-1", label: "University Year 1" },
  { value: "university-year-2", label: "University Year 2" },
  { value: "university-year-3", label: "University Year 3" },
  { value: "university-year-4", label: "University Year 4" },
  { value: "university-year-5", label: "University Year 5" },
];

// Profile setup schema
const ProfileSetupSchema = z.object({
  // Basic Information
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"], { message: "Please select gender" }),
  phone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, "Please enter a valid Nigerian phone number"),
  
  // Address Information
  address: z.object({
    street: z.string().min(5, "Please enter your full street address"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(1, "Please select your state"),
    country: z.string().optional().default("Nigeria"),
    postalCode: z.string().optional(),
  }),
  
  // Beneficiary-specific fields (conditional)
  beneficiaryInfo: z.object({
    currentLevel: z.string().min(1, "Please select your current academic level"),
    currentSchool: z.string().min(2, "Current school name is required"),
    hasRepeatedClass: z.boolean().default(false),
    specialNeeds: z.string().optional(),
    emergencyContact: z.object({
      name: z.string().min(2, "Emergency contact name is required"),
      relationship: z.string().min(1, "Please specify relationship"),
      phone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, "Please enter a valid Nigerian phone number"),
    }),
  }).optional(),
  
  // Guardian-specific fields (conditional)
  guardianInfo: z.object({
    occupation: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
});

type ProfileSetupData = z.infer<typeof ProfileSetupSchema>;

interface ProfileSetupWizardProps {
  userId: Id<"users">;
  userRole: "beneficiary" | "guardian" | "admin" | "reviewer" | "super_admin";
  userName: string;
  onComplete: () => void;
}

const steps = [
  { id: 1, title: "Basic Information", icon: User, description: "Personal details" },
  { id: 2, title: "Contact & Address", icon: MapPin, description: "Contact information" },
  { id: 3, title: "Role-Specific Info", icon: GraduationCap, description: "Additional details" },
  { id: 4, title: "Review & Complete", icon: CheckCircle, description: "Confirm and submit" },
];

export function ProfileSetupWizard({ userId, userRole, userName, onComplete }: ProfileSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const completeProfileSetup = useMutation(api.users.completeProfileSetup);

  const form = useForm<ProfileSetupData>({
    resolver: zodResolver(ProfileSetupSchema),
    mode: "onChange",
    defaultValues: {
      middleName: "",
      dateOfBirth: "",
      gender: undefined,
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        country: "Nigeria",
        postalCode: "",
      },
      beneficiaryInfo: userRole === "beneficiary" ? {
        currentLevel: "",
        currentSchool: "",
        hasRepeatedClass: false,
        specialNeeds: "",
        emergencyContact: {
          name: "",
          relationship: "",
          phone: "",
        },
      } : undefined,
      guardianInfo: userRole === "guardian" ? {
        occupation: "",
        relationship: "",
      } : undefined,
    },
  });

  const progress = (currentStep / steps.length) * 100;

  const validateCurrentStep = async () => {
    switch (currentStep) {
      case 1:
        return await form.trigger(["dateOfBirth", "gender"]);
      case 2:
        return await form.trigger(["phone", "address"]);
      case 3:
        if (userRole === "beneficiary") {
          return await form.trigger(["beneficiaryInfo"]);
        }
        if (userRole === "guardian") {
          return await form.trigger(["guardianInfo"]);
        }
        return true;
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

  const onSubmit = async (data: ProfileSetupData) => {
    setIsSubmitting(true);
    try {
      const { phone, ...profileData } = data;
      await completeProfileSetup({
        userId,
        phone: phone,
        profile: profileData,
      });
      
      toast.success("Profile setup completed successfully!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete profile setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-gray-600 mt-2">
            Welcome {userName}! Let's set up your profile to get started.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 mb-6" />
          
          <div className="grid grid-cols-4 gap-2">
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
              <CardContent className="space-y-6">
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Middle Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your middle name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Contact & Address */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 08012345678 or +2348012345678" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address.street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full street address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter city" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {NIGERIAN_STATES.map((state) => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="address.postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter postal code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Role-Specific Information */}
                {currentStep === 3 && userRole === "beneficiary" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="beneficiaryInfo.currentLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Academic Level *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your current academic level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ACADEMIC_LEVELS.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="beneficiaryInfo.currentSchool"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current School *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your current school name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="beneficiaryInfo.hasRepeatedClass"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I have repeated a class before
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="beneficiaryInfo.specialNeeds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Needs (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe any special needs or accommodations required"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Emergency Contact</h4>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="beneficiaryInfo.emergencyContact.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Contact Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Full name of emergency contact" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="beneficiaryInfo.emergencyContact.relationship"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Relationship *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Parent, Guardian, Sibling" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="beneficiaryInfo.emergencyContact.phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Emergency Contact Phone *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 08012345678" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && userRole === "guardian" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Guardian Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="guardianInfo.occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Occupation (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your occupation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="guardianInfo.relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship to Beneficiary (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Parent, Guardian, Relative" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 3 && !["beneficiary", "guardian"].includes(userRole) && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">Almost Done!</h3>
                    <p className="text-gray-600">
                      No additional information required for your role. Please review and complete your profile.
                    </p>
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Review Your Information</h3>
                    
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-700">Basic Information</h4>
                        <p className="text-sm text-gray-600">
                          {form.watch("middleName") && `${form.watch("middleName")} • `}
                          Born: {form.watch("dateOfBirth")} • 
                          Gender: {form.watch("gender")}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-700">Contact Information</h4>
                        <p className="text-sm text-gray-600">
                          {form.watch("phone")} • {form.watch("address.street")}, {form.watch("address.city")}, {form.watch("address.state")}
                        </p>
                      </div>
                      
                      {userRole === "beneficiary" && (
                        <div>
                          <h4 className="font-semibold text-gray-700">Academic Information</h4>
                          <p className="text-sm text-gray-600">
                            {ACADEMIC_LEVELS.find(l => l.value === form.watch("beneficiaryInfo.currentLevel"))?.label} at {form.watch("beneficiaryInfo.currentSchool")}
                          </p>
                          <p className="text-sm text-gray-600">
                            Emergency Contact: {form.watch("beneficiaryInfo.emergencyContact.name")} ({form.watch("beneficiaryInfo.emergencyContact.relationship")})
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-emerald-800">Ready to Complete</h4>
                          <p className="text-sm text-emerald-700">
                            Your profile information looks good! Click "Complete Profile" to finish the setup process.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                  {isSubmitting ? "Completing..." : "Complete Profile"}
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