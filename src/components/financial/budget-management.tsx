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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  Target,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface BudgetManagementProps {
  foundationId: Id<"foundations">;
}

interface BudgetCategory {
  feeCategoryId: string;
  budgetedAmount: number;
  currency: "NGN" | "USD";
  expectedBeneficiaries: number;
  notes?: string;
}

const BudgetPlanSchema = z.object({
  planName: z.string().min(3, "Plan name must be at least 3 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  currency: z.enum(["NGN", "USD"]),
  categories: z.array(z.object({
    feeCategoryId: z.string().min(1, "Fee category is required"),
    budgetedAmount: z.number().min(0.01, "Amount must be greater than 0"),
    currency: z.enum(["NGN", "USD"]),
    expectedBeneficiaries: z.number().min(1, "Expected beneficiaries must be at least 1"),
    notes: z.string().optional(),
  })).min(1, "At least one category is required"),
  totalBudget: z.number().min(0.01, "Total budget must be greater than 0"),
});

type BudgetPlanFormData = z.infer<typeof BudgetPlanSchema>;

export function BudgetManagement({ foundationId }: BudgetManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([
    { feeCategoryId: "", budgetedAmount: 0, currency: "NGN", expectedBeneficiaries: 1 }
  ]);

  // Convex queries
  const budgetPlans = useQuery(api.financial.getBudgetPlans, {
    foundationId,
  });

  const feeCategories = useQuery(api.financial.getActiveFeeCategories, {
    foundationId,
  });

  const financialSummary = useQuery(api.financial.getFinancialSummary, {
    foundationId,
  });

  // Mutations
  const createBudgetPlan = useMutation(api.financial.createBudgetPlan);
  const updateBudgetPlanStatus = useMutation(api.financial.updateBudgetPlanStatus);

  // Form setup
  const form = useForm<BudgetPlanFormData>({
    resolver: zodResolver(BudgetPlanSchema),
    defaultValues: {
      planName: "",
      startDate: "",
      endDate: "",
      currency: "NGN",
      categories: budgetCategories,
      totalBudget: 0,
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

  // Calculate total budget
  const calculateTotal = () => {
    return budgetCategories.reduce((sum, category) => sum + category.budgetedAmount, 0);
  };

  // Add budget category
  const addBudgetCategory = () => {
    setBudgetCategories(prev => [
      ...prev,
      { feeCategoryId: "", budgetedAmount: 0, currency: form.watch('currency'), expectedBeneficiaries: 1 }
    ]);
  };

  // Remove budget category
  const removeBudgetCategory = (index: number) => {
    if (budgetCategories.length > 1) {
      setBudgetCategories(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Update budget category
  const updateBudgetCategory = (index: number, field: keyof BudgetCategory, value: any) => {
    setBudgetCategories(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Update form total when categories change
  React.useEffect(() => {
    const total = calculateTotal();
    form.setValue('totalBudget', total);
    form.setValue('categories', budgetCategories.map(cat => ({
      feeCategoryId: cat.feeCategoryId,
      budgetedAmount: cat.budgetedAmount,
      currency: cat.currency,
      expectedBeneficiaries: cat.expectedBeneficiaries,
      notes: cat.notes,
    })));
  }, [budgetCategories, form]);

  // Handle form submission
  const onSubmit = async (data: BudgetPlanFormData) => {
    try {
      await createBudgetPlan({
        foundationId,
        planName: data.planName,
        startDate: data.startDate,
        endDate: data.endDate,
        categories: data.categories.map(cat => ({
          feeCategoryId: cat.feeCategoryId as Id<"feeCategories">,
          budgetedAmount: cat.budgetedAmount,
          currency: cat.currency,
          expectedBeneficiaries: cat.expectedBeneficiaries,
          notes: cat.notes,
        })),
        totalBudget: data.totalBudget,
        currency: data.currency,
      });

      toast.success("Budget plan created successfully!");
      setIsCreateDialogOpen(false);
      
      // Reset form
      form.reset();
      setBudgetCategories([{ feeCategoryId: "", budgetedAmount: 0, currency: "NGN", expectedBeneficiaries: 1 }]);
      
    } catch (error) {
      toast.error("Failed to create budget plan");
      console.error("Error creating budget plan:", error);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (planId: Id<"budgetPlan">, status: string) => {
    try {
      await updateBudgetPlanStatus({ planId, status: status as any });
      toast.success(`Budget plan ${status} successfully`);
    } catch (error) {
      toast.error(`Failed to ${status} budget plan`);
      console.error("Error updating budget plan:", error);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-800">Approved</Badge>;
      case "active":
        return <Badge className="bg-sky-100 text-sky-800">Active</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!budgetPlans || !feeCategories) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-gray-200">
              <CardContent className="p-6">
                <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded mb-2" />
                <div className="h-8 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Budget Management</h1>
          <p className="text-gray-600">Plan and monitor budget allocation across programs</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Budget Plan
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-emerald-600" />
                Create Budget Plan
              </DialogTitle>
              <DialogDescription>
                Create a comprehensive budget plan for the academic year
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="planName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2024/2025 Academic Year Budget" {...field} />
                        </FormControl>
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
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Start Date
                        </FormLabel>
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
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          End Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Budget Categories */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Budget Categories</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addBudgetCategory}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {budgetCategories.map((category, index) => (
                      <Card key={index} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="md:col-span-1">
                              <Label htmlFor={`category-${index}`}>Fee Category</Label>
                              <Select
                                value={category.feeCategoryId}
                                onValueChange={(value) => updateBudgetCategory(index, 'feeCategoryId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {feeCategories.map((feeCategory) => (
                                    <SelectItem key={feeCategory._id} value={feeCategory._id}>
                                      {feeCategory.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor={`amount-${index}`}>Budgeted Amount</Label>
                              <Input
                                id={`amount-${index}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={category.budgetedAmount}
                                onChange={(e) => updateBudgetCategory(index, 'budgetedAmount', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`beneficiaries-${index}`}>Expected Beneficiaries</Label>
                              <Input
                                id={`beneficiaries-${index}`}
                                type="number"
                                min="1"
                                value={category.expectedBeneficiaries}
                                onChange={(e) => updateBudgetCategory(index, 'expectedBeneficiaries', parseInt(e.target.value) || 1)}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`notes-${index}`}>Notes (Optional)</Label>
                              <Input
                                id={`notes-${index}`}
                                placeholder="Additional notes"
                                value={category.notes || ""}
                                onChange={(e) => updateBudgetCategory(index, 'notes', e.target.value)}
                              />
                            </div>
                            
                            <div className="flex items-end">
                              {budgetCategories.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeBudgetCategory(index)}
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
                        <span className="text-lg font-semibold text-emerald-800">Total Budget:</span>
                        <span className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(calculateTotal(), form.watch('currency'))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Create Budget Plan
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Overview Cards */}
      {financialSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total NGN</p>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(financialSummary.totals.NGN.total)}
                  </div>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid NGN</p>
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(financialSummary.totals.NGN.paid)}
                  </div>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total USD</p>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(financialSummary.totals.USD.total, "USD")}
                  </div>
                </div>
                <div className="h-12 w-12 bg-sky-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-sky-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid USD</p>
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(financialSummary.totals.USD.paid, "USD")}
                  </div>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget Plans Table */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Budget Plans
          </CardTitle>
          <CardDescription>
            {budgetPlans.length} budget plan{budgetPlans.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budgetPlans.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Total Budget</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetPlans.map((plan) => (
                    <TableRow key={plan._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{plan.planName}</p>
                          <p className="text-xs text-gray-500">
                            Created {new Date(plan.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{plan.startDate}</p>
                          <p className="text-xs text-gray-500">to {plan.endDate}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {formatCurrency(plan.totalBudget, plan.currency)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{plan.categories.length} categories</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(plan.status)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {plan.createdByUser?.firstName} {plan.createdByUser?.lastName}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {plan.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(plan._id, "approved")}
                              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            >
                              Approve
                            </Button>
                          )}
                          {plan.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(plan._id, "active")}
                              className="border-sky-300 text-sky-700 hover:bg-sky-50"
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No budget plans found</h3>
              <p className="text-gray-600 mb-4">
                Create your first budget plan to start managing your foundation's finances.
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Budget Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}