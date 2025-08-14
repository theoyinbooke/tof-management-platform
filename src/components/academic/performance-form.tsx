"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Target, 
  Award, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  User,
  School,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface PerformanceFormProps {
  foundationId: Id<"foundations">;
  beneficiaryId?: Id<"beneficiaries">;
  sessionId?: Id<"academicSessions">;
  onSuccess?: () => void;
}

interface SubjectRecord {
  name: string;
  grade: number;
  comment?: string;
}

const PerformanceSchema = z.object({
  beneficiaryId: z.string().min(1, "Please select a beneficiary"),
  academicSessionId: z.string().min(1, "Please select an academic session"),
  overallGrade: z.number().min(0, "Grade must be 0 or higher").max(100, "Grade cannot exceed 100"),
  gradeClass: z.string().optional(),
  position: z.number().min(1, "Position must be 1 or higher").optional(),
  totalStudents: z.number().min(1, "Total students must be 1 or higher").optional(),
  attendance: z.number().min(0, "Attendance must be 0 or higher").max(100, "Attendance cannot exceed 100%").optional(),
  subjects: z.array(z.object({
    name: z.string().min(1, "Subject name is required"),
    grade: z.number().min(0, "Grade must be 0 or higher").max(100, "Grade cannot exceed 100"),
    comment: z.string().optional(),
  })).optional(),
  teacherComments: z.string().optional(),
  principalComments: z.string().optional(),
  needsIntervention: z.boolean(),
  interventionReason: z.string().optional(),
  hasImproved: z.boolean().optional(),
});

type PerformanceFormData = z.infer<typeof PerformanceSchema>;

export function PerformanceForm({ foundationId, beneficiaryId, sessionId, onSuccess }: PerformanceFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([
    { name: "", grade: 0, comment: "" }
  ]);

  // Queries
  const beneficiaries = useQuery(api.beneficiaries.getByFoundation, {
    foundationId,
    status: "active",
  });

  const academicSessions = useQuery(
    api.academicSessions.getByBeneficiary,
    beneficiaryId ? { beneficiaryId, foundationId } : "skip"
  );

  // Mutation
  const createPerformance = useMutation(api.academic.createPerformanceRecord);

  // Form setup
  const form = useForm<PerformanceFormData>({
    resolver: zodResolver(PerformanceSchema),
    defaultValues: {
      beneficiaryId: beneficiaryId || "",
      academicSessionId: sessionId || "",
      overallGrade: 0,
      gradeClass: "",
      position: undefined,
      totalStudents: undefined,
      attendance: undefined,
      subjects: subjects,
      teacherComments: "",
      principalComments: "",
      needsIntervention: false,
      interventionReason: "",
      hasImproved: false,
    },
  });

  const watchedNeedsIntervention = form.watch("needsIntervention");
  const watchedOverallGrade = form.watch("overallGrade");

  // Subject management
  const addSubject = () => {
    setSubjects(prev => [...prev, { name: "", grade: 0, comment: "" }]);
  };

  const removeSubject = (index: number) => {
    if (subjects.length > 1) {
      setSubjects(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateSubject = (index: number, field: keyof SubjectRecord, value: string | number) => {
    setSubjects(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Auto-calculate overall grade from subjects
  React.useEffect(() => {
    if (subjects.length > 0 && subjects.some(s => s.name && s.grade > 0)) {
      const validSubjects = subjects.filter(s => s.name && s.grade > 0);
      const average = validSubjects.reduce((sum, s) => sum + s.grade, 0) / validSubjects.length;
      form.setValue("overallGrade", Math.round(average * 100) / 100);
    }
    form.setValue("subjects", subjects);
  }, [subjects, form]);

  // Handle form submission
  const onSubmit = async (data: PerformanceFormData) => {
    try {
      await createPerformance({
        foundationId,
        beneficiaryId: data.beneficiaryId as Id<"beneficiaries">,
        academicSessionId: data.academicSessionId as Id<"academicSessions">,
        overallGrade: data.overallGrade,
        gradeClass: data.gradeClass,
        position: data.position,
        totalStudents: data.totalStudents,
        attendance: data.attendance,
        subjects: data.subjects,
        teacherComments: data.teacherComments,
        principalComments: data.principalComments,
        needsIntervention: data.needsIntervention,
        interventionReason: data.interventionReason,
        hasImproved: data.hasImproved,
      });

      toast.success("Performance record saved successfully!");
      setIsOpen(false);
      form.reset();
      setSubjects([{ name: "", grade: 0, comment: "" }]);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save performance record");
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 80) return "text-green-600";
    if (grade >= 70) return "text-blue-600";
    if (grade >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeBadge = (grade: number) => {
    if (grade >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (grade >= 70) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (grade >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Satisfactory</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const selectedBeneficiary = beneficiaries?.find(b => b._id === form.watch("beneficiaryId"));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <BookOpen className="h-4 w-4 mr-2" />
          Record Performance
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            Record Academic Performance
          </DialogTitle>
          <DialogDescription>
            Record academic performance and progress for a beneficiary
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="beneficiaryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Beneficiary
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!!beneficiaryId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select beneficiary" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {beneficiaries?.map((beneficiary) => (
                          <SelectItem key={beneficiary._id} value={beneficiary._id}>
                            {beneficiary.user?.firstName} {beneficiary.user?.lastName} - {beneficiary.beneficiaryNumber}
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
                name="academicSessionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Academic Session
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!!sessionId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic session" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicSessions?.map((session) => (
                          <SelectItem key={session._id} value={session._id}>
                            {session.sessionName} - {session.academicLevel?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedBeneficiary && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <School className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Current School</p>
                      <p className="text-blue-700">{selectedBeneficiary.currentSchool}</p>
                      <p className="text-sm text-blue-600">
                        Academic Level: {selectedBeneficiary.academicLevel?.name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Academic Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Academic Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="overallGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overall Grade (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                        {watchedOverallGrade > 0 && (
                          <div className="mt-1">
                            {getGradeBadge(watchedOverallGrade)}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gradeClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade/Class</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., JSS 2A, Primary 5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attendance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attendance (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Position</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g., 5"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalStudents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Students in Class</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g., 35"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Subject Grades */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Subject Performance
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSubject}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subject
                  </Button>
                </div>
                <CardDescription>
                  Record individual subject grades and comments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjects.map((subject, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 border rounded-lg">
                    <div>
                      <Label htmlFor={`subject-name-${index}`}>Subject</Label>
                      <Input
                        id={`subject-name-${index}`}
                        placeholder="e.g., Mathematics"
                        value={subject.name}
                        onChange={(e) => updateSubject(index, 'name', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`subject-grade-${index}`}>Grade (%)</Label>
                      <Input
                        id={`subject-grade-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        value={subject.grade}
                        onChange={(e) => updateSubject(index, 'grade', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`subject-comment-${index}`}>Comment</Label>
                      <Input
                        id={`subject-comment-${index}`}
                        placeholder="Optional comments"
                        value={subject.comment}
                        onChange={(e) => updateSubject(index, 'comment', e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {subject.grade > 0 && (
                        <div className={`text-sm font-medium ${getGradeColor(subject.grade)}`}>
                          {subject.grade}%
                        </div>
                      )}
                      {subjects.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSubject(index)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="teacherComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher Comments</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Teacher's comments on student performance..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="principalComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principal Comments</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Principal's comments on student performance..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Intervention & Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Intervention & Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="needsIntervention"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Requires Academic Intervention</FormLabel>
                        <FormDescription>
                          Check if the student needs additional academic support
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {watchedNeedsIntervention && (
                  <FormField
                    control={form.control}
                    name="interventionReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervention Reason</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain why intervention is needed..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="hasImproved"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Shows Improvement</FormLabel>
                        <FormDescription>
                          Check if the student has shown improvement from previous records
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Performance Record
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}