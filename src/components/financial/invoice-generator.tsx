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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Calculator, 
  School, 
  User, 
  Calendar,
  Receipt,
  Download,
  Send,
  Eye,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface InvoiceGeneratorProps {
  foundationId: Id<"foundations">;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const InvoiceSchema = z.object({
  beneficiaryId: z.string().min(1, "Please select a beneficiary"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  currency: z.enum(["NGN", "USD"]),
  dueDate: z.string().min(1, "Due date is required"),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be non-negative"),
    total: z.number(),
  })).min(1, "At least one item is required"),
  totalAmount: z.number().min(0.01, "Total amount must be greater than 0"),
});

type InvoiceFormData = z.infer<typeof InvoiceSchema>;

export function InvoiceGenerator({ foundationId }: InvoiceGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0, total: 0 }
  ]);

  // Convex queries
  const beneficiaries = useQuery(api.beneficiaries.getByFoundation, {
    foundationId,
  });

  const feeCategories = useQuery(api.financial.getActiveFeeCategories, {
    foundationId,
  });

  // Mutations
  const createInvoice = useMutation(api.financial.createInvoice);

  // Form setup
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: {
      beneficiaryId: "",
      title: "",
      description: "",
      currency: "NGN",
      dueDate: "",
      items: invoiceItems,
      totalAmount: 0,
    },
  });

  // Format currency
  const formatCurrency = (amount: number, currency: "NGN" | "USD" = "NGN") => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate total
  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.total, 0);
  };

  // Add invoice item
  const addInvoiceItem = () => {
    setInvoiceItems(prev => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 0, total: 0 }
    ]);
  };

  // Remove invoice item
  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Update invoice item
  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Recalculate total for this item
      if (field === 'quantity' || field === 'unitPrice') {
        updated[index].total = updated[index].quantity * updated[index].unitPrice;
      }
      
      return updated;
    });
  };

  // Update form total when items change
  React.useEffect(() => {
    const total = calculateTotal();
    form.setValue('totalAmount', total);
    form.setValue('items', invoiceItems);
  }, [invoiceItems, form]);

  // Handle form submission
  const onSubmit = async (data: InvoiceFormData) => {
    try {
      const invoiceId = await createInvoice({
        foundationId,
        beneficiaryId: data.beneficiaryId as Id<"beneficiaries">,
        title: data.title,
        description: data.description,
        totalAmount: data.totalAmount,
        currency: data.currency,
        dueDate: new Date(data.dueDate).getTime(),
        items: data.items,
      });

      toast.success("Invoice created successfully!");
      setIsOpen(false);
      setIsPreviewMode(false);
      
      // Reset form
      form.reset();
      setInvoiceItems([{ description: "", quantity: 1, unitPrice: 0, total: 0 }]);
      
    } catch (error) {
      toast.error("Failed to create invoice");
      console.error("Error creating invoice:", error);
    }
  };

  // Generate preview data
  const selectedBeneficiary = beneficiaries?.find(b => b._id === form.watch('beneficiaryId'));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <FileText className="h-4 w-4 mr-2" />
          Generate Invoice
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-600" />
            {isPreviewMode ? "Invoice Preview" : "Generate New Invoice"}
          </DialogTitle>
          <DialogDescription>
            {isPreviewMode 
              ? "Review the invoice before sending to beneficiary"
              : "Create an invoice for school fees, books, or other educational expenses"
            }
          </DialogDescription>
        </DialogHeader>

        {isPreviewMode ? (
          // Invoice Preview
          <div className="space-y-6">
            <Card className="border-gray-200">
              <CardContent className="p-8">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                    <p className="text-gray-600">TheOyinbooke Foundation</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Invoice Date</p>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600 mt-2">Due Date</p>
                    <p className="font-medium">{new Date(form.watch('dueDate')).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h3>
                  <div className="text-gray-700">
                    <p className="font-medium">
                      {selectedBeneficiary?.userId} {/* This should be beneficiary name */}
                    </p>
                    <p>Beneficiary #{selectedBeneficiary?.beneficiaryNumber}</p>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{form.watch('title')}</h3>
                  {form.watch('description') && (
                    <p className="text-gray-600">{form.watch('description')}</p>
                  )}
                </div>

                {/* Items Table */}
                <div className="mb-8">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitPrice, form.watch('currency'))}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total, form.watch('currency'))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Total */}
                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between items-center py-2 border-t border-gray-200">
                      <span className="text-lg font-semibold">Total Amount:</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCurrency(form.watch('totalAmount'), form.watch('currency'))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-600">
                  <p>Payment Terms: Due within 30 days of invoice date</p>
                  <p>Please include invoice number with payment</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setIsPreviewMode(false)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Edit Invoice
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {/* Handle download */}}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Invoice Form
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Currency
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NGN">₦ Nigerian Naira (NGN)</SelectItem>
                          <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., School Fees - 2024 First Term" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Due Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional details about this invoice..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Invoice Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Invoice Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addInvoiceItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {invoiceItems.map((item, index) => (
                    <Card key={index} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          <div className="md:col-span-2">
                            <Label htmlFor={`description-${index}`}>Description</Label>
                            <Input
                              id={`description-${index}`}
                              placeholder="Item description"
                              value={item.description}
                              onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                            <Input
                              id={`quantity-${index}`}
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`unitPrice-${index}`}>Unit Price</Label>
                            <Input
                              id={`unitPrice-${index}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Label>Total</Label>
                              <div className="text-lg font-medium text-gray-900">
                                {formatCurrency(item.total, form.watch('currency'))}
                              </div>
                            </div>
                            {invoiceItems.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeInvoiceItem(index)}
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

                {/* Total Summary */}
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-emerald-800">Total Amount:</span>
                      <span className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(calculateTotal(), form.watch('currency'))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (form.trigger()) {
                      setIsPreviewMode(true);
                    }
                  }}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}