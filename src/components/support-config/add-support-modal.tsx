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
import { 
  X, 
  Save, 
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface AddSupportModalProps {
  foundationId: Id<"foundations">;
  onClose: () => void;
  onSuccess: (newSupportId?: string) => void;
}

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
  
  // Basic Information Only
  const [supportType, setSupportType] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("FileText");
  const [color, setColor] = useState("emerald");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Basic validation
    if (!supportType || !displayName || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const newSupportId = await createSupportConfig({
        foundationId,
        supportType: supportType.toLowerCase().replace(/\s+/g, '_'),
        displayName,
        description,
        icon,
        color,
        // Default configurations - can be edited later
        eligibilityRules: {},
        amountConfig: [
          {
            academicLevel: "primary",
            minAmount: 10000,
            maxAmount: 50000,
            defaultAmount: 25000,
            currency: "NGN",
            frequency: "termly",
          }
        ],
        requiredDocuments: [
          {
            documentType: "application_form",
            displayName: "Application Form",
            description: "Completed application form",
            isMandatory: true,
            validityPeriod: 90,
          }
        ],
        applicationSettings: {
          allowMultipleApplications: false,
          requiresGuardianConsent: true,
          requiresAcademicVerification: true,
          processingDays: 7,
        },
        performanceRequirements: {
          minAttendance: 75,
          minGradeForRenewal: 60,
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

      toast.success("Support type created! You can now configure the details.");
      onSuccess(newSupportId);
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
      <Card className="w-full max-w-2xl">
        <CardHeader className="bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Add New Support Type</CardTitle>
              <CardDescription>
                Create a new support type. You can configure detailed settings after creation.
              </CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Configure After Creation</h4>
                <p className="text-sm text-blue-700 mt-1">
                  After creating this support type, you can configure budget amounts, eligibility rules, 
                  required documents, and application settings using the configuration panel.
                </p>
              </div>
            </div>
          </div>
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
                  Create Support Type
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}