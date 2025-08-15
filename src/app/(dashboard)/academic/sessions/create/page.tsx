"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, ArrowLeft, Save, Users, GraduationCap, School, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Id } from "../../../../../../convex/_generated/dataModel";

const SessionSchema = z.object({
  beneficiaryId: z.string().min(1, "Please select a beneficiary"),
  academicLevelId: z.string().min(1, "Please select an academic level"),
  sessionName: z.string().min(1, "Session name is required"),
  sessionType: z.enum(["term", "semester"], { errorMap: () => ({ message: "Please select session type" }) }),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  schoolName: z.string().min(1, "School name is required"),
  schoolAddress: z.string().optional(),
  schoolContact: z.object({
    phone: z.string().optional(),
    email: z.string().email("Invalid email format").optional().or(z.literal("")),
    accountDetails: z.string().optional(),
  }).optional(),
});

type SessionFormData = z.infer<typeof SessionSchema>;

export default function CreateSessionPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch data for form options
  const beneficiaries = useQuery(
    api.beneficiaries.getByFoundation,
    foundationId ? { foundationId } : "skip"
  );

  const academicLevels = useQuery(
    api.academic.getActiveByFoundation,
    foundationId ? { foundationId } : "skip"
  );

  const createSession = useMutation(api.academicSessions.create);

  const form = useForm<SessionFormData>({
    resolver: zodResolver(SessionSchema),
    defaultValues: {
      beneficiaryId: "",
      academicLevelId: "",
      sessionName: "",
      sessionType: "term",
      startDate: "",
      endDate: "",
      schoolName: "",
      schoolAddress: "",
      schoolContact: {
        phone: "",
        email: "",
        accountDetails: "",
      },
    },
  });

  const selectedBeneficiary = beneficiaries?.find(b => b._id === form.watch("beneficiaryId"));

  // Auto-populate school name from beneficiary's current school
  React.useEffect(() => {
    if (selectedBeneficiary?.currentSchool && !form.getValues("schoolName")) {
      form.setValue("schoolName", selectedBeneficiary.currentSchool);
    }
  }, [selectedBeneficiary, form]);

  const onSubmit = async (data: SessionFormData) => {
    if (!foundationId) {
      toast.error("Foundation not found");
      return;
    }

    try {
      const sessionData = {
        foundationId,
        beneficiaryId: data.beneficiaryId as Id<"beneficiaries">,
        academicLevelId: data.academicLevelId as Id<"academicLevels">,
        sessionName: data.sessionName,
        sessionType: data.sessionType,
        startDate: data.startDate,
        endDate: data.endDate,
        schoolName: data.schoolName,
        schoolAddress: data.schoolAddress,
        schoolContact: data.schoolContact && (
          data.schoolContact.phone || 
          data.schoolContact.email || 
          data.schoolContact.accountDetails
        ) ? data.schoolContact : undefined,
      };

      const sessionId = await createSession(sessionData);
      toast.success("Academic session created successfully!");
      router.push(`/academic/sessions/${sessionId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create academic session");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Academic Session</h1>
            <p className="text-gray-600 mt-1">Set up a new academic session for a beneficiary</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Beneficiary Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Beneficiary & Academic Level
                </CardTitle>
                <CardDescription>
                  Select the beneficiary and their academic level for this session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="beneficiaryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beneficiary *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select beneficiary" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {beneficiaries?.map((beneficiary) => (
                              <SelectItem key={beneficiary._id} value={beneficiary._id}>
                                {beneficiary.user?.firstName} {beneficiary.user?.lastName} ({beneficiary.beneficiaryNumber})
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
                    name="academicLevelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Level *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select academic level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicLevels?.map((level) => (
                              <SelectItem key={level._id} value={level._id}>
                                {level.name} ({level.category})
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
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Selected Beneficiary</p>
                        <p className="text-blue-700">
                          {selectedBeneficiary.user?.firstName} {selectedBeneficiary.user?.lastName}
                        </p>
                        <p className="text-sm text-blue-600">
                          Current School: {selectedBeneficiary.currentSchool || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Session Details
                </CardTitle>
                <CardDescription>
                  Configure the academic session information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sessionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., First Term 2024/2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sessionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select session type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="term">Term</SelectItem>
                            <SelectItem value="semester">Semester</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* School Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="w-5 h-5" />
                  School Information
                </CardTitle>
                <CardDescription>
                  Information about the school where the beneficiary will study
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="schoolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter school name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="schoolAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter school address (optional)"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* School Contact */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">School Contact Information (Optional)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="schoolContact.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 08012345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schoolContact.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="e.g., info@school.edu.ng" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="schoolContact.accountDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Account Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Bank account details for fee payments (optional)"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {form.formState.isSubmitting ? "Creating..." : "Create Session"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ProtectedRoute>
  );
}