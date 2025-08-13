"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Receipt,
  Edit,
  Save,
  X,
  User,
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  School,
  BookOpen
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";

interface FinancialRecordPageProps {
  params: {
    recordId: string;
  };
}

export default function FinancialRecordPage({ params }: FinancialRecordPageProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get record ID from params
  const recordId = params.recordId as Id<"financialRecords">;

  // Fetch the financial record with full details
  const record = useQuery(
    api.financial.getByFoundationDetailed,
    user?.foundationId ? { 
      foundationId: user.foundationId,
    } : "skip"
  )?.find(r => r._id === recordId);

  const updateStatus = useMutation(api.financial.updateStatus);

  // Form state for editing
  const [formData, setFormData] = useState({
    status: record?.status || "pending",
    receiptNumber: "",
    paymentReference: "",
    notes: "",
    paidDate: new Date().toISOString().split('T')[0],
  });

  const handleStatusUpdate = async (newStatus: string) => {
    if (!record) return;
    
    setIsUpdating(true);
    try {
      await updateStatus({
        recordId: record._id,
        status: newStatus as any,
        ...(newStatus === "paid" ? {
          paidDate: formData.paidDate,
          receiptNumber: formData.receiptNumber || undefined,
          paymentReference: formData.paymentReference || undefined,
        } : {}),
        notes: formData.notes || undefined,
      });
      
      toast.success(`Status updated to ${newStatus}`);
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "fee_invoice":
        return <Receipt className="w-5 h-5" />;
      case "payment_made":
        return <CreditCard className="w-5 h-5" />;
      case "reimbursement":
        return <DollarSign className="w-5 h-5" />;
      default:
        return <Receipt className="w-5 h-5" />;
    }
  };

  if (!record) {
    return (
      <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
        <div className="container max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Financial record not found</p>
            <Button 
              className="mt-4"
              onClick={() => router.push("/financial")}
            >
              Back to Financial Records
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="container max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {getTransactionIcon(record.transactionType)}
                {record.invoiceNumber || "Financial Record"}
              </h1>
              <p className="text-gray-600 mt-1">
                {record.transactionType.replace("_", " ").toUpperCase()} • Created {formatDate(new Date(record.createdAt))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(record.status)}
            {!isEditing && record.status !== "paid" && record.status !== "cancelled" && (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Update Status
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Beneficiary Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Beneficiary Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm text-gray-600">Full Name</Label>
                    <p className="font-medium">
                      {record.beneficiaryUser?.firstName} {record.beneficiaryUser?.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Beneficiary Number</Label>
                    <p className="font-medium">{record.beneficiary?.beneficiaryNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Email</Label>
                    <p className="font-medium">{record.beneficiaryUser?.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Phone</Label>
                    <p className="font-medium">{record.beneficiaryUser?.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Current School</Label>
                    <p className="font-medium">{record.beneficiary?.currentSchool}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Academic Level</Label>
                    <p className="font-medium">{record.beneficiary?.academicLevel?.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm text-gray-600">Amount</Label>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(record.amount, record.currency)}
                    </p>
                    {record.currency === "USD" && record.exchangeRateUsed && (
                      <p className="text-sm text-gray-600">
                        Exchange Rate: ₦{record.exchangeRateUsed} per USD
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Fee Category</Label>
                    <p className="font-medium">{record.feeCategory?.name}</p>
                    {record.feeCategory?.description && (
                      <p className="text-sm text-gray-600">{record.feeCategory.description}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Invoice Date</Label>
                    <p className="font-medium">
                      {record.invoiceDate ? formatDate(new Date(record.invoiceDate)) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Due Date</Label>
                    <p className="font-medium">
                      {record.dueDate ? formatDate(new Date(record.dueDate)) : "N/A"}
                    </p>
                    {record.status === "overdue" && (
                      <p className="text-sm text-red-600">
                        {Math.floor((Date.now() - new Date(record.dueDate).getTime()) / (24 * 60 * 60 * 1000))} days overdue
                      </p>
                    )}
                  </div>
                </div>

                {record.description && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <Label className="text-sm text-gray-600">Description</Label>
                      <p className="mt-1">{record.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Academic Session */}
            {record.session && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Academic Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Session Name</Label>
                      <p className="font-medium">{record.session.sessionName}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Academic Level</Label>
                      <p className="font-medium">{record.session.academicLevel?.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            {(record.status === "paid" || record.paidDate) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm text-gray-600">Payment Date</Label>
                      <p className="font-medium">
                        {record.paidDate ? formatDate(new Date(record.paidDate)) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Receipt Number</Label>
                      <p className="font-medium">{record.receiptNumber || "N/A"}</p>
                    </div>
                    {record.paymentReference && (
                      <div>
                        <Label className="text-sm text-gray-600">Payment Reference</Label>
                        <p className="font-medium">{record.paymentReference}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {record.internalNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Internal Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{record.internalNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Update */}
            {isEditing ? (
              <Card>
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>New Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.status === "paid" && (
                    <>
                      <div>
                        <Label>Payment Date</Label>
                        <Input
                          type="date"
                          value={formData.paidDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, paidDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Receipt Number (Optional)</Label>
                        <Input
                          value={formData.receiptNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                          placeholder="Enter receipt number"
                        />
                      </div>
                      <div>
                        <Label>Payment Reference (Optional)</Label>
                        <Input
                          value={formData.paymentReference}
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentReference: e.target.value }))}
                          placeholder="Enter payment reference"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any notes about this update..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStatusUpdate(formData.status)}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      {isUpdating ? (
                        <>Updating...</>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Status
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {record.status === "pending" && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusUpdate("approved")}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Payment
                    </Button>
                  )}
                  {record.status === "approved" && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, status: "paid" }));
                        setIsEditing(true);
                      }}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Mark as Paid
                    </Button>
                  )}
                  {record.status !== "cancelled" && record.status !== "paid" && (
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:text-red-700"
                      onClick={() => handleStatusUpdate("cancelled")}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Payment
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Record Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Record Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600">Amount</Label>
                  <p className="text-lg font-bold">
                    {formatCurrency(record.amount, record.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(record.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Transaction Type</Label>
                  <p className="font-medium capitalize">
                    {record.transactionType.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Created By</Label>
                  <p className="font-medium">
                    {record.requestedByUser?.firstName} {record.requestedByUser?.lastName}
                  </p>
                </div>
                {record.approvedByUser && (
                  <div>
                    <Label className="text-sm text-gray-600">Approved By</Label>
                    <p className="font-medium">
                      {record.approvedByUser.firstName} {record.approvedByUser.lastName}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}