"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Send, 
  User, 
  Phone, 
  GraduationCap, 
  Users, 
  Wallet,
  FileText,
  CheckCircle2
} from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { nigerianStates, localGovernmentAreas } from "@/lib/nigeria-data";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Contact", icon: Phone },
  { id: 3, title: "Academic", icon: GraduationCap },
  { id: 4, title: "Guardian", icon: Users },
  { id: 5, title: "Financial", icon: Wallet },
  { id: 6, title: "Additional", icon: FileText },
  { id: 7, title: "Review", icon: CheckCircle2 },
];

export default function ApplicationFormPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const submitApplication = useMutation(api.applications.submit);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    middleName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "Nigerian",
    stateOfOrigin: "",
    localGovernmentArea: "",
    
    // Contact Information
    phoneNumber: "",
    email: "",
    homeAddress: "",
    city: "",
    state: "",
    postalCode: "",
    
    // Academic Information
    currentAcademicLevel: "",
    schoolName: "",
    schoolAddress: "",
    currentClass: "",
    expectedGraduationYear: new Date().getFullYear() + 1,
    academicPerformance: "",
    
    // Guardian Information
    guardianName: "",
    guardianRelationship: "",
    guardianOccupation: "",
    guardianPhoneNumber: "",
    guardianEmail: "",
    guardianAddress: "",
    guardianMonthlyIncome: "",
    
    // Financial Information
    householdSize: 1,
    numberOfSiblings: 0,
    siblingsInSchool: 0,
    financialNeed: "",
    reasonForApplication: "",
    
    // Additional Information
    specialNeeds: "",
    achievements: "",
    extracurricularActivities: "",
    
    // Essays
    personalStatement: "",
    educationalGoals: "",
    whyApplying: "",
    additionalInfo: "",
    
    // Declaration
    declarationAccepted: false,
    parentConsentGiven: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1: // Personal Info
        if (!formData.firstName) newErrors.firstName = "First name is required";
        if (!formData.lastName) newErrors.lastName = "Last name is required";
        if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
        if (!formData.gender) newErrors.gender = "Gender is required";
        if (!formData.stateOfOrigin) newErrors.stateOfOrigin = "State of origin is required";
        if (!formData.localGovernmentArea) newErrors.localGovernmentArea = "LGA is required";
        break;
        
      case 2: // Contact
        if (!formData.phoneNumber) newErrors.phoneNumber = "Phone number is required";
        if (!formData.email) newErrors.email = "Email is required";
        if (!formData.homeAddress) newErrors.homeAddress = "Home address is required";
        if (!formData.city) newErrors.city = "City is required";
        if (!formData.state) newErrors.state = "State is required";
        break;
        
      case 3: // Academic
        if (!formData.currentAcademicLevel) newErrors.currentAcademicLevel = "Academic level is required";
        if (!formData.schoolName) newErrors.schoolName = "School name is required";
        if (!formData.schoolAddress) newErrors.schoolAddress = "School address is required";
        if (!formData.currentClass) newErrors.currentClass = "Current class is required";
        if (!formData.academicPerformance) newErrors.academicPerformance = "Academic performance is required";
        break;
        
      case 4: // Guardian
        if (!formData.guardianName) newErrors.guardianName = "Guardian name is required";
        if (!formData.guardianRelationship) newErrors.guardianRelationship = "Relationship is required";
        if (!formData.guardianOccupation) newErrors.guardianOccupation = "Occupation is required";
        if (!formData.guardianPhoneNumber) newErrors.guardianPhoneNumber = "Guardian phone is required";
        if (!formData.guardianAddress) newErrors.guardianAddress = "Guardian address is required";
        break;
        
      case 5: // Financial
        if (!formData.financialNeed) newErrors.financialNeed = "Financial need level is required";
        if (!formData.reasonForApplication) newErrors.reasonForApplication = "Reason for application is required";
        if (formData.reasonForApplication.length < 50) {
          newErrors.reasonForApplication = "Please provide at least 50 characters";
        }
        if (!formData.personalStatement) newErrors.personalStatement = "Personal statement is required";
        if (!formData.educationalGoals) newErrors.educationalGoals = "Educational goals are required";
        if (!formData.whyApplying) newErrors.whyApplying = "Why applying section is required";
        break;
        
      case 7: // Review & Declaration
        if (!formData.declarationAccepted) newErrors.declarationAccepted = "You must accept the declaration";
        if (!formData.parentConsentGiven) newErrors.parentConsentGiven = "Parent consent is required";
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };
  
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    if (!user?.foundationId) {
      toast.error("No foundation selected");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await submitApplication({
        foundationId: user.foundationId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phoneNumber,
        email: formData.email,
        address: {
          street: formData.homeAddress,
          city: formData.city,
          state: formData.state,
          country: "Nigeria",
          postalCode: formData.postalCode
        },
        guardian: {
          firstName: formData.guardianName.split(' ')[0] || "",
          lastName: formData.guardianName.split(' ').slice(1).join(' ') || "",
          relationship: formData.guardianRelationship,
          phone: formData.guardianPhoneNumber,
          email: formData.guardianEmail,
          occupation: formData.guardianOccupation
        },
        education: {
          currentLevel: formData.currentAcademicLevel,
          currentSchool: formData.schoolName,
          hasRepeatedClass: false,
          specialNeeds: formData.specialNeeds
        },
        financial: {
          familyIncome: formData.financialNeed === "critical" ? "below_50k" : 
                        formData.financialNeed === "high" ? "50k_100k" :
                        formData.financialNeed === "moderate" ? "100k_200k" : "above_200k",
          hasOtherSupport: false
        },
        essays: {
          personalStatement: formData.personalStatement || formData.reasonForApplication.slice(0, 500),
          educationalGoals: formData.educationalGoals || formData.achievements || "Pursuing educational excellence",
          whyApplying: formData.whyApplying || formData.reasonForApplication,
          additionalInfo: formData.additionalInfo || formData.extracurricularActivities
        },
        acceptTerms: formData.declarationAccepted && formData.parentConsentGiven
      });
      
      toast.success("Application submitted successfully!");
      router.push("/beneficiary/applications");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Personal Information
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => updateField("middleName", e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateField("dateOfBirth", e.target.value)}
                  className={errors.dateOfBirth ? "border-red-500" : ""}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>
                )}
              </div>
              
              <div>
                <Label>Gender *</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => updateField("gender", value)}
                >
                  <div className="flex space-x-4 mt-2">
                    <div className="flex items-center">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="ml-2 cursor-pointer">Male</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="ml-2 cursor-pointer">Female</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="ml-2 cursor-pointer">Other</Label>
                    </div>
                  </div>
                </RadioGroup>
                {errors.gender && (
                  <p className="text-sm text-red-500 mt-1">{errors.gender}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nationality">Nationality *</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => updateField("nationality", e.target.value)}
                  disabled
                />
              </div>
              
              <div>
                <Label htmlFor="stateOfOrigin">State of Origin *</Label>
                <Select
                  value={formData.stateOfOrigin}
                  onValueChange={(value) => {
                    updateField("stateOfOrigin", value);
                    updateField("localGovernmentArea", ""); // Reset LGA
                  }}
                >
                  <SelectTrigger className={errors.stateOfOrigin ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {nigerianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stateOfOrigin && (
                  <p className="text-sm text-red-500 mt-1">{errors.stateOfOrigin}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="localGovernmentArea">Local Government Area *</Label>
                <Select
                  value={formData.localGovernmentArea}
                  onValueChange={(value) => updateField("localGovernmentArea", value)}
                  disabled={!formData.stateOfOrigin}
                >
                  <SelectTrigger className={errors.localGovernmentArea ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select LGA" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.stateOfOrigin &&
                      localGovernmentAreas[formData.stateOfOrigin]?.map((lga) => (
                        <SelectItem key={lga} value={lga}>
                          {lga}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.localGovernmentArea && (
                  <p className="text-sm text-red-500 mt-1">{errors.localGovernmentArea}</p>
                )}
              </div>
            </div>
          </div>
        );
        
      case 2: // Contact Information
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+234 801 234 5678"
                  value={formData.phoneNumber}
                  onChange={(e) => updateField("phoneNumber", e.target.value)}
                  className={errors.phoneNumber ? "border-red-500" : ""}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="homeAddress">Home Address *</Label>
              <Textarea
                id="homeAddress"
                placeholder="Enter your full home address"
                value={formData.homeAddress}
                onChange={(e) => updateField("homeAddress", e.target.value)}
                className={cn("min-h-[80px]", errors.homeAddress ? "border-red-500" : "")}
              />
              {errors.homeAddress && (
                <p className="text-sm text-red-500 mt-1">{errors.homeAddress}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && (
                  <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="state">State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => updateField("state", value)}
                >
                  <SelectTrigger className={errors.state ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {nigerianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-sm text-red-500 mt-1">{errors.state}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                />
              </div>
            </div>
          </div>
        );
        
      case 3: // Academic Information
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Current Academic Level *</Label>
                <RadioGroup
                  value={formData.currentAcademicLevel}
                  onValueChange={(value) => updateField("currentAcademicLevel", value)}
                >
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center">
                      <RadioGroupItem value="nursery" id="nursery" />
                      <Label htmlFor="nursery" className="ml-2 cursor-pointer">Nursery</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="primary" id="primary" />
                      <Label htmlFor="primary" className="ml-2 cursor-pointer">Primary</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="secondary" id="secondary" />
                      <Label htmlFor="secondary" className="ml-2 cursor-pointer">Secondary</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="university" id="university" />
                      <Label htmlFor="university" className="ml-2 cursor-pointer">University/Higher Institution</Label>
                    </div>
                  </div>
                </RadioGroup>
                {errors.currentAcademicLevel && (
                  <p className="text-sm text-red-500 mt-1">{errors.currentAcademicLevel}</p>
                )}
              </div>
              
              <div>
                <Label>Academic Performance *</Label>
                <RadioGroup
                  value={formData.academicPerformance}
                  onValueChange={(value) => updateField("academicPerformance", value)}
                >
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center">
                      <RadioGroupItem value="excellent" id="excellent" />
                      <Label htmlFor="excellent" className="ml-2 cursor-pointer">Excellent (90-100%)</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="very_good" id="very_good" />
                      <Label htmlFor="very_good" className="ml-2 cursor-pointer">Very Good (75-89%)</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="good" id="good" />
                      <Label htmlFor="good" className="ml-2 cursor-pointer">Good (60-74%)</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="average" id="average" />
                      <Label htmlFor="average" className="ml-2 cursor-pointer">Average (50-59%)</Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="below_average" id="below_average" />
                      <Label htmlFor="below_average" className="ml-2 cursor-pointer">Below Average (&lt;50%)</Label>
                    </div>
                  </div>
                </RadioGroup>
                {errors.academicPerformance && (
                  <p className="text-sm text-red-500 mt-1">{errors.academicPerformance}</p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="schoolName">School Name *</Label>
              <Input
                id="schoolName"
                value={formData.schoolName}
                onChange={(e) => updateField("schoolName", e.target.value)}
                className={errors.schoolName ? "border-red-500" : ""}
              />
              {errors.schoolName && (
                <p className="text-sm text-red-500 mt-1">{errors.schoolName}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="schoolAddress">School Address *</Label>
              <Textarea
                id="schoolAddress"
                value={formData.schoolAddress}
                onChange={(e) => updateField("schoolAddress", e.target.value)}
                className={cn("min-h-[80px]", errors.schoolAddress ? "border-red-500" : "")}
              />
              {errors.schoolAddress && (
                <p className="text-sm text-red-500 mt-1">{errors.schoolAddress}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentClass">Current Class/Level *</Label>
                <Input
                  id="currentClass"
                  placeholder="e.g., Primary 4, JSS 2, 200 Level"
                  value={formData.currentClass}
                  onChange={(e) => updateField("currentClass", e.target.value)}
                  className={errors.currentClass ? "border-red-500" : ""}
                />
                {errors.currentClass && (
                  <p className="text-sm text-red-500 mt-1">{errors.currentClass}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="expectedGraduationYear">Expected Graduation Year *</Label>
                <Input
                  id="expectedGraduationYear"
                  type="number"
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 10}
                  value={formData.expectedGraduationYear}
                  onChange={(e) => updateField("expectedGraduationYear", e.target.value)}
                />
              </div>
            </div>
          </div>
        );
        
      case 4: // Guardian Information
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guardianName">Guardian Full Name *</Label>
                <Input
                  id="guardianName"
                  value={formData.guardianName}
                  onChange={(e) => updateField("guardianName", e.target.value)}
                  className={errors.guardianName ? "border-red-500" : ""}
                />
                {errors.guardianName && (
                  <p className="text-sm text-red-500 mt-1">{errors.guardianName}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="guardianRelationship">Relationship *</Label>
                <Select
                  value={formData.guardianRelationship}
                  onValueChange={(value) => updateField("guardianRelationship", value)}
                >
                  <SelectTrigger className={errors.guardianRelationship ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="grandparent">Grandparent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="uncle">Uncle</SelectItem>
                    <SelectItem value="aunt">Aunt</SelectItem>
                    <SelectItem value="legal_guardian">Legal Guardian</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.guardianRelationship && (
                  <p className="text-sm text-red-500 mt-1">{errors.guardianRelationship}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guardianOccupation">Occupation *</Label>
                <Input
                  id="guardianOccupation"
                  value={formData.guardianOccupation}
                  onChange={(e) => updateField("guardianOccupation", e.target.value)}
                  className={errors.guardianOccupation ? "border-red-500" : ""}
                />
                {errors.guardianOccupation && (
                  <p className="text-sm text-red-500 mt-1">{errors.guardianOccupation}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="guardianMonthlyIncome">Monthly Income (₦)</Label>
                <Select
                  value={formData.guardianMonthlyIncome}
                  onValueChange={(value) => updateField("guardianMonthlyIncome", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="below_30000">Below ₦30,000</SelectItem>
                    <SelectItem value="30000_50000">₦30,000 - ₦50,000</SelectItem>
                    <SelectItem value="50000_100000">₦50,000 - ₦100,000</SelectItem>
                    <SelectItem value="100000_200000">₦100,000 - ₦200,000</SelectItem>
                    <SelectItem value="200000_500000">₦200,000 - ₦500,000</SelectItem>
                    <SelectItem value="above_500000">Above ₦500,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guardianPhoneNumber">Phone Number *</Label>
                <Input
                  id="guardianPhoneNumber"
                  type="tel"
                  placeholder="+234 801 234 5678"
                  value={formData.guardianPhoneNumber}
                  onChange={(e) => updateField("guardianPhoneNumber", e.target.value)}
                  className={errors.guardianPhoneNumber ? "border-red-500" : ""}
                />
                {errors.guardianPhoneNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.guardianPhoneNumber}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="guardianEmail">Email Address</Label>
                <Input
                  id="guardianEmail"
                  type="email"
                  value={formData.guardianEmail}
                  onChange={(e) => updateField("guardianEmail", e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="guardianAddress">Guardian Address *</Label>
              <Textarea
                id="guardianAddress"
                value={formData.guardianAddress}
                onChange={(e) => updateField("guardianAddress", e.target.value)}
                className={cn("min-h-[80px]", errors.guardianAddress ? "border-red-500" : "")}
              />
              {errors.guardianAddress && (
                <p className="text-sm text-red-500 mt-1">{errors.guardianAddress}</p>
              )}
            </div>
          </div>
        );
        
      case 5: // Financial Information
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="householdSize">Household Size *</Label>
                <Input
                  id="householdSize"
                  type="number"
                  min="1"
                  value={formData.householdSize}
                  onChange={(e) => updateField("householdSize", e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="numberOfSiblings">Number of Siblings *</Label>
                <Input
                  id="numberOfSiblings"
                  type="number"
                  min="0"
                  value={formData.numberOfSiblings}
                  onChange={(e) => updateField("numberOfSiblings", e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="siblingsInSchool">Siblings in School *</Label>
                <Input
                  id="siblingsInSchool"
                  type="number"
                  min="0"
                  value={formData.siblingsInSchool}
                  onChange={(e) => updateField("siblingsInSchool", e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label>Level of Financial Need *</Label>
              <RadioGroup
                value={formData.financialNeed}
                onValueChange={(value) => updateField("financialNeed", value)}
              >
                <div className="space-y-2 mt-2">
                  <div className="flex items-center">
                    <RadioGroupItem value="critical" id="critical" />
                    <Label htmlFor="critical" className="ml-2 cursor-pointer">
                      Critical - Unable to afford basic educational needs
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="ml-2 cursor-pointer">
                      High - Struggling to meet educational expenses
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate" className="ml-2 cursor-pointer">
                      Moderate - Need assistance with some expenses
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="ml-2 cursor-pointer">
                      Low - Minimal financial assistance needed
                    </Label>
                  </div>
                </div>
              </RadioGroup>
              {errors.financialNeed && (
                <p className="text-sm text-red-500 mt-1">{errors.financialNeed}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="reasonForApplication">
                Reason for Application * (Minimum 50 characters)
              </Label>
              <Textarea
                id="reasonForApplication"
                placeholder="Please explain why you are applying for this scholarship and how it will help you achieve your educational goals..."
                value={formData.reasonForApplication}
                onChange={(e) => updateField("reasonForApplication", e.target.value)}
                className={cn("min-h-[120px]", errors.reasonForApplication ? "border-red-500" : "")}
              />
              <div className="flex justify-between mt-1">
                <div>
                  {errors.reasonForApplication && (
                    <p className="text-sm text-red-500">{errors.reasonForApplication}</p>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {formData.reasonForApplication.length} characters
                </p>
              </div>
            </div>

            {/* Essay sections */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Essay Questions
              </h3>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="personalStatement">
                    Personal Statement * (100-500 characters)
                  </Label>
                  <Textarea
                    id="personalStatement"
                    placeholder="Tell us about yourself, your background, and what makes you unique..."
                    value={formData.personalStatement}
                    onChange={(e) => updateField("personalStatement", e.target.value)}
                    className={cn("min-h-[120px]", errors.personalStatement ? "border-red-500" : "")}
                  />
                  <div className="flex justify-between mt-1">
                    <div>
                      {errors.personalStatement && (
                        <p className="text-sm text-red-500">{errors.personalStatement}</p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formData.personalStatement.length} characters
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="educationalGoals">
                    Educational Goals * (50-300 characters)
                  </Label>
                  <Textarea
                    id="educationalGoals"
                    placeholder="What are your academic and career aspirations? What do you hope to achieve with your education?"
                    value={formData.educationalGoals}
                    onChange={(e) => updateField("educationalGoals", e.target.value)}
                    className={cn("min-h-[100px]", errors.educationalGoals ? "border-red-500" : "")}
                  />
                  <div className="flex justify-between mt-1">
                    <div>
                      {errors.educationalGoals && (
                        <p className="text-sm text-red-500">{errors.educationalGoals}</p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formData.educationalGoals.length} characters
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="whyApplying">
                    Why Are You Applying? * (50-300 characters)
                  </Label>
                  <Textarea
                    id="whyApplying"
                    placeholder="Why are you applying for this scholarship? How will it help you achieve your goals?"
                    value={formData.whyApplying}
                    onChange={(e) => updateField("whyApplying", e.target.value)}
                    className={cn("min-h-[100px]", errors.whyApplying ? "border-red-500" : "")}
                  />
                  <div className="flex justify-between mt-1">
                    <div>
                      {errors.whyApplying && (
                        <p className="text-sm text-red-500">{errors.whyApplying}</p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formData.whyApplying.length} characters
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="additionalInfo">
                    Additional Information (Optional - Max 200 characters)
                  </Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Any additional information you'd like us to know about you..."
                    value={formData.additionalInfo}
                    onChange={(e) => updateField("additionalInfo", e.target.value)}
                    className="min-h-[80px]"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.additionalInfo.length} characters
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 6: // Additional Information
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="specialNeeds">Special Needs or Disabilities</Label>
              <Textarea
                id="specialNeeds"
                placeholder="Please describe any special needs or disabilities that may affect your education..."
                value={formData.specialNeeds}
                onChange={(e) => updateField("specialNeeds", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div>
              <Label htmlFor="achievements">Academic Achievements & Awards</Label>
              <Textarea
                id="achievements"
                placeholder="List any academic achievements, awards, or recognitions you have received..."
                value={formData.achievements}
                onChange={(e) => updateField("achievements", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div>
              <Label htmlFor="extracurricularActivities">Extracurricular Activities</Label>
              <Textarea
                id="extracurricularActivities"
                placeholder="List any clubs, sports, volunteer work, or other activities you participate in..."
                value={formData.extracurricularActivities}
                onChange={(e) => updateField("extracurricularActivities", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Document Upload</CardTitle>
                <CardDescription>
                  Document upload functionality will be available soon. You will be able to upload:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Recent passport photograph</li>
                  <li>Birth certificate or age declaration</li>
                  <li>Academic transcripts or report cards</li>
                  <li>Letter of recommendation from school</li>
                  <li>Proof of guardian&apos;s income (if available)</li>
                  <li>Any other supporting documents</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        );
        
      case 7: // Review & Submit
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Your Application</CardTitle>
                <CardDescription>
                  Please review all information before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Name: {formData.firstName} {formData.middleName} {formData.lastName}</div>
                    <div>Date of Birth: {formData.dateOfBirth}</div>
                    <div>Gender: {formData.gender}</div>
                    <div>State of Origin: {formData.stateOfOrigin}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Phone: {formData.phoneNumber}</div>
                    <div>Email: {formData.email}</div>
                    <div>Address: {formData.homeAddress}, {formData.city}, {formData.state}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Academic Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Level: {formData.currentAcademicLevel}</div>
                    <div>School: {formData.schoolName}</div>
                    <div>Class: {formData.currentClass}</div>
                    <div>Performance: {formData.academicPerformance}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Guardian Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Name: {formData.guardianName}</div>
                    <div>Relationship: {formData.guardianRelationship}</div>
                    <div>Occupation: {formData.guardianOccupation}</div>
                    <div>Phone: {formData.guardianPhoneNumber}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-lg">Declaration & Consent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="declaration"
                    checked={formData.declarationAccepted}
                    onCheckedChange={(checked) => 
                      updateField("declarationAccepted", checked)
                    }
                  />
                  <Label htmlFor="declaration" className="text-sm cursor-pointer">
                    I hereby declare that all information provided in this application is true and 
                    accurate to the best of my knowledge. I understand that any false information 
                    may lead to the rejection of my application or termination of support if discovered 
                    after approval.
                  </Label>
                </div>
                {errors.declarationAccepted && (
                  <p className="text-sm text-red-500">{errors.declarationAccepted}</p>
                )}
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consent"
                    checked={formData.parentConsentGiven}
                    onCheckedChange={(checked) => 
                      updateField("parentConsentGiven", checked)
                    }
                  />
                  <Label htmlFor="consent" className="text-sm cursor-pointer">
                    I confirm that my parent/guardian has given consent for this application and 
                    is aware of all information being submitted. They have reviewed and approved 
                    this application.
                  </Label>
                </div>
                {errors.parentConsentGiven && (
                  <p className="text-sm text-red-500">{errors.parentConsentGiven}</p>
                )}
              </CardContent>
            </Card>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="container max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Scholarship Application</h1>
        <p className="text-gray-600">Complete all sections to submit your application</p>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        <div className="flex justify-between mt-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center cursor-pointer",
                  currentStep === step.id && "text-green-600",
                  currentStep > step.id && "text-green-600",
                  currentStep < step.id && "text-gray-400"
                )}
                onClick={() => {
                  if (step.id < currentStep) {
                    setCurrentStep(step.id);
                  }
                }}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    currentStep === step.id && "bg-green-600 border-green-600 text-white",
                    currentStep > step.id && "bg-green-600 border-green-600 text-white",
                    currentStep < step.id && "border-gray-300"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs mt-2 text-center hidden sm:block">
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Please provide your personal information"}
            {currentStep === 2 && "How can we contact you?"}
            {currentStep === 3 && "Tell us about your education"}
            {currentStep === 4 && "Provide your guardian's information"}
            {currentStep === 5 && "Help us understand your financial situation"}
            {currentStep === 6 && "Any additional information you'd like to share"}
            {currentStep === 7 && "Review and submit your application"}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              // Save as draft functionality
              toast.info("Draft saving will be implemented soon");
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          
          {currentStep < steps.length ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}