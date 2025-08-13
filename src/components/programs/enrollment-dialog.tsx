"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar,
  Users,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  UserPlus
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface EnrollmentDialogProps {
  foundationId: Id<"foundations">;
  beneficiaryId?: Id<"beneficiaries">;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EnrollmentDialog({ foundationId, beneficiaryId, onSuccess, onCancel }: EnrollmentDialogProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>(beneficiaryId || "");
  const [notes, setNotes] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  const enrollBeneficiary = useMutation(api.programs.enrollBeneficiary);

  // Get active programs
  const programs = useQuery(
    api.programs.getByFoundation,
    {
      foundationId,
      status: "active",
    }
  );

  // Get beneficiaries (for admin/guardian use)
  const beneficiaries = useQuery(
    !beneficiaryId ? api.beneficiaries.getByFoundation : "skip",
    !beneficiaryId ? { foundationId } : "skip"
  );

  const selectedProgram = programs?.find(p => p._id === selectedProgramId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planning":
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Planning</Badge>;
      case "active":
        return <Badge className="bg-green-100 text-green-800"><Activity className="w-3 h-3 mr-1" />Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      workshop: { label: "Workshop", color: "bg-purple-100 text-purple-800" },
      mentorship: { label: "Mentorship", color: "bg-blue-100 text-blue-800" },
      tutoring: { label: "Tutoring", color: "bg-green-100 text-green-800" },
      scholarship: { label: "Scholarship", color: "bg-yellow-100 text-yellow-800" },
      career_guidance: { label: "Career Guidance", color: "bg-indigo-100 text-indigo-800" },
      life_skills: { label: "Life Skills", color: "bg-pink-100 text-pink-800" },
      other: { label: "Other", color: "bg-gray-100 text-gray-800" },
    };

    const config = typeMap[type as keyof typeof typeMap] || typeMap.other;

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const canEnroll = (program: any) => {
    if (!program.maxParticipants) return true;
    return program.enrollmentCount < program.maxParticipants;
  };

  const handleEnroll = async () => {
    if (!selectedProgramId || !selectedBeneficiaryId) {
      toast.error("Please select both a program and beneficiary");
      return;
    }

    setIsEnrolling(true);
    try {
      await enrollBeneficiary({
        programId: selectedProgramId as Id<"programs">,
        beneficiaryId: selectedBeneficiaryId as Id<"beneficiaries">,
        notes: notes.trim() || undefined,
      });
      
      toast.success("Successfully enrolled in program!");
      onSuccess();
    } catch (error: any) {
      console.error("Failed to enroll:", error);
      toast.error(error.message || "Failed to enroll in program");
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Beneficiary Selection (if not pre-selected) */}
      {!beneficiaryId && (
        <div>
          <Label htmlFor="beneficiary">Select Beneficiary *</Label>
          <Select value={selectedBeneficiaryId} onValueChange={setSelectedBeneficiaryId}>
            <SelectTrigger id="beneficiary" className="mt-2">
              <SelectValue placeholder="Choose beneficiary to enroll" />
            </SelectTrigger>
            <SelectContent>
              {beneficiaries?.map((beneficiary) => (
                <SelectItem key={beneficiary._id} value={beneficiary._id}>
                  {beneficiary.user?.firstName} {beneficiary.user?.lastName} ({beneficiary.beneficiaryNumber})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Program Selection */}
      <div>
        <Label>Select Program *</Label>
        <div className="grid gap-3 mt-2 max-h-96 overflow-y-auto">
          {programs?.filter(program => canEnroll(program)).map((program) => (
            <Card 
              key={program._id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedProgramId === program._id ? "ring-2 ring-primary border-primary" : ""
              }`}
              onClick={() => setSelectedProgramId(program._id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      {getTypeBadge(program.type)}
                      {getStatusBadge(program.status)}
                    </div>
                  </div>
                  {selectedProgramId === program._id && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">{program.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Starts {formatDate(new Date(program.startDate))}</span>
                  </div>
                  
                  {program.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{program.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>
                      {program.enrollmentCount} enrolled
                      {program.maxParticipants && ` / ${program.maxParticipants} max`}
                    </span>
                  </div>
                  
                  {program.coordinator && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>
                        {program.coordinator.firstName} {program.coordinator.lastName}
                      </span>
                    </div>
                  )}

                  {/* Requirements */}
                  {program.requirements && program.requirements.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Requirements:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                        {program.requirements.map((req: string, index: number) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Objectives */}
                  {program.objectives && program.objectives.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Learning Objectives:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                        {program.objectives.slice(0, 3).map((obj: string, index: number) => (
                          <li key={index}>{obj}</li>
                        ))}
                        {program.objectives.length > 3 && (
                          <li className="text-gray-500">...and {program.objectives.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )) || (
            <p className="text-center text-gray-600 py-8">No active programs available for enrollment</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional information or special requirements..."
          className="mt-2 min-h-[80px]"
        />
      </div>

      {/* Program Details Preview */}
      {selectedProgram && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900">Enrollment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Program:</strong> {selectedProgram.name}</p>
              <p><strong>Type:</strong> {selectedProgram.type.replace("_", " ").toUpperCase()}</p>
              <p><strong>Start Date:</strong> {formatDate(new Date(selectedProgram.startDate))}</p>
              {selectedProgram.location && <p><strong>Location:</strong> {selectedProgram.location}</p>}
              {selectedProgram.coordinator && (
                <p><strong>Coordinator:</strong> {selectedProgram.coordinator.firstName} {selectedProgram.coordinator.lastName}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isEnrolling}>
          Cancel
        </Button>
        <Button 
          onClick={handleEnroll} 
          disabled={!selectedProgramId || !selectedBeneficiaryId || isEnrolling}
        >
          {isEnrolling ? (
            <>Enrolling...</>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Enroll in Program
            </>
          )}
        </Button>
      </div>
    </div>
  );
}