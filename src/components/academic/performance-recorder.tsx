"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  GraduationCap, 
  User, 
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Edit,
  Award,
  TrendingUp,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface PerformanceRecorderProps {
  foundationId: Id<"foundations">;
}

interface Subject {
  name: string;
  grade: number;
  comment?: string;
}

const SubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  grade: z.number().min(0, "Grade must be 0 or higher").max(100, "Grade cannot exceed 100"),
  comment: z.string().optional(),
});

const PerformanceSchema = z.object({
  beneficiaryId: z.string().min(1, "Please select a beneficiary"),
  academicSessionId: z.string().min(1, "Please select an academic session"),
  overallGrade: z.number().min(0).max(100).optional(),
  gradeClass: z.string().optional(),
  position: z.number().min(1).optional(),
  totalStudents: z.number().min(1).optional(),
  attendance: z.number().min(0).max(100).optional(),
  subjects: z.array(SubjectSchema),
  teacherComments: z.string().optional(),
  principalComments: z.string().optional(),
  needsIntervention: z.boolean(),
  interventionReason: z.string().optional(),
  hasImproved: z.boolean().optional(),
});

type PerformanceFormData = z.infer<typeof PerformanceSchema>;

export function PerformanceRecorder({ foundationId }: PerformanceRecorderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>("");

  // Convex queries
  const beneficiaries = useQuery(api.beneficiaries.getByFoundation, {
    foundationId,
  });

  const academicSessions = useQuery(api.academic.getSessionsByBeneficiary, 
    selectedBeneficiary ? {
      beneficiaryId: selectedBeneficiary as Id<"beneficiaries">,
      foundationId,
    } : "skip"
  );

  const existingPerformance = useQuery(api.academic.getPerformanceByBeneficiary,
    selectedBeneficiary ? {
      beneficiaryId: selectedBeneficiary as Id<"beneficiaries">,
      foundationId,
    } : "skip"
  );

  // Mutations
  const createPerformanceRecord = useMutation(api.academic.createPerformanceRecord);

  // Form setup
  const form = useForm<PerformanceFormData>({
    resolver: zodResolver(PerformanceSchema),
    defaultValues: {
      beneficiaryId: "",
      academicSessionId: "",
      overallGrade: undefined,
      gradeClass: "",
      position: undefined,
      totalStudents: undefined,
      attendance: undefined,
      subjects: [{ name: "", grade: 0, comment: "" }],
      teacherComments: "",
      principalComments: "",
      needsIntervention: false,
      interventionReason: "",
      hasImproved: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subjects",
  });

  // Get grade color and label
  const getGradeColor = (grade: number) => {
    if (grade >= 80) return "text-emerald-600";
    if (grade >= 70) return "text-sky-600";
    if (grade >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getGradeLabel = (grade: number) => {
    if (grade >= 80) return "Excellent";
    if (grade >= 70) return "Good";
    if (grade >= 60) return "Average";
    return "Needs Improvement";
  };

  // Handle beneficiary selection
  const handleBeneficiaryChange = (beneficiaryId: string) => {
    setSelectedBeneficiary(beneficiaryId);
    form.setValue("beneficiaryId", beneficiaryId);
    form.setValue("academicSessionId", ""); // Reset session selection
  };

  // Handle form submission
  const onSubmit = async (data: PerformanceFormData) => {
    try {
      await createPerformanceRecord({
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
      
      // Reset form
      form.reset();
      setSelectedBeneficiary("");
      
    } catch (error) {
      toast.error("Failed to save performance record");
      console.error("Error saving performance:", error);
    }
  };

  // Add subject
  const addSubject = () => {
    append({ name: "", grade: 0, comment: "" });
  };

  // Remove subject
  const removeSubject = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Performance Recording</h1>
          <p className="text-gray-600">Record and track academic performance for beneficiaries</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Record Performance
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
                Record Academic Performance
              </DialogTitle>
              <DialogDescription>
                Enter academic performance data for a beneficiary's session
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Selection */}
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
                        <Select onValueChange={handleBeneficiaryChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select beneficiary" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {beneficiaries?.map((beneficiary) => (
                              <SelectItem key={beneficiary._id} value={beneficiary._id}>
                                {beneficiary.beneficiaryNumber} - {beneficiary.userId}
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedBeneficiary}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select session" />
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

                {/* Overall Performance */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-600" />
                      Overall Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                placeholder="85"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gradeClass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grade Class</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="first_class">First Class</SelectItem>
                                <SelectItem value="second_class_upper">Second Class Upper</SelectItem>
                                <SelectItem value="second_class_lower">Second Class Lower</SelectItem>
                                <SelectItem value="third_class">Third Class</SelectItem>
                                <SelectItem value="pass">Pass</SelectItem>
                                <SelectItem value="distinction">Distinction</SelectItem>
                                <SelectItem value="merit">Merit</SelectItem>
                                <SelectItem value="credit">Credit</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                                placeholder="5"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                            <FormLabel>Total Students</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="30"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                              placeholder="95"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Percentage of classes attended during this session
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Subject Performance */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-emerald-600" />
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
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <Card key={field.id} className="border-gray-100">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                              <div>
                                <Label htmlFor={`subjects.${index}.name`}>Subject Name</Label>
                                <Input
                                  placeholder="Mathematics"
                                  {...form.register(`subjects.${index}.name`)}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`subjects.${index}.grade`}>Grade (%)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="85"
                                  {...form.register(`subjects.${index}.grade`, { valueAsNumber: true })}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`subjects.${index}.comment`}>Comment (Optional)</Label>
                                <Input
                                  placeholder="Excellent performance"
                                  {...form.register(`subjects.${index}.comment`)}
                                />
                              </div>
                              
                              <div className="flex items-end">
                                {fields.length > 1 && (
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
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Comments and Assessment */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      Comments and Assessment
                    </CardTitle>
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
                              placeholder="Teacher's assessment of student performance..."
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
                              placeholder="Principal's remarks and recommendations..."
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="needsIntervention"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                Needs Intervention
                              </FormLabel>
                              <FormDescription>
                                Mark if student requires academic support
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hasImproved"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                Has Improved
                              </FormLabel>
                              <FormDescription>
                                Mark if student shows improvement
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("needsIntervention") && (
                      <FormField
                        control={form.control}
                        name="interventionReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Intervention Reason</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Explain why intervention is needed and recommended actions..."
                                rows={3}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                <DialogFooter>
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
                    <Award className="h-4 w-4 mr-2" />
                    Save Performance Record
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Performance Records */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-600" />
            Recent Performance Records
          </CardTitle>
          <CardDescription>Latest academic performance entries</CardDescription>
        </CardHeader>
        <CardContent>
          {existingPerformance && existingPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Overall Grade</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingPerformance.slice(0, 10).map((record) => (
                    <TableRow key={record._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{record.session?.sessionName}</p>
                          <p className="text-xs text-gray-500">{record.academicLevel?.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.overallGrade ? (
                          <div>
                            <p className={cn("font-medium", getGradeColor(record.overallGrade))}>
                              {record.overallGrade}%
                            </p>
                            <p className="text-xs text-gray-500">{getGradeLabel(record.overallGrade)}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.position && record.totalStudents ? (
                          <span className="text-sm">{record.position}/{record.totalStudents}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.attendance ? (
                          <span className="text-sm">{record.attendance}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {record.needsIntervention && (
                            <Badge variant="destructive" className="text-xs">
                              Intervention
                            </Badge>
                          )}
                          {record.hasImproved && (
                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                              Improved
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No performance records found</h3>
              <p className="text-gray-600 mb-4">
                Start by recording academic performance for your beneficiaries.
              </p>
              <Button 
                onClick={() => setIsOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Record Performance
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}