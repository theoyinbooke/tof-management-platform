"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle,
  Receipt,
  Edit,
  Eye,
  Download,
  Banknote
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface PaymentTrackingProps {
  foundationId: Id<"foundations">;
}

interface PaymentFilters {
  status?: string;
  beneficiaryId?: string;
  transactionType?: string;
  search?: string;
}

export function PaymentTracking({ foundationId }: PaymentTrackingProps) {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // Convex queries
  const financialRecords = useQuery(api.financial.getByFoundationDetailed, {
    foundationId,
    status: filters.status as any,
    transactionType: filters.transactionType as any,
    beneficiaryId: filters.beneficiaryId as Id<"beneficiaries">,
  });

  const beneficiaries = useQuery(api.beneficiaries.getByFoundation, {
    foundationId,
  });

  const feeCategories = useQuery(api.financial.getActiveFeeCategories, {
    foundationId,
  });

  const schools = useQuery(api.schools.getByFoundation, {
    foundationId,
  });

  // Mutations
  const createInvoice = useMutation(api.financial.createInvoice);
  const updateStatus = useMutation(api.financial.updateStatus);

  // Format currency
  const formatCurrency = (amount: number, currency: "NGN" | "USD" = "NGN") => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Paid</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
      case "approved":
        return <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">Approved</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-sky-600" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Filter records based on search
  const filteredRecords = React.useMemo(() => {
    if (!financialRecords) return [];
    
    return financialRecords.filter(record => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          record.invoiceNumber?.toLowerCase().includes(searchLower) ||
          record.description?.toLowerCase().includes(searchLower) ||
          record.beneficiaryUser?.firstName?.toLowerCase().includes(searchLower) ||
          record.beneficiaryUser?.lastName?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [financialRecords, filters.search]);

  // Handle payment status update
  const handleStatusUpdate = async (recordId: Id<"financialRecords">, status: string, data?: any) => {
    try {
      await updateStatus({
        recordId,
        status: status as any,
        ...data,
      });
      
      toast.success(`Payment status updated to ${status}`);
      setIsUpdateDialogOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      toast.error("Failed to update payment status");
      console.error("Error updating payment:", error);
    }
  };

  if (!financialRecords) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payment Tracking</h1>
          <p className="text-gray-600">Monitor and manage beneficiary payments</p>
        </div>
        
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search payments..."
                  value={filters.search || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filters.status || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Beneficiary</Label>
              <Select 
                value={filters.beneficiaryId || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, beneficiaryId: value === "all" ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All beneficiaries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Beneficiaries</SelectItem>
                  {beneficiaries?.map((beneficiary) => (
                    <SelectItem key={beneficiary._id} value={beneficiary._id}>
                      {beneficiary.beneficiaryNumber} - {beneficiary.userId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={filters.transactionType || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, transactionType: value === "all" ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="fee_invoice">Fee Invoice</SelectItem>
                  <SelectItem value="payment_made">Payment Made</SelectItem>
                  <SelectItem value="reimbursement">Reimbursement</SelectItem>
                  <SelectItem value="budget_allocation">Budget Allocation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-600" />
            Financial Records
          </CardTitle>
          <CardDescription>
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{record.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {record.beneficiaryUser?.firstName} {record.beneficiaryUser?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.beneficiary?.beneficiaryNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{record.feeCategory?.name}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {formatCurrency(record.amount, record.currency)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {record.dueDate ? (
                        <div>
                          <p className="text-sm">{record.dueDate}</p>
                          {new Date(record.dueDate) < new Date() && record.status !== "paid" && (
                            <p className="text-xs text-red-600">Overdue</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        {getStatusBadge(record.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {record.transactionType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedPayment(record);
                              setIsUpdateDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Receipt className="mr-2 h-4 w-4" />
                            Generate Receipt
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.status || filters.beneficiaryId 
                  ? "No payments match your current filters." 
                  : "Get started by creating your first invoice."
                }
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Payment Status</DialogTitle>
            <DialogDescription>
              Update the status of payment {selectedPayment?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="border-sky-300 text-sky-700 hover:bg-sky-50"
                onClick={() => handleStatusUpdate(selectedPayment?._id, "approved")}
                disabled={selectedPayment?.status === "approved"}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              
              <Button
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={() => handleStatusUpdate(selectedPayment?._id, "paid", {
                  paidDate: new Date().toISOString().split('T')[0],
                  receiptNumber: `RCP-${Date.now()}`,
                })}
                disabled={selectedPayment?.status === "paid"}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Paid
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => handleStatusUpdate(selectedPayment?._id, "overdue")}
                disabled={selectedPayment?.status === "overdue"}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Mark Overdue
              </Button>
              
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => handleStatusUpdate(selectedPayment?._id, "cancelled")}
                disabled={selectedPayment?.status === "cancelled"}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}