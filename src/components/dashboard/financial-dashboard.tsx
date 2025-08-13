"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarIcon, DollarSign, AlertTriangle, CheckCircle, Clock, TrendingUp, FileText, CreditCard, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface FinancialDashboardProps {
  foundationId: Id<"foundations">;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function FinancialDashboard({ foundationId }: FinancialDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  // Convex queries
  const dashboardData = useQuery(api.financial.getFinancialDashboard, {
    foundationId,
    dateRange: dateRange.from && dateRange.to 
      ? {
          start: dateRange.from.toISOString().split('T')[0],
          end: dateRange.to.toISOString().split('T')[0],
        }
      : undefined,
  });

  const overduePayments = useQuery(api.financial.getOverduePayments, {
    foundationId,
  });

  const pendingApprovals = useQuery(api.financial.getPaymentApprovals, {
    foundationId,
    status: "pending",
  });

  const recentRecords = useQuery(api.financial.getByFoundationDetailed, {
    foundationId,
  });

  // Format currency helper
  const formatCurrency = (amount: number, currency: "NGN" | "USD" = "NGN") => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Handle period selection
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    
    switch (period) {
      case "week":
        setDateRange({
          from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          to: now,
        });
        break;
      case "month":
        setDateRange({
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: now,
        });
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        setDateRange({
          from: new Date(now.getFullYear(), quarter * 3, 1),
          to: now,
        });
        break;
      case "year":
        setDateRange({
          from: new Date(now.getFullYear(), 0, 1),
          to: now,
        });
        break;
      default:
        setDateRange({ from: undefined, to: undefined });
    }
  };

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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

  const { summary, counts, recentTransactions, categoryBreakdown } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">Track payments, budgets, and financial performance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-72 justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Allocated</p>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalAmount)}
                </div>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(summary.paidAmount)}
                </div>
                <p className="text-xs text-gray-500">
                  {summary.paymentRate.toFixed(1)}% completion rate
                </p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <div className="text-2xl font-bold text-amber-600">
                  {formatCurrency(summary.pendingAmount)}
                </div>
                <p className="text-xs text-gray-500">
                  {counts.pendingApprovals} awaiting approval
                </p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.overdueAmount)}
                </div>
                <p className="text-xs text-gray-500">
                  {counts.overduePayments} overdue payments
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(counts.overduePayments > 0 || counts.pendingApprovals > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {counts.overduePayments > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Overdue Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700 mb-3">
                  {counts.overduePayments} payments are overdue and require immediate attention.
                </p>
                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                  View Overdue Payments
                </Button>
              </CardContent>
            </Card>
          )}

          {counts.pendingApprovals > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-amber-800 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700 mb-3">
                  {counts.pendingApprovals} payment approvals are waiting for your review.
                </p>
                <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                  Review Approvals
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Detailed Views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>Latest financial activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        transaction.status === "paid" ? "bg-emerald-500" :
                        transaction.status === "pending" ? "bg-amber-500" :
                        transaction.status === "overdue" ? "bg-red-500" : "bg-gray-400"
                      )} />
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {transaction.description || transaction.transactionType.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.invoiceNumber} • {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </p>
                      <Badge variant={
                        transaction.status === "paid" ? "default" :
                        transaction.status === "pending" ? "secondary" :
                        transaction.status === "overdue" ? "destructive" : "outline"
                      } className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full">
                  View All Transactions
                </Button>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Spending by Category
                </CardTitle>
                <CardDescription>Budget allocation breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryBreakdown.slice(0, 5).map((category) => (
                  <div key={category.categoryId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        Category {category.categoryId}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(category.total)}
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{
                          width: `${category.total > 0 ? (category.paid / category.total) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Paid: {formatCurrency(category.paid)}</span>
                      <span>Pending: {formatCurrency(category.pending)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Complete transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Transaction list component will go here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Payment Approvals</CardTitle>
              <CardDescription>Manage payment approval workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Payment approvals component will go here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Generate and download financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Reports component will go here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}