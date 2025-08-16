"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
  Plus, 
  Save, 
  Trash2,
  FileText,
  DollarSign,
  Settings,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface AddSupportModalProps {
  foundationId: Id<"foundations">;
  onClose: () => void;
  onSuccess: () => void;
}

interface AmountConfig {
  academicLevel: string;
  minAmount: number;
  maxAmount: number;
  defaultAmount: number;
  currency: "NGN" | "USD";
  frequency: "once" | "termly" | "monthly" | "yearly" | "per_semester";
  schoolTypeMultipliers?: {
    public: number;
    private: number;
    international: number;
  };
}

interface RequiredDocument {
  documentType: string;
  displayName: string;
  description?: string;
  isMandatory: boolean;
  validityPeriod?: number;
}

const ACADEMIC_LEVELS = [
  { value: "nursery", label: "Nursery (1-2)" },
  { value: "primary", label: "Primary (1-6)" },
  { value: "jss", label: "Junior Secondary (JSS 1-3)" },
  { value: "sss", label: "Senior Secondary (SSS 1-3)" },
  { value: "university", label: "University" },
];

const ICON_OPTIONS = [
  { value: "GraduationCap", label: "Graduation Cap" },
  { value: "DollarSign", label: "Dollar Sign" },
  { value: "BookOpen", label: "Book" },
  { value: "FileText", label: "File" },
  { value: "AlertCircle", label: "Alert" },
  { value: "Bus", label: "Bus" },
  { value: "Home", label: "Home" },
  { value: "Heart", label: "Heart" },
  { value: "Users", label: "Users" },
  { value: "Calendar", label: "Calendar" },
];

const COLOR_OPTIONS = [
  { value: "emerald", label: "Emerald" },
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "orange", label: "Orange" },
  { value: "red", label: "Red" },
  { value: "teal", label: "Teal" },
  { value: "pink", label: "Pink" },
  { value: "indigo", label: "Indigo" },
];

export function AddSupportModal({ foundationId, onClose, onSuccess }: AddSupportModalProps) {
  const createSupportConfig = useMutation(api.supportConfig.createSupportConfig);
  
  // Basic Information
  const [supportType, setSupportType] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("FileText");
  const [color, setColor] = useState("emerald");
  
  // Amount Configurations
  const [amountConfigs, setAmountConfigs] = useState<AmountConfig[]>([
    {
      academicLevel: "primary",
      minAmount: 10000,
      maxAmount: 50000,
      defaultAmount: 25000,
      currency: "NGN",
      frequency: "termly",
      schoolTypeMultipliers: {
        public: 1.0,
        private: 1.5,
        international: 2.0,
      }
    }
  ]);
  
  // Required Documents
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([
    {
      documentType: "application_form",
      displayName: "Application Form",
      description: "Completed application form",
      isMandatory: true,
      validityPeriod: 90,
    }
  ]);
  
  // Eligibility Rules
  const [minAcademicLevel, setMinAcademicLevel] = useState<string>("");
  const [maxAcademicLevel, setMaxAcademicLevel] = useState<string>("");
  const [requiresMinGrade, setRequiresMinGrade] = useState<number>(0);
  const [minAge, setMinAge] = useState<number>(0);
  const [maxAge, setMaxAge] = useState<number>(0);
  
  // Application Settings
  const [allowMultipleApplications, setAllowMultipleApplications] = useState(false);
  const [requiresGuardianConsent, setRequiresGuardianConsent] = useState(true);
  const [requiresAcademicVerification, setRequiresAcademicVerification] = useState(true);
  const [processingDays, setProcessingDays] = useState(7);
  const [applicationDeadline, setApplicationDeadline] = useState("");
  
  // Performance Requirements
  const [minAttendance, setMinAttendance] = useState(75);
  const [minGradeForRenewal, setMinGradeForRenewal] = useState(60);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Amount Config Functions
  const addAmountConfig = () => {
    setAmountConfigs([...amountConfigs, {
      academicLevel: "primary",
      minAmount: 10000,
      maxAmount: 50000,
      defaultAmount: 25000,
      currency: "NGN",
      frequency: "termly",
      schoolTypeMultipliers: {
        public: 1.0,
        private: 1.5,
        international: 2.0,
      }
    }]);
  };

  const updateAmountConfig = (index: number, field: keyof AmountConfig, value: any) => {
    const updated = [...amountConfigs];
    updated[index] = { ...updated[index], [field]: value };
    setAmountConfigs(updated);
  };

  const removeAmountConfig = (index: number) => {
    setAmountConfigs(amountConfigs.filter((_, i) => i !== index));
  };

  // Document Functions
  const addDocument = () => {
    setRequiredDocuments([...requiredDocuments, {
      documentType: "",
      displayName: "",
      isMandatory: true,
      validityPeriod: 90,
    }]);
  };

  const updateDocument = (index: number, field: keyof RequiredDocument, value: any) => {
    const updated = [...requiredDocuments];
    updated[index] = { ...updated[index], [field]: value };
    setRequiredDocuments(updated);
  };

  const removeDocument = (index: number) => {
    setRequiredDocuments(requiredDocuments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!supportType || !displayName || !description) {
      toast.error("Please fill in all required fields");
      setActiveTab("basic");
      return;
    }

    if (amountConfigs.length === 0) {
      toast.error("Please add at least one amount configuration");
      setActiveTab("amounts");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSupportConfig({
        foundationId,
        supportType: supportType.toLowerCase().replace(/\s+/g, '_'),
        displayName,
        description,
        icon,
        color,
        eligibilityRules: {
          minAcademicLevel: minAcademicLevel || undefined,
          maxAcademicLevel: maxAcademicLevel || undefined,
          minAge: minAge > 0 ? minAge : undefined,
          maxAge: maxAge > 0 ? maxAge : undefined,
          requiresMinGrade: requiresMinGrade > 0 ? requiresMinGrade : undefined,
        },
        amountConfig: amountConfigs,
        requiredDocuments: requiredDocuments.filter(doc => doc.documentType && doc.displayName),
        applicationSettings: {
          allowMultipleApplications,
          applicationDeadline: applicationDeadline || undefined,
          requiresGuardianConsent,
          requiresAcademicVerification,
          processingDays,
        },
        performanceRequirements: {
          minAttendance: minAttendance > 0 ? minAttendance : undefined,
          minGradeForRenewal: minGradeForRenewal > 0 ? minGradeForRenewal : undefined,
          improvementRequired: false,
          reviewFrequency: "termly",
        },
        priorityWeights: {
          academicPerformance: 0.3,
          financialNeed: 0.3,
          attendance: 0.2,
          specialCircumstances: 0.1,
          previousSupport: 0.1,
        },
      });

      toast.success("Support configuration created successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating support configuration:", error);
      toast.error("Failed to create support configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Add New Support Configuration</CardTitle>
              <CardDescription>Create a new type of support for beneficiaries</CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 rounded-none border-b">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="amounts">Amounts</TabsTrigger>
              <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto max-h-[calc(90vh-250px)] p-6 no-scrollbar">
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Support Type ID*</Label>
                    <Input
                      value={supportType}
                      onChange={(e) => setSupportType(e.target.value)}
                      placeholder="e.g., laptop_support"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Unique identifier (no spaces, use underscores)
                    </p>
                  </div>
                  
                  <div>
                    <Label>Display Name*</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g., Laptop Support Program"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description*</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this support covers and who it's for..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Icon</Label>
                    <Select value={icon} onValueChange={setIcon}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Color Theme</Label>
                    <Select value={color} onValueChange={setColor}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full bg-${opt.value}-500`} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Amount Configurations Tab */}
              <TabsContent value="amounts" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold">Amount Configurations</h3>
                    <p className="text-sm text-gray-600">
                      Define budget ranges for different academic levels
                    </p>
                  </div>
                  <Button size="sm" onClick={addAmountConfig}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Level
                  </Button>
                </div>

                {amountConfigs.map((config, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Configuration {index + 1}</h4>
                      {amountConfigs.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAmountConfig(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Academic Level</Label>
                        <Select
                          value={config.academicLevel}
                          onValueChange={(value) => updateAmountConfig(index, 'academicLevel', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACADEMIC_LEVELS.map(level => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Currency</Label>
                        <Select
                          value={config.currency}
                          onValueChange={(value) => updateAmountConfig(index, 'currency', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NGN">NGN (₦)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Frequency</Label>
                        <Select
                          value={config.frequency}
                          onValueChange={(value) => updateAmountConfig(index, 'frequency', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once">One-time</SelectItem>
                            <SelectItem value="termly">Per Term</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="per_semester">Per Semester</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Minimum Amount</Label>
                        <Input
                          type="number"
                          value={config.minAmount}
                          onChange={(e) => updateAmountConfig(index, 'minAmount', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Maximum Amount</Label>
                        <Input
                          type="number"
                          value={config.maxAmount}
                          onChange={(e) => updateAmountConfig(index, 'maxAmount', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Default Amount</Label>
                        <Input
                          type="number"
                          value={config.defaultAmount}
                          onChange={(e) => updateAmountConfig(index, 'defaultAmount', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm text-gray-600">School Type Multipliers</Label>
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        <div>
                          <Label className="text-xs">Public</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={config.schoolTypeMultipliers?.public || 1.0}
                            onChange={(e) => {
                              const multipliers = config.schoolTypeMultipliers || { public: 1.0, private: 1.5, international: 2.0 };
                              updateAmountConfig(index, 'schoolTypeMultipliers', {
                                ...multipliers,
                                public: Number(e.target.value)
                              });
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Private</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={config.schoolTypeMultipliers?.private || 1.5}
                            onChange={(e) => {
                              const multipliers = config.schoolTypeMultipliers || { public: 1.0, private: 1.5, international: 2.0 };
                              updateAmountConfig(index, 'schoolTypeMultipliers', {
                                ...multipliers,
                                private: Number(e.target.value)
                              });
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">International</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={config.schoolTypeMultipliers?.international || 2.0}
                            onChange={(e) => {
                              const multipliers = config.schoolTypeMultipliers || { public: 1.0, private: 1.5, international: 2.0 };
                              updateAmountConfig(index, 'schoolTypeMultipliers', {
                                ...multipliers,
                                international: Number(e.target.value)
                              });
                            }}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Eligibility Tab */}
              <TabsContent value="eligibility" className="space-y-4">
                <h3 className="font-semibold mb-4">Eligibility Rules</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Academic Level</Label>
                    <Select value={minAcademicLevel} onValueChange={setMinAcademicLevel}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="No minimum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No minimum</SelectItem>
                        {ACADEMIC_LEVELS.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Maximum Academic Level</Label>
                    <Select value={maxAcademicLevel} onValueChange={setMaxAcademicLevel}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="No maximum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No maximum</SelectItem>
                        {ACADEMIC_LEVELS.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Minimum Age</Label>
                    <Input
                      type="number"
                      value={minAge}
                      onChange={(e) => setMinAge(Number(e.target.value))}
                      placeholder="0 for no minimum"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Maximum Age</Label>
                    <Input
                      type="number"
                      value={maxAge}
                      onChange={(e) => setMaxAge(Number(e.target.value))}
                      placeholder="0 for no maximum"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Minimum Grade (%)</Label>
                    <Input
                      type="number"
                      value={requiresMinGrade}
                      onChange={(e) => setRequiresMinGrade(Number(e.target.value))}
                      placeholder="0 for no minimum"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Minimum Attendance (%)</Label>
                    <Input
                      type="number"
                      value={minAttendance}
                      onChange={(e) => setMinAttendance(Number(e.target.value))}
                      placeholder="75"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Minimum Grade for Renewal (%)</Label>
                  <Input
                    type="number"
                    value={minGradeForRenewal}
                    onChange={(e) => setMinGradeForRenewal(Number(e.target.value))}
                    placeholder="60"
                    className="mt-1 max-w-xs"
                  />
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-semibold">Required Documents</h3>
                    <p className="text-sm text-gray-600">
                      Documents applicants must submit
                    </p>
                  </div>
                  <Button size="sm" onClick={addDocument}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Document
                  </Button>
                </div>

                {requiredDocuments.map((doc, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Document {index + 1}</h4>
                      {requiredDocuments.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDocument(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Document Type ID</Label>
                        <Input
                          value={doc.documentType}
                          onChange={(e) => updateDocument(index, 'documentType', e.target.value)}
                          placeholder="e.g., bank_statement"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Display Name</Label>
                        <Input
                          value={doc.displayName}
                          onChange={(e) => updateDocument(index, 'displayName', e.target.value)}
                          placeholder="e.g., Bank Statement"
                          className="mt-1"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={doc.description || ""}
                          onChange={(e) => updateDocument(index, 'description', e.target.value)}
                          placeholder="Brief description of the document"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Validity Period (days)</Label>
                        <Input
                          type="number"
                          value={doc.validityPeriod || 90}
                          onChange={(e) => updateDocument(index, 'validityPeriod', Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>

                      <div className="flex items-center space-x-2 mt-6">
                        <Switch
                          checked={doc.isMandatory}
                          onCheckedChange={(checked) => updateDocument(index, 'isMandatory', checked)}
                        />
                        <Label>Mandatory Document</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <h3 className="font-semibold mb-4">Application Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={allowMultipleApplications}
                      onCheckedChange={setAllowMultipleApplications}
                    />
                    <Label>Allow Multiple Applications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={requiresGuardianConsent}
                      onCheckedChange={setRequiresGuardianConsent}
                    />
                    <Label>Requires Guardian Consent</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={requiresAcademicVerification}
                      onCheckedChange={setRequiresAcademicVerification}
                    />
                    <Label>Requires Academic Verification</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Processing Days</Label>
                      <Input
                        type="number"
                        value={processingDays}
                        onChange={(e) => setProcessingDays(Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Application Deadline</Label>
                      <Input
                        value={applicationDeadline}
                        onChange={(e) => setApplicationDeadline(e.target.value)}
                        placeholder="e.g., 30 days before term start"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>

        <div className="border-t p-4 bg-gray-50 flex justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4" />
            <span>Fields marked with * are required</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Support Configuration
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}