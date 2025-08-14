"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  GraduationCap, 
  FileText, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Building2,
  Users,
  BarChart3,
  Calendar,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function FoundationSettingsPage() {
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(false);

  // Get foundation ID from user
  const foundationId = user?.foundationId as Id<"foundations"> | undefined;

  // Fetch foundation data
  const foundation = useQuery(
    api.foundations.getById,
    foundationId ? { foundationId } : "skip"
  );

  // Fetch foundation statistics
  const stats = useQuery(
    api.foundations.getStatistics,
    foundationId ? { foundationId } : "skip"
  );

  // Fetch configuration data
  const configData = useQuery(
    api.foundations.getConfigurationData,
    foundationId ? { foundationId } : "skip"
  );

  // Mutations
  const setupFoundationDefaults = useMutation(api.foundations.setupFoundationDefaults);
  const createDefaultAcademicLevels = useMutation(api.foundations.createDefaultAcademicLevels);
  const createDefaultFeeCategories = useMutation(api.foundations.createDefaultFeeCategories);
  const createDefaultDocumentTypes = useMutation(api.foundations.createDefaultDocumentTypes);

  const handleSetupFoundation = async () => {
    if (!foundationId) return;
    
    setLoading(true);
    try {
      const result = await setupFoundationDefaults({ foundationId });
      toast.success(`Foundation setup completed! Created ${result.total} configuration items.`);
    } catch (error: any) {
      toast.error(error.message || "Failed to setup foundation");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAcademicLevels = async () => {
    if (!foundationId) return;
    
    setLoading(true);
    try {
      const result = await createDefaultAcademicLevels({ foundationId });
      toast.success(`Created ${result.created} academic levels`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create academic levels");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeeCategories = async () => {
    if (!foundationId) return;
    
    setLoading(true);
    try {
      const result = await createDefaultFeeCategories({ foundationId });
      toast.success(`Created ${result.created} fee categories`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create fee categories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocumentTypes = async () => {
    if (!foundationId) return;
    
    setLoading(true);
    try {
      const result = await createDefaultDocumentTypes({ foundationId });
      toast.success(`Created ${result.created} document types`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create document types");
    } finally {
      setLoading(false);
    }
  };

  if (!foundation) {
    return (
      <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Foundation not found</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const isConfigured = configData && (
    configData.academicLevels.length > 0 ||
    configData.feeCategories.length > 0 ||
    configData.documentTypes.length > 0
  );

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Foundation Settings</h1>
            <p className="text-gray-600 mt-1">Configure and manage your foundation settings</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConfigured ? "default" : "secondary"}>
              {isConfigured ? "Configured" : "Needs Setup"}
            </Badge>
          </div>
        </div>

        {/* Foundation Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-emerald-600" />
              <div>
                <CardTitle>{foundation.name}</CardTitle>
                <CardDescription>{foundation.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">Currency</div>
                  <div className="text-sm text-gray-600">
                    {foundation.settings?.defaultCurrency || "NGN"} 
                    {foundation.settings?.exchangeRate && (
                      <span className="ml-2">@ ₦{foundation.settings.exchangeRate}/USD</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">Academic Year</div>
                  <div className="text-sm text-gray-600">
                    {foundation.settings?.academicYearStart} - {foundation.settings?.academicYearEnd}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <div className="text-sm text-gray-600">
                    {foundation.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Beneficiaries</CardTitle>
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBeneficiaries}</div>
                <p className="text-xs text-gray-600 mt-1">{stats.activeBeneficiaries} active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Applications</CardTitle>
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalApplications}</div>
                <p className="text-xs text-gray-600 mt-1">{stats.pendingApplications} pending</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Staff</CardTitle>
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-gray-600 mt-1">Total users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Programs</CardTitle>
                  <GraduationCap className="w-4 h-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activePrograms}</div>
                <p className="text-xs text-gray-600 mt-1">Active programs</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuration Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Academic Levels */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg">Academic Levels</CardTitle>
                </div>
                {configData?.academicLevels.length ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <CardDescription>
                Nigerian education system levels (Nursery → University)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Configured Levels</span>
                  <Badge variant="outline">
                    {configData?.academicLevels.length || 0}
                  </Badge>
                </div>
                
                {configData?.academicLevels.length ? (
                  <div className="text-sm text-gray-600">
                    <div>Nursery: {configData.academicLevels.filter(l => l.category === "nursery").length}</div>
                    <div>Primary: {configData.academicLevels.filter(l => l.category === "primary").length}</div>
                    <div>Secondary: {configData.academicLevels.filter(l => l.category === "secondary").length}</div>
                    <div>Tertiary: {configData.academicLevels.filter(l => l.category === "tertiary").length}</div>
                  </div>
                ) : (
                  <Button
                    onClick={handleCreateAcademicLevels}
                    disabled={loading}
                    size="sm"
                    className="w-full"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create Nigerian Levels
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fee Categories */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Fee Categories</CardTitle>
                </div>
                {configData?.feeCategories.length ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <CardDescription>
                Types of fees and expenses (Tuition, Books, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Configured Categories</span>
                  <Badge variant="outline">
                    {configData?.feeCategories.length || 0}
                  </Badge>
                </div>
                
                {configData?.feeCategories.length ? (
                  <div className="text-sm text-gray-600">
                    <div>Required: {configData.feeCategories.filter(c => c.isRequired).length}</div>
                    <div>Optional: {configData.feeCategories.filter(c => !c.isRequired).length}</div>
                    <div>Examples: {configData.feeCategories.slice(0, 3).map(c => c.name).join(", ")}</div>
                  </div>
                ) : (
                  <Button
                    onClick={handleCreateFeeCategories}
                    disabled={loading}
                    size="sm"
                    className="w-full"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create Default Categories
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document Types */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">Document Types</CardTitle>
                </div>
                {configData?.documentTypes.length ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <CardDescription>
                Required documents for applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Configured Types</span>
                  <Badge variant="outline">
                    {configData?.documentTypes.length || 0}
                  </Badge>
                </div>
                
                {configData?.documentTypes.length ? (
                  <div className="text-sm text-gray-600">
                    <div>Required: {configData.documentTypes.filter(d => d.isRequired).length}</div>
                    <div>Optional: {configData.documentTypes.filter(d => !d.isRequired).length}</div>
                    <div>Categories: {[...new Set(configData.documentTypes.map(d => d.category))].join(", ")}</div>
                  </div>
                ) : (
                  <Button
                    onClick={handleCreateDocumentTypes}
                    disabled={loading}
                    size="sm"
                    className="w-full"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create Default Types
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup Actions */}
        {!isConfigured && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Settings className="w-5 h-5" />
                Foundation Setup Required
              </CardTitle>
              <CardDescription className="text-emerald-700">
                Your foundation needs to be configured with academic levels, fee categories, and document types 
                before you can start accepting applications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSetupFoundation}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="w-4 h-4 mr-2" />
                  )}
                  Complete Foundation Setup
                </Button>
                <div className="text-sm text-emerald-700">
                  This will create default Nigerian academic levels, standard fee categories, 
                  and common document types for your foundation.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {isConfigured && (
          <Card>
            <CardHeader>
              <CardTitle>Foundation Management</CardTitle>
              <CardDescription>
                Quick actions to manage your foundation configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Update Settings
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Staff
                </Button>
                <Button variant="outline" className="justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}