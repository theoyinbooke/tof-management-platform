"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Banknote,
  Receipt,
  Globe,
  Upload,
  FileText,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface PaymentProcessorProps {
  financialRecordId: Id<"financialRecords">;
  foundationId: Id<"foundations">;
}

interface PaymentFormData {
  paymentMethod: "manual" | "paystack" | "flutterwave" | "bank_transfer" | "cash";
  amount: number;
  currency: "NGN" | "USD";
  referenceNumber: string;
  notes: string;
  receiptFile?: File;
}

export function PaymentProcessor({ financialRecordId, foundationId }: PaymentProcessorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentFormData>({
    paymentMethod: "manual",
    amount: 0,
    currency: "NGN",
    referenceNumber: "",
    notes: "",
  });

  // Fetch the financial record
  const financialRecord = useQuery(api.financial.getFinancialRecordById, {
    recordId: financialRecordId,
    foundationId,
  });

  // Fetch foundation settings for payment configuration
  const foundationSettings = useQuery(api.foundations.getSettings, {
    foundationId,
  });

  // Mutations
  const processManualPayment = useMutation(api.financial.processManualPayment);
  const initiatePaystackPayment = useMutation(api.financial.initiatePaystackPayment);
  const initiateFlutterwavePayment = useMutation(api.financial.initiateFlutterwavePayment);
  const uploadPaymentReceipt = useMutation(api.files.uploadPaymentReceipt);

  React.useEffect(() => {
    if (financialRecord) {
      setPaymentData(prev => ({
        ...prev,
        amount: financialRecord.amount,
        currency: financialRecord.currency,
      }));
    }
  }, [financialRecord]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a JPEG, PNG, or PDF file");
        return;
      }

      if (file.size > maxSize) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setPaymentData(prev => ({ ...prev, receiptFile: file }));
    }
  };

  const processPayment = async () => {
    if (!financialRecord) return;

    setIsProcessing(true);
    try {
      switch (paymentData.paymentMethod) {
        case "manual":
          await handleManualPayment();
          break;
        case "paystack":
          await handlePaystackPayment();
          break;
        case "flutterwave":
          await handleFlutterwavePayment();
          break;
        case "bank_transfer":
        case "cash":
          await handleManualPayment();
          break;
        default:
          throw new Error("Invalid payment method");
      }
    } catch (error: any) {
      toast.error(error.message || "Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualPayment = async () => {
    try {
      let receiptId: Id<"_storage"> | undefined;

      // Upload receipt if provided
      if (paymentData.receiptFile) {
        receiptId = await uploadPaymentReceipt({
          foundationId,
          financialRecordId,
          fileName: paymentData.receiptFile.name,
          fileType: paymentData.receiptFile.type,
          fileSize: paymentData.receiptFile.size,
        });
      }

      await processManualPayment({
        financialRecordId,
        foundationId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
        receiptId,
      });

      toast.success("Payment processed successfully!");
      setIsOpen(false);
      
      // Reset form
      setPaymentData({
        paymentMethod: "manual",
        amount: financialRecord?.amount || 0,
        currency: financialRecord?.currency || "NGN",
        referenceNumber: "",
        notes: "",
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to process manual payment");
    }
  };

  const handlePaystackPayment = async () => {
    if (!foundationSettings?.paymentGateways?.paystack?.enabled) {
      toast.error("Paystack is not configured for this foundation");
      return;
    }

    try {
      const paymentSession = await initiatePaystackPayment({
        financialRecordId,
        foundationId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        callbackUrl: `${window.location.origin}/payment/callback`,
      });

      // Redirect to Paystack payment page
      window.location.href = paymentSession.authorizationUrl;
    } catch (error: any) {
      throw new Error(error.message || "Failed to initiate Paystack payment");
    }
  };

  const handleFlutterwavePayment = async () => {
    if (!foundationSettings?.paymentGateways?.flutterwave?.enabled) {
      toast.error("Flutterwave is not configured for this foundation");
      return;
    }

    try {
      const paymentSession = await initiateFlutterwavePayment({
        financialRecordId,
        foundationId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        callbackUrl: `${window.location.origin}/payment/callback`,
      });

      // Redirect to Flutterwave payment page
      window.location.href = paymentSession.link;
    } catch (error: any) {
      throw new Error(error.message || "Failed to initiate Flutterwave payment");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800"><AlertCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "paystack":
      case "flutterwave":
        return <Globe className="w-4 h-4" />;
      case "bank_transfer":
        return <CreditCard className="w-4 h-4" />;
      case "cash":
        return <Banknote className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  const isPaymentGatewayAvailable = (gateway: string) => {
    if (gateway === "paystack") {
      return foundationSettings?.paymentGateways?.paystack?.enabled;
    }
    if (gateway === "flutterwave") {
      return foundationSettings?.paymentGateways?.flutterwave?.enabled;
    }
    return true; // Manual methods are always available
  };

  if (!financialRecord) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={financialRecord.status === "paid"}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Process Payment
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            Process Payment
          </DialogTitle>
          <DialogDescription>
            Process payment for this financial record using various payment methods
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Financial Record Summary */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Beneficiary:</span>
                <span className="font-medium">
                  {financialRecord.beneficiaryUser?.firstName} {financialRecord.beneficiaryUser?.lastName}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fee Category:</span>
                <span className="font-medium">{financialRecord.feeCategory?.name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount Due:</span>
                <span className="font-medium text-lg">
                  {formatCurrency(financialRecord.amount, financialRecord.currency)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">
                  {financialRecord.dueDate ? formatDate(new Date(financialRecord.dueDate)) : "N/A"}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                {getStatusBadge(financialRecord.status)}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Select Payment Method</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Manual Payment */}
              <Card 
                className={`cursor-pointer transition-all ${
                  paymentData.paymentMethod === "manual" 
                    ? "border-emerald-500 bg-emerald-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: "manual" }))}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-medium">Manual Payment</p>
                    <p className="text-xs text-gray-600">Mark as paid manually</p>
                  </div>
                </CardContent>
              </Card>

              {/* Paystack */}
              <Card 
                className={`cursor-pointer transition-all ${
                  paymentData.paymentMethod === "paystack" 
                    ? "border-emerald-500 bg-emerald-50" 
                    : isPaymentGatewayAvailable("paystack")
                      ? "border-gray-200 hover:border-gray-300"
                      : "border-gray-100 bg-gray-50 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (isPaymentGatewayAvailable("paystack")) {
                    setPaymentData(prev => ({ ...prev, paymentMethod: "paystack" }));
                  }
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Paystack</p>
                    <p className="text-xs text-gray-600">
                      {isPaymentGatewayAvailable("paystack") ? "Online card payment" : "Not configured"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Flutterwave */}
              <Card 
                className={`cursor-pointer transition-all ${
                  paymentData.paymentMethod === "flutterwave" 
                    ? "border-emerald-500 bg-emerald-50" 
                    : isPaymentGatewayAvailable("flutterwave")
                      ? "border-gray-200 hover:border-gray-300"
                      : "border-gray-100 bg-gray-50 cursor-not-allowed"
                }`}
                onClick={() => {
                  if (isPaymentGatewayAvailable("flutterwave")) {
                    setPaymentData(prev => ({ ...prev, paymentMethod: "flutterwave" }));
                  }
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Flutterwave</p>
                    <p className="text-xs text-gray-600">
                      {isPaymentGatewayAvailable("flutterwave") ? "Online payment gateway" : "Not configured"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Transfer */}
              <Card 
                className={`cursor-pointer transition-all ${
                  paymentData.paymentMethod === "bank_transfer" 
                    ? "border-emerald-500 bg-emerald-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: "bank_transfer" }))}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-xs text-gray-600">Direct bank payment</p>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Payment */}
              <Card 
                className={`cursor-pointer transition-all ${
                  paymentData.paymentMethod === "cash" 
                    ? "border-emerald-500 bg-emerald-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: "cash" }))}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Cash Payment</p>
                    <p className="text-xs text-gray-600">Cash received</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Payment Form */}
          {(paymentData.paymentMethod === "manual" || 
            paymentData.paymentMethod === "bank_transfer" || 
            paymentData.paymentMethod === "cash") && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <div className="flex">
                    <Select
                      value={paymentData.currency}
                      onValueChange={(value: "NGN" | "USD") => 
                        setPaymentData(prev => ({ ...prev, currency: value }))
                      }
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
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData(prev => ({ 
                        ...prev, 
                        amount: parseFloat(e.target.value) || 0 
                      }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reference">Reference Number</Label>
                  <Input
                    id="reference"
                    value={paymentData.referenceNumber}
                    onChange={(e) => setPaymentData(prev => ({ 
                      ...prev, 
                      referenceNumber: e.target.value 
                    }))}
                    placeholder="Payment reference/transaction ID"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Payment Notes</Label>
                <Textarea
                  id="notes"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  placeholder="Additional notes about this payment..."
                  rows={3}
                />
              </div>

              {/* Receipt Upload */}
              <div>
                <Label htmlFor="receipt">Upload Receipt (Optional)</Label>
                <div className="mt-1">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        {paymentData.receiptFile ? paymentData.receiptFile.name : "Click to upload receipt"}
                      </p>
                      <p className="text-xs text-gray-400">PNG, JPG, PDF up to 5MB</p>
                    </div>
                    <input 
                      id="receipt" 
                      type="file" 
                      className="hidden" 
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Online Payment Info */}
          {(paymentData.paymentMethod === "paystack" || paymentData.paymentMethod === "flutterwave") && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Online Payment</p>
                    <p className="text-sm text-blue-700">
                      You will be redirected to {paymentData.paymentMethod} to complete the payment securely. 
                      The payment status will be updated automatically upon completion.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          
          <Button
            onClick={processPayment}
            disabled={isProcessing || !paymentData.amount}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isProcessing ? (
              "Processing..."
            ) : (
              <>
                {getPaymentMethodIcon(paymentData.paymentMethod)}
                <span className="ml-2">
                  {paymentData.paymentMethod === "paystack" || paymentData.paymentMethod === "flutterwave"
                    ? `Pay with ${paymentData.paymentMethod}`
                    : "Process Payment"
                  }
                </span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}