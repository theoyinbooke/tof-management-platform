"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Nigerian phone validation
const NigerianPhoneSchema = z.string().regex(
  /^(\+234|0)[789][01]\d{8}$/,
  "Please enter a valid Nigerian phone number"
);

// Form schema
const BeneficiaryFormSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email required"),
  phone: NigerianPhoneSchema,
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"]),
  currentLevel: z.string().min(1, "Academic level is required"),
  currentSchool: z.string().min(2, "School name is required"),
  address: z.string().min(5, "Address is required"),
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianPhone: NigerianPhoneSchema,
  guardianEmail: z.string().email("Valid guardian email required"),
  guardianRelationship: z.string().min(2, "Guardian relationship is required"),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
});

type BeneficiaryFormData = z.infer<typeof BeneficiaryFormSchema>;

export default function NewBeneficiaryPage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createBeneficiary = useMutation(api.beneficiaries.create);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BeneficiaryFormData>({
    resolver: zodResolver(BeneficiaryFormSchema),
  });

  const onSubmit = async (data: BeneficiaryFormData) => {
    if (!user?.foundationId) {
      toast.error("Foundation ID not found");
      return;
    }

    setIsSubmitting(true);
    try {
      const beneficiaryId = await createBeneficiary({
        foundationId: user.foundationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        currentLevel: data.currentLevel,
        currentSchool: data.currentSchool,
        address: data.address,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail,
        guardianRelationship: data.guardianRelationship,
        bankDetails: {
          bankName: data.bankName || "",
          accountNumber: data.accountNumber || "",
          accountName: data.accountName || "",
        },
        status: "active",
      });

      toast.success("Beneficiary created successfully!");
      router.push(`/beneficiaries/${beneficiaryId}`);
    } catch (error) {
      console.error("Error creating beneficiary:", error);
      toast.error("Failed to create beneficiary. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/beneficiaries")}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Beneficiary</h1>
            <p className="text-gray-600 mt-1">
              Create a new beneficiary profile for your foundation
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic details about the beneficiary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    placeholder="Enter first name"
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    placeholder="Enter last name"
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="beneficiary@example.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="08012345678"
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register("dateOfBirth")}
                    className={errors.dateOfBirth ? "border-red-500" : ""}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    onValueChange={(value) => setValue("gender", value as "male" | "female")}
                  >
                    <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-red-600 mt-1">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="address">Home Address</Label>
                <Textarea
                  id="address"
                  {...register("address")}
                  placeholder="Enter full address"
                  rows={3}
                  className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && (
                  <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>Current educational details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentLevel">Current Academic Level</Label>
                  <Select
                    onValueChange={(value) => setValue("currentLevel", value)}
                  >
                    <SelectTrigger className={errors.currentLevel ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primary 1">Primary 1</SelectItem>
                      <SelectItem value="Primary 2">Primary 2</SelectItem>
                      <SelectItem value="Primary 3">Primary 3</SelectItem>
                      <SelectItem value="Primary 4">Primary 4</SelectItem>
                      <SelectItem value="Primary 5">Primary 5</SelectItem>
                      <SelectItem value="Primary 6">Primary 6</SelectItem>
                      <SelectItem value="JSS 1">JSS 1</SelectItem>
                      <SelectItem value="JSS 2">JSS 2</SelectItem>
                      <SelectItem value="JSS 3">JSS 3</SelectItem>
                      <SelectItem value="SSS 1">SSS 1</SelectItem>
                      <SelectItem value="SSS 2">SSS 2</SelectItem>
                      <SelectItem value="SSS 3">SSS 3</SelectItem>
                      <SelectItem value="Year 1">University Year 1</SelectItem>
                      <SelectItem value="Year 2">University Year 2</SelectItem>
                      <SelectItem value="Year 3">University Year 3</SelectItem>
                      <SelectItem value="Year 4">University Year 4</SelectItem>
                      <SelectItem value="Year 5">University Year 5</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.currentLevel && (
                    <p className="text-sm text-red-600 mt-1">{errors.currentLevel.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="currentSchool">Current School</Label>
                  <Input
                    id="currentSchool"
                    {...register("currentSchool")}
                    placeholder="Enter school name"
                    className={errors.currentSchool ? "border-red-500" : ""}
                  />
                  {errors.currentSchool && (
                    <p className="text-sm text-red-600 mt-1">{errors.currentSchool.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guardian Information */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Guardian Information</CardTitle>
              <CardDescription>Details about the beneficiary's guardian</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guardianName">Guardian Name</Label>
                  <Input
                    id="guardianName"
                    {...register("guardianName")}
                    placeholder="Enter guardian's full name"
                    className={errors.guardianName ? "border-red-500" : ""}
                  />
                  {errors.guardianName && (
                    <p className="text-sm text-red-600 mt-1">{errors.guardianName.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="guardianRelationship">Relationship</Label>
                  <Input
                    id="guardianRelationship"
                    {...register("guardianRelationship")}
                    placeholder="e.g., Parent, Uncle, Aunt"
                    className={errors.guardianRelationship ? "border-red-500" : ""}
                  />
                  {errors.guardianRelationship && (
                    <p className="text-sm text-red-600 mt-1">{errors.guardianRelationship.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guardianEmail">Guardian Email</Label>
                  <Input
                    id="guardianEmail"
                    type="email"
                    {...register("guardianEmail")}
                    placeholder="guardian@example.com"
                    className={errors.guardianEmail ? "border-red-500" : ""}
                  />
                  {errors.guardianEmail && (
                    <p className="text-sm text-red-600 mt-1">{errors.guardianEmail.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="guardianPhone">Guardian Phone</Label>
                  <Input
                    id="guardianPhone"
                    {...register("guardianPhone")}
                    placeholder="08012345678"
                    className={errors.guardianPhone ? "border-red-500" : ""}
                  />
                  {errors.guardianPhone && (
                    <p className="text-sm text-red-600 mt-1">{errors.guardianPhone.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Information (Optional) */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Bank Information (Optional)</CardTitle>
              <CardDescription>Banking details for financial support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    {...register("bankName")}
                    placeholder="e.g., First Bank"
                  />
                </div>
                
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    {...register("accountNumber")}
                    placeholder="0123456789"
                  />
                </div>
                
                <div>
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    {...register("accountName")}
                    placeholder="Account holder name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/beneficiaries")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>Creating...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Beneficiary
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}