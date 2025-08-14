"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign,
  Plus,
  Filter,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  MoreHorizontal,
  Receipt,
  CreditCard,
  PieChart,
  TrendingUp,
  Calendar,
  User,
  School
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaymentProcessor } from "@/components/financial/payment-processor";

export default function FinancialPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [beneficiaryFilter, setBeneficiaryFilter] = useState<string>("all");

  // Get foundation ID from user
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch financial data
  const financialRecords = useQuery(
    api.financial.getByFoundationDetailed,
    foundationId ? {
      foundationId,
      status: statusFilter !== "all" ? statusFilter as any : undefined,
      transactionType: typeFilter !== "all" ? typeFilter as any : undefined,
      beneficiaryId: beneficiaryFilter !== "all" ? beneficiaryFilter as Id<"beneficiaries"> : undefined,
    } : "skip"
  );

  // Fetch financial summary
  const financialSummary = useQuery(
    api.financial.getFinancialSummary,
    foundationId ? { foundationId } : "skip"
  );

  // Fetch overdue payments
  const overduePayments = useQuery(
    api.financial.getOverduePayments,
    foundationId ? { foundationId } : "skip"
  );

  // Fetch beneficiaries for filter
  const beneficiaries = useQuery(
    api.beneficiaries.getByFoundation,
    foundationId ? { foundationId } : "skip"
  );

  const updateStatus = useMutation(api.financial.updateStatus);

  const handleStatusUpdate = async (recordId: Id<"financialRecords">, newStatus: string) => {
    try {
      await updateStatus({
        recordId,
        status: newStatus as any,
      });
      toast.success("Payment status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "fee_invoice":
        return <Receipt className="w-4 h-4" />;
      case "payment_made":
        return <CreditCard className="w-4 h-4" />;
      case "reimbursement":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Financial Management</h1>
            <p className="text-gray-600 mt-1">Track payments, invoices, and financial records</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/financial/reports")}>
              <PieChart className="w-4 h-4 mr-2" />
              Reports
            </Button>
            <Button onClick={() => router.push("/financial/create-invoice")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Pending</CardTitle>
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(financialSummary?.totals.NGN.pending || 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {financialSummary?.byStatus.pending || 0} records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Approved</CardTitle>
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(financialSummary?.totals.NGN.approved || 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {financialSummary?.byStatus.approved || 0} records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(financialSummary?.totals.NGN.paid || 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {financialSummary?.byStatus.paid || 0} records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {overduePayments?.length || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="fee_invoice">Fee Invoice</SelectItem>
                  <SelectItem value="payment_made">Payment Made</SelectItem>
                  <SelectItem value="reimbursement">Reimbursement</SelectItem>
                </SelectContent>
              </Select>

              <Select value={beneficiaryFilter} onValueChange={setBeneficiaryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Beneficiaries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Beneficiaries</SelectItem>
                  {beneficiaries?.map((beneficiary) => (
                    <SelectItem key={beneficiary._id} value={beneficiary._id}>
                      {beneficiary.user?.firstName} {beneficiary.user?.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="records" className="space-y-4">
          <TabsList>
            <TabsTrigger value="records">Financial Records</TabsTrigger>
            <TabsTrigger value="overdue">Overdue Payments</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Records</CardTitle>
                <CardDescription>
                  {financialRecords?.length || 0} records found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-gray-700">Invoice</th>
                        <th className="text-left p-2 font-medium text-gray-700">Beneficiary</th>
                        <th className="text-left p-2 font-medium text-gray-700">Category</th>
                        <th className="text-left p-2 font-medium text-gray-700">Amount</th>
                        <th className="text-left p-2 font-medium text-gray-700">Due Date</th>
                        <th className="text-left p-2 font-medium text-gray-700">Status</th>
                        <th className="text-left p-2 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialRecords?.map((record) => (
                        <tr key={record._id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(record.transactionType)}
                              <div>
                                <div className="font-medium">
                                  {record.invoiceNumber || "N/A"}
                                </div>
                                <div className="text-xs text-gray-600 capitalize">
                                  {record.transactionType.replace("_", " ")}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">
                                {record.beneficiaryUser?.firstName} {record.beneficiaryUser?.lastName}
                              </div>
                              <div className="text-xs text-gray-600">
                                {record.beneficiary?.beneficiaryNumber}
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              {record.feeCategory?.name || "N/A"}
                            </div>
                            {record.session && (
                              <div className="text-xs text-gray-600">
                                {record.session.sessionName}
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="font-medium">
                              {formatCurrency(record.amount, record.currency)}
                            </div>
                            {record.currency === "USD" && record.exchangeRateUsed && (
                              <div className="text-xs text-gray-600">
                                Rate: ₦{record.exchangeRateUsed}
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              {record.dueDate ? formatDate(new Date(record.dueDate)) : "N/A"}
                            </div>
                            {record.paidDate && (
                              <div className="text-xs text-green-600">
                                Paid: {formatDate(new Date(record.paidDate))}
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            {getStatusBadge(record.status)}
                          </td>
                          <td className="p-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => router.push(`/financial/${record._id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {record.status === "pending" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(record._id, "approved")}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                {(record.status === "approved" || record.status === "pending") && foundationId && (
                                  <div className="px-2 py-1">
                                    <PaymentProcessor 
                                      financialRecordId={record._id}
                                      foundationId={foundationId}
                                    />
                                  </div>
                                )}
                                {record.status === "approved" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusUpdate(record._id, "paid")}
                                    className="text-green-600"
                                  >
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Mark as Paid
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(record._id, "cancelled")}
                                  className="text-red-600"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {financialRecords?.length === 0 && (
                    <div className="text-center py-12">
                      <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No financial records found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Create invoices to start tracking payments
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => router.push("/financial/create-invoice")}
                      >
                        Create Invoice
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Overdue Payments
                </CardTitle>
                <CardDescription>
                  Payments that are past their due date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overduePayments?.map((payment) => (
                    <div key={payment._id} className="border rounded-lg p-4 border-red-200 bg-red-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {payment.beneficiaryUser?.firstName} {payment.beneficiaryUser?.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {payment.feeCategory?.name} - {formatCurrency(payment.amount, payment.currency)}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-red-600">
                            <span>Due: {formatDate(new Date(payment.dueDate))}</span>
                            <span>{payment.daysPastDue} days overdue</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/financial/${payment._id}`)}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(payment._id, "paid")}
                          >
                            Mark Paid
                          </Button>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <p className="text-gray-600">No overdue payments</p>
                      <p className="text-sm text-gray-400 mt-1">
                        All payments are up to date
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(financialSummary?.byStatus || {}).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(status)}
                        <span className="text-sm font-medium capitalize">{status}</span>
                      </div>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transaction Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(financialSummary?.byTransactionType || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(type)}
                        <span className="text-sm font-medium capitalize">{type.replace("_", " ")}</span>
                      </div>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}