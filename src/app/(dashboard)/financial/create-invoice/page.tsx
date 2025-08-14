"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  Receipt,
  Save,
  User,
  DollarSign,
  Calendar,
  FileText
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";

export default function CreateInvoicePage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get foundation ID from user
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Form state
  const [formData, setFormData] = useState({
    beneficiaryId: "",
    academicSessionId: "",
    feeCategoryId: "",
    amount: "",
    currency: "NGN" as "NGN" | "USD",
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    schoolId: "",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch beneficiaries
  const beneficiaries = useQuery(
    api.beneficiaries.getByFoundation,
    foundationId ? { foundationId, status: "active" } : "skip"
  );

  // Fetch fee categories
  const feeCategories = useQuery(
    api.financial.getActiveFeeCategories,
    foundationId ? { foundationId } : "skip"
  );

  // Fetch academic sessions for selected beneficiary
  const academicSessions = useQuery(
    api.academicSessions.getByBeneficiary,
    formData.beneficiaryId ? { beneficiaryId: formData.beneficiaryId as Id<"beneficiaries"> } : "skip"
  );

  // Fetch schools (we'll need to create this query)
  // const schools = useQuery(api.schools.getByFoundation, foundationId ? { foundationId } : "skip");

  const createInvoice = useMutation(api.financial.createInvoice);

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.beneficiaryId) newErrors.beneficiaryId = "Beneficiary is required";
    if (!formData.feeCategoryId) newErrors.feeCategoryId = "Fee category is required";
    if (!formData.amount) newErrors.amount = "Amount is required";
    if (!formData.invoiceDate) newErrors.invoiceDate = "Invoice date is required";
    if (!formData.dueDate) newErrors.dueDate = "Due date is required";

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = "Amount must be a valid number greater than 0";
    }

    // Due date should be after invoice date
    if (formData.invoiceDate && formData.dueDate && formData.dueDate <= formData.invoiceDate) {
      newErrors.dueDate = "Due date must be after invoice date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !foundationId) return;
    
    setIsSubmitting(true);
    try {
      const invoiceId = await createInvoice({
        foundationId,
        beneficiaryId: formData.beneficiaryId as Id<"beneficiaries">,
        academicSessionId: formData.academicSessionId ? formData.academicSessionId as Id<"academicSessions"> : undefined,
        feeCategoryId: formData.feeCategoryId as Id<"feeCategories">,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        schoolId: formData.schoolId ? formData.schoolId as Id<"schools"> : undefined,
        description: formData.description || undefined,
      });

      toast.success("Invoice created successfully!");
      router.push(`/financial/${invoiceId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBeneficiary = beneficiaries?.find(b => b._id === formData.beneficiaryId);
  const selectedFeeCategory = feeCategories?.find(fc => fc._id === formData.feeCategoryId);

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="container max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Invoice</h1>
            <p className="text-gray-600 mt-1">Create a new financial record for a beneficiary</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Beneficiary Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Beneficiary Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="beneficiaryId">Beneficiary *</Label>
                    <Select
                      value={formData.beneficiaryId}
                      onValueChange={(value) => updateField("beneficiaryId", value)}
                    >
                      <SelectTrigger className={errors.beneficiaryId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select beneficiary" />
                      </SelectTrigger>
                      <SelectContent>
                        {beneficiaries?.map((beneficiary) => (
                          <SelectItem key={beneficiary._id} value={beneficiary._id}>
                            {beneficiary.user?.firstName} {beneficiary.user?.lastName} - {beneficiary.beneficiaryNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.beneficiaryId && (
                      <p className="text-sm text-red-500 mt-1">{errors.beneficiaryId}</p>
                    )}
                  </div>

                  {selectedBeneficiary && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium">Current School:</p>
                      <p className="text-sm text-gray-600">{selectedBeneficiary.currentSchool}</p>
                      <p className="text-sm font-medium mt-2">Academic Level:</p>
                      <p className="text-sm text-gray-600">{selectedBeneficiary.academicLevel?.name}</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="academicSessionId">Academic Session (Optional)</Label>
                    <Select
                      value={formData.academicSessionId}
                      onValueChange={(value) => updateField("academicSessionId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic session" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {academicSessions?.map((session) => (
                          <SelectItem key={session._id} value={session._id}>
                            {session.sessionName} - {session.academicLevel?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="feeCategoryId">Fee Category *</Label>
                    <Select
                      value={formData.feeCategoryId}
                      onValueChange={(value) => updateField("feeCategoryId", value)}
                    >
                      <SelectTrigger className={errors.feeCategoryId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select fee category" />
                      </SelectTrigger>
                      <SelectContent>
                        {feeCategories?.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                            {category.description && ` - ${category.description}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.feeCategoryId && (
                      <p className="text-sm text-red-500 mt-1">{errors.feeCategoryId}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount *</Label>
                      <div className="flex">
                        <Select
                          value={formData.currency}
                          onValueChange={(value: "NGN" | "USD") => updateField("currency", value)}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NGN">₦</SelectItem>
                            <SelectItem value="USD">$</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.amount}
                          onChange={(e) => updateField("amount", e.target.value)}
                          className={`flex-1 ${errors.amount ? "border-red-500" : ""}`}
                          placeholder="Enter amount"
                        />
                      </div>
                      {errors.amount && (
                        <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
                      )}
                    </div>

                    {formData.amount && (
                      <div className="flex items-end">
                        <div className="text-sm text-gray-600">
                          <p>Preview: {formatCurrency(parseFloat(formData.amount) || 0, formData.currency)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Date Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Date Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoiceDate">Invoice Date *</Label>
                      <Input
                        id="invoiceDate"
                        type="date"
                        value={formData.invoiceDate}
                        onChange={(e) => updateField("invoiceDate", e.target.value)}
                        className={errors.invoiceDate ? "border-red-500" : ""}
                      />
                      {errors.invoiceDate && (
                        <p className="text-sm text-red-500 mt-1">{errors.invoiceDate}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="dueDate">Due Date *</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => updateField("dueDate", e.target.value)}
                        className={errors.dueDate ? "border-red-500" : ""}
                        min={formData.invoiceDate}
                      />
                      {errors.dueDate && (
                        <p className="text-sm text-red-500 mt-1">{errors.dueDate}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Add any additional details about this invoice..."
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Invoice Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Beneficiary</p>
                    <p className="font-medium">
                      {selectedBeneficiary ? 
                        `${selectedBeneficiary.user?.firstName} ${selectedBeneficiary.user?.lastName}` : 
                        "Not selected"
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Fee Category</p>
                    <p className="font-medium">
                      {selectedFeeCategory?.name || "Not selected"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-medium text-lg">
                      {formData.amount ? 
                        formatCurrency(parseFloat(formData.amount), formData.currency) : 
                        "₦0.00"
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-medium">
                      {formData.dueDate ? 
                        new Date(formData.dueDate).toLocaleDateString() : 
                        "Not set"
                      }
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>Creating...</>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Create Invoice
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}