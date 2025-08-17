"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { InlineDatePicker } from "@/components/ui/inline-date-picker";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarIcon, 
  Plus, 
  X, 
  MapPin,
  Clock,
  Users,
  Target,
  DollarSign,
  BookOpen,
  Award,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  User,
  GraduationCap,
  TrendingUp,
  Save
} from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";

const steps = [
  { id: "basics", title: "Basic Information", icon: BookOpen },
  { id: "schedule", title: "Schedule & Location", icon: CalendarIcon },
  { id: "requirements", title: "Requirements & Goals", icon: Target },
  { id: "budget", title: "Budget & Resources", icon: DollarSign },
  { id: "review", title: "Review & Submit", icon: CheckCircle },
];

const programTypeIcons: Record<string, any> = {
  "Workshop": BookOpen,
  "Mentorship": User,
  "Tutoring": GraduationCap,
  "Scholarship": Award,
  "Career Guidance": Target,
  "Life Skills": TrendingUp,
  "JAMB Preparation": BookOpen,
  "WAEC Preparation": BookOpen,
};

export default function NewProgramPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitializedTypes, setHasInitializedTypes] = useState(false);
  const [customTypeDialogOpen, setCustomTypeDialogOpen] = useState(false);
  const [customTypeName, setCustomTypeName] = useState("");
  const [customTypeDescription, setCustomTypeDescription] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    description: "",
    type: "",
    programTypeId: "",
    status: "planning",
    coordinatorId: "",
    
    // Schedule & Location
    startDate: new Date() as Date | undefined,
    endDate: undefined as Date | undefined,
    location: "",
    maxParticipants: undefined as number | undefined,
    isRecurring: false,
    recurrencePattern: "",
    
    // Requirements & Objectives
    requirements: [] as string[],
    objectives: [] as string[],
    
    // Budget
    budgetAllocated: undefined as number | undefined,
    currency: "NGN",
  });
  
  // Temporary input states
  const [newRequirement, setNewRequirement] = useState("");
  const [newObjective, setNewObjective] = useState("");
  
  // Queries and Mutations
  const createProgram = useMutation(api.programs.createProgram);
  const initializeProgramTypes = useMutation(api.programTypes.initializeDefaults);
  const programTypes = useQuery(
    api.programTypes.getActiveByFoundation,
    user?.foundationId ? { foundationId: user.foundationId } : "skip"
  );
  const coordinators = useQuery(
    api.users.getByRoles,
    user?.foundationId ? {
      foundationId: user.foundationId,
      roles: ["admin", "super_admin", "reviewer"],
      isActive: true,
    } : "skip"
  );
  
  // Initialize program types if needed
  useEffect(() => {
    const initTypes = async () => {
      if (user?.foundationId && programTypes !== undefined && programTypes.length === 0 && !hasInitializedTypes) {
        try {
          setHasInitializedTypes(true);
          const result = await initializeProgramTypes({ foundationId: user.foundationId });
          if (result.success) {
            toast.success(`Initialized ${result.count} default program types`);
          }
        } catch (error) {
          console.error("Failed to initialize program types:", error);
        }
      }
    };
    initTypes();
  }, [user?.foundationId, programTypes, hasInitializedTypes, initializeProgramTypes]);
  
  // Navigation functions
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };
  
  // Form helpers
  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()]
      });
      setNewRequirement("");
    }
  };
  
  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    });
  };
  
  const addObjective = () => {
    if (newObjective.trim()) {
      setFormData({
        ...formData,
        objectives: [...formData.objectives, newObjective.trim()]
      });
      setNewObjective("");
    }
  };
  
  const removeObjective = (index: number) => {
    setFormData({
      ...formData,
      objectives: formData.objectives.filter((_, i) => i !== index)
    });
  };
  
  // Validation
  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Basic Information
        return !!(formData.name && formData.description && (formData.programTypeId || formData.type));
      case 1: // Schedule & Location
        return !!formData.startDate;
      case 2: // Requirements & Goals
        return true; // Optional step
      case 3: // Budget
        return true; // Optional step
      default:
        return true;
    }
  };
  
  const handleSubmit = async () => {
    if (!user?.foundationId) {
      toast.error("Foundation ID not found");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const programData = {
        foundationId: user.foundationId,
        name: formData.name,
        description: formData.description,
        programTypeId: formData.programTypeId ? formData.programTypeId as Id<"programTypes"> : undefined,
        type: formData.programTypeId ? undefined : formData.type, // Use type string if no programTypeId
        status: formData.status as any,
        startDate: formData.startDate?.getTime(),
        endDate: formData.endDate?.getTime(),
        location: formData.location || undefined,
        maxParticipants: formData.maxParticipants,
        requirements: formData.requirements.length > 0 ? formData.requirements : undefined,
        objectives: formData.objectives.length > 0 ? formData.objectives : undefined,
        coordinatorId: formData.coordinatorId ? formData.coordinatorId as Id<"users"> : undefined,
        budget: formData.budgetAllocated ? {
          allocated: formData.budgetAllocated,
          spent: 0,
          currency: formData.currency,
        } : undefined,
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.recurrencePattern || undefined,
      };
      
      await createProgram(programData);
      toast.success("Program created successfully!");
      router.push("/programs");
    } catch (error: any) {
      console.error("Failed to create program:", error);
      toast.error(error.message || "Failed to create program");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/programs")}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Programs
          </Button>
          
          <h1 className="text-3xl font-bold">Create New Program</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new educational program for your beneficiaries
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={(currentStep + 1) / steps.length * 100} className="h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(index)}
                  disabled={!validateStep(index - 1) && index > currentStep}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2 rounded-lg transition-colors",
                    index === currentStep && "bg-emerald-50",
                    index < currentStep && "cursor-pointer hover:bg-gray-50",
                    index > currentStep && !validateStep(index - 1) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    index === currentStep && "bg-emerald-600 text-white",
                    index < currentStep && "bg-emerald-100 text-emerald-600",
                    index > currentStep && "bg-gray-100 text-gray-400"
                  )}>
                    {index < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    index === currentStep && "text-emerald-600",
                    index < currentStep && "text-emerald-600",
                    index > currentStep && "text-gray-400"
                  )}>
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 1: Basic Information */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide the core details about your program
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Program Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Mathematics Tutoring Program"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose a clear, descriptive name for your program
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>
                    Program Type <span className="text-red-500">*</span>
                  </Label>
                  {programTypes === undefined ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : programTypes.length === 0 ? (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p>Initializing program types...</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {programTypes.map((type) => {
                        const Icon = programTypeIcons[type.name] || BookOpen;
                        return (
                          <button
                            key={type._id}
                            type="button"
                            onClick={() => setFormData({ 
                              ...formData, 
                              programTypeId: type._id,
                              type: type.name 
                            })}
                            className={cn(
                              "p-4 rounded-lg border-2 text-left transition-all hover:shadow-md",
                              formData.programTypeId === type._id
                                ? "border-emerald-600 bg-emerald-50"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                formData.programTypeId === type._id
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-gray-100 text-gray-600"
                              )}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{type.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {type.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {/* Custom type option */}
                      <button
                        type="button"
                        onClick={() => {
                          setCustomTypeName("");
                          setCustomTypeDescription("");
                          setCustomTypeDialogOpen(true);
                        }}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all hover:shadow-md",
                          formData.type && !formData.programTypeId
                            ? "border-emerald-600 bg-emerald-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            formData.type && !formData.programTypeId
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-gray-100 text-gray-600"
                          )}>
                            <Plus className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {formData.type && !formData.programTypeId ? formData.type : "Custom Type"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formData.type && !formData.programTypeId 
                                ? "Custom program type selected" 
                                : "Create a new program type"}
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the program, its goals, and what participants will learn..."
                    className="min-h-[120px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 10 characters. Be specific about the program's objectives and benefits.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Initial Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Planning
                          </div>
                        </SelectItem>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Active
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="coordinator">Program Coordinator</Label>
                    <Select
                      value={formData.coordinatorId}
                      onValueChange={(value) => setFormData({ ...formData, coordinatorId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select coordinator" />
                      </SelectTrigger>
                      <SelectContent>
                        {coordinators?.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.firstName} {user.lastName} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Step 2: Schedule & Location */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule & Location</CardTitle>
                <CardDescription>
                  When and where will the program take place?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">
                      Program Dates <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-muted-foreground">
                          Start Date
                        </Label>
                        <InlineDatePicker
                          date={formData.startDate}
                          onSelect={(date) => setFormData({ ...formData, startDate: date })}
                          placeholder="Click to select start date"
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          When will the program begin?
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-normal text-muted-foreground">
                          End Date (Optional)
                        </Label>
                        <InlineDatePicker
                          date={formData.endDate}
                          onSelect={(date) => setFormData({ ...formData, endDate: date })}
                          placeholder="Click to select end date"
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (date < today) return true;
                            if (formData.startDate && date < formData.startDate) return true;
                            return false;
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Leave blank for ongoing programs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Main Campus, Room 201 or Online"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Physical address or online platform details
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">
                    <Users className="inline h-4 w-4 mr-1" />
                    Maximum Participants
                  </Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    placeholder="e.g., 30"
                    value={formData.maxParticipants || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      maxParticipants: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for unlimited participants
                  </p>
                </div>
                
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recurring"
                      checked={formData.isRecurring}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, isRecurring: checked as boolean })
                      }
                    />
                    <Label htmlFor="recurring" className="font-normal cursor-pointer">
                      This is a recurring program
                    </Label>
                  </div>
                  
                  {formData.isRecurring && (
                    <div className="space-y-2">
                      <Label htmlFor="recurrence">Recurrence Pattern</Label>
                      <Input
                        id="recurrence"
                        placeholder="e.g., Every Monday 3:00 PM - 5:00 PM"
                        value={formData.recurrencePattern}
                        onChange={(e) => setFormData({ ...formData, recurrencePattern: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Step 3: Requirements & Goals */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements & Learning Goals</CardTitle>
                <CardDescription>
                  Define prerequisites and what participants will achieve
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Requirements</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      What do participants need to join this program?
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a requirement (e.g., Basic mathematics knowledge)"
                        value={newRequirement}
                        onChange={(e) => setNewRequirement(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addRequirement();
                          }
                        }}
                      />
                      <Button type="button" onClick={addRequirement}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.requirements.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.requirements.map((req, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                          >
                            <span className="flex-1 text-sm">{req}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRequirement(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label>Learning Objectives</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      What will participants learn or achieve?
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a learning objective (e.g., Master algebra basics)"
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addObjective();
                          }
                        }}
                      />
                      <Button type="button" onClick={addObjective}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.objectives.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.objectives.map((obj, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg"
                          >
                            <Target className="h-4 w-4 text-emerald-600" />
                            <span className="flex-1 text-sm">{obj}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeObjective(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {formData.requirements.length === 0 && formData.objectives.length === 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Optional but recommended</p>
                        <p>Adding requirements and objectives helps participants understand what to expect.</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Step 4: Budget */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Budget & Resources</CardTitle>
                <CardDescription>
                  Allocate financial resources for the program (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Allocated Budget</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="0"
                      value={formData.budgetAllocated || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        budgetAllocated: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {!formData.budgetAllocated && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex gap-2">
                      <Info className="h-4 w-4 text-gray-600 mt-0.5" />
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-1">No budget required</p>
                        <p>You can add budget allocation later if needed.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.budgetAllocated && (
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-900">Budget Summary</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">
                          {formData.currency === "NGN" ? "₦" : "$"}
                          {formData.budgetAllocated.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-emerald-600" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Step 5: Review & Submit */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Submit</CardTitle>
                <CardDescription>
                  Review your program details before creating
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Basic Information
                  </h3>
                  <div className="ml-6 space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {formData.name}</p>
                    <p><span className="text-muted-foreground">Type:</span> {formData.type}</p>
                    <p><span className="text-muted-foreground">Status:</span> {formData.status}</p>
                    <p className="text-muted-foreground">Description:</p>
                    <p className="pl-4">{formData.description}</p>
                  </div>
                </div>
                
                {/* Schedule & Location */}
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Schedule & Location
                  </h3>
                  <div className="ml-6 space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Start Date:</span>{" "}
                      {formData.startDate ? format(formData.startDate, "PPP") : "Not set"}
                    </p>
                    {formData.endDate && (
                      <p>
                        <span className="text-muted-foreground">End Date:</span>{" "}
                        {format(formData.endDate, "PPP")}
                      </p>
                    )}
                    {formData.location && (
                      <p><span className="text-muted-foreground">Location:</span> {formData.location}</p>
                    )}
                    {formData.maxParticipants && (
                      <p>
                        <span className="text-muted-foreground">Max Participants:</span>{" "}
                        {formData.maxParticipants}
                      </p>
                    )}
                    {formData.isRecurring && (
                      <p>
                        <span className="text-muted-foreground">Recurrence:</span>{" "}
                        {formData.recurrencePattern}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Requirements & Objectives */}
                {(formData.requirements.length > 0 || formData.objectives.length > 0) && (
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Requirements & Goals
                    </h3>
                    <div className="ml-6 space-y-2 text-sm">
                      {formData.requirements.length > 0 && (
                        <div>
                          <p className="text-muted-foreground">Requirements:</p>
                          <ul className="list-disc list-inside pl-4">
                            {formData.requirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {formData.objectives.length > 0 && (
                        <div>
                          <p className="text-muted-foreground">Learning Objectives:</p>
                          <ul className="list-disc list-inside pl-4">
                            {formData.objectives.map((obj, index) => (
                              <li key={index}>{obj}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Budget */}
                {formData.budgetAllocated && (
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Budget
                    </h3>
                    <div className="ml-6 text-sm">
                      <p>
                        <span className="text-muted-foreground">Allocated:</span>{" "}
                        {formData.currency === "NGN" ? "₦" : "$"}
                        {formData.budgetAllocated.toLocaleString()} {formData.currency}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <div className="text-sm text-emerald-800">
                      <p className="font-medium mb-1">Ready to create program</p>
                      <p>Click "Create Program" to save and activate your new program.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/programs")}
            >
              Cancel
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !validateStep(3)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Program
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Custom Type Dialog */}
        <Dialog open={customTypeDialogOpen} onOpenChange={setCustomTypeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Custom Program Type</DialogTitle>
              <DialogDescription>
                Enter a name and description for your custom program type.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="custom-type-name">
                  Program Type Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="custom-type-name"
                  value={customTypeName}
                  onChange={(e) => setCustomTypeName(e.target.value)}
                  placeholder="e.g., Leadership Training"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Choose a clear, descriptive name for the program type
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-type-description">
                  Description (Optional)
                </Label>
                <Textarea
                  id="custom-type-description"
                  value={customTypeDescription}
                  onChange={(e) => setCustomTypeDescription(e.target.value)}
                  placeholder="Brief description of this program type..."
                  className="w-full min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Provide a brief description to help others understand this program type
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCustomTypeDialogOpen(false);
                  setCustomTypeName("");
                  setCustomTypeDescription("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (customTypeName.trim()) {
                    setFormData({
                      ...formData,
                      programTypeId: "",
                      type: customTypeName.trim()
                    });
                    setCustomTypeDialogOpen(false);
                    toast.success(`Custom type "${customTypeName.trim()}" selected`);
                  } else {
                    toast.error("Please enter a program type name");
                  }
                }}
                disabled={!customTypeName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Create & Select
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}