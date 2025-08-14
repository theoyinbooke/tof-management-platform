"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Download,
  FileText,
  PieChart,
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  Target
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function FinancialReportsPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [dateRange, setDateRange] = useState("30"); // days
  const [reportType, setReportType] = useState("overview");

  // Get foundation ID from user
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch financial data
  const financialSummary = useQuery(
    api.financial.getFinancialSummary,
    foundationId ? { foundationId } : "skip"
  );

  const financialRecords = useQuery(
    api.financial.getByFoundationDetailed,
    foundationId ? { foundationId } : "skip"
  );

  const overduePayments = useQuery(
    api.financial.getOverduePayments,
    foundationId ? { foundationId } : "skip"
  );

  // Calculate metrics
  const totalRevenue = financialSummary?.totals.NGN.paid || 0;
  const pendingRevenue = financialSummary?.totals.NGN.pending || 0;
  const totalInvoices = financialRecords?.length || 0;
  const paidInvoices = financialRecords?.filter(r => r.status === "paid").length || 0;
  const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices * 100) : 0;

  // Group by month for trends
  const monthlyData = financialRecords?.reduce((acc, record) => {
    if (record.status === "paid" && record.paidDate) {
      const month = new Date(record.paidDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      acc[month] = (acc[month] || 0) + record.amount;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  // Group by beneficiary
  const beneficiaryData = financialRecords?.reduce((acc, record) => {
    const name = `${record.beneficiaryUser?.firstName || ''} ${record.beneficiaryUser?.lastName || ''}`.trim();
    if (name) {
      if (!acc[name]) {
        acc[name] = { total: 0, paid: 0, pending: 0, count: 0 };
      }
      acc[name].total += record.amount;
      acc[name].count += 1;
      if (record.status === "paid") {
        acc[name].paid += record.amount;
      } else if (record.status === "pending" || record.status === "approved") {
        acc[name].pending += record.amount;
      }
    }
    return acc;
  }, {} as Record<string, { total: number; paid: number; pending: number; count: number }>) || {};

  // Group by fee category
  const categoryData = financialRecords?.reduce((acc, record) => {
    const category = record.feeCategory?.name || "Uncategorized";
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }
    acc[category].total += record.amount;
    acc[category].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>) || {};

  const handleExport = (type: string) => {
    // TODO: Implement actual export functionality
    console.log(`Exporting ${type} report...`);
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Financial Reports</h1>
              <p className="text-gray-600 mt-1">Analytics and insights for financial performance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExport("pdf")}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                From {paidInvoices} paid invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Revenue</CardTitle>
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(pendingRevenue)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Collection Rate</CardTitle>
                <Target className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {collectionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {paidInvoices} of {totalInvoices} invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Overdue Amount</CardTitle>
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  overduePayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {overduePayments?.length || 0} overdue payments
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="beneficiaries">By Beneficiary</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Payment Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(financialSummary?.byStatus || {}).map(([status, count]) => {
                    const percentage = totalInvoices > 0 ? (count / totalInvoices * 100) : 0;
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case "paid": return "bg-green-500";
                        case "pending": return "bg-yellow-500";
                        case "approved": return "bg-blue-500";
                        case "overdue": return "bg-red-500";
                        default: return "bg-gray-500";
                      }
                    };

                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">{status}</span>
                          <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getStatusColor(status)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {financialRecords?.slice(0, 5).map((record) => (
                      <div key={record._id} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                        <div>
                          <p className="font-medium text-sm">
                            {record.beneficiaryUser?.firstName} {record.beneficiaryUser?.lastName}
                          </p>
                          <p className="text-xs text-gray-600">
                            {record.feeCategory?.name} • {formatDate(new Date(record.createdAt))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(record.amount, record.currency)}</p>
                          <div className="flex justify-end">
                            {record.status === "paid" && <CheckCircle className="w-3 h-3 text-green-500" />}
                            {record.status === "pending" && <Clock className="w-3 h-3 text-yellow-500" />}
                            {record.status === "overdue" && <AlertCircle className="w-3 h-3 text-red-500" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Monthly Revenue Trends
                </CardTitle>
                <CardDescription>
                  Revenue collected by month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(monthlyData).map(([month, amount]) => {
                    const maxAmount = Math.max(...Object.values(monthlyData));
                    const percentage = maxAmount > 0 ? (amount / maxAmount * 100) : 0;

                    return (
                      <div key={month} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{month}</span>
                          <span className="text-sm font-bold">{formatCurrency(amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="h-3 rounded-full bg-green-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(monthlyData).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No revenue data available yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="beneficiaries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Revenue by Beneficiary
                </CardTitle>
                <CardDescription>
                  Payment overview for each beneficiary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-gray-700">Beneficiary</th>
                        <th className="text-left p-2 font-medium text-gray-700">Total Amount</th>
                        <th className="text-left p-2 font-medium text-gray-700">Paid</th>
                        <th className="text-left p-2 font-medium text-gray-700">Pending</th>
                        <th className="text-left p-2 font-medium text-gray-700">Invoices</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(beneficiaryData)
                        .sort(([,a], [,b]) => b.total - a.total)
                        .map(([name, data]) => (
                        <tr key={name} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{name}</td>
                          <td className="p-2">{formatCurrency(data.total)}</td>
                          <td className="p-2 text-green-600">{formatCurrency(data.paid)}</td>
                          <td className="p-2 text-yellow-600">{formatCurrency(data.pending)}</td>
                          <td className="p-2">{data.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {Object.keys(beneficiaryData).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No beneficiary data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Revenue by Fee Category
                </CardTitle>
                <CardDescription>
                  Breakdown of revenue by fee type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categoryData)
                    .sort(([,a], [,b]) => b.total - a.total)
                    .map(([category, data]) => {
                    const maxAmount = Math.max(...Object.values(categoryData).map(d => d.total));
                    const percentage = maxAmount > 0 ? (data.total / maxAmount * 100) : 0;

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium">{category}</span>
                            <span className="text-xs text-gray-500 ml-2">({data.count} invoices)</span>
                          </div>
                          <span className="text-sm font-bold">{formatCurrency(data.total)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(categoryData).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No category data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}