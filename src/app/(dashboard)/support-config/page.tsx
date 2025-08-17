"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddSupportModal } from "@/components/support-config/add-support-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Settings,
  Plus,
  Edit,
  Save,
  X,
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  AlertCircle,
  Loader2,
  ChevronRight,
  Calendar,
  Shield,
  Target,
  Clock,
  CheckCircle,
  School,
  Percent,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";

interface AmountConfigEdit {
  academicLevel: string;
  minAmount: number;
  maxAmount: number;
  defaultAmount: number;
  currency: "NGN" | "USD";
  frequency: "once" | "termly" | "monthly" | "yearly" | "per_semester";
  description?: string;
  isActive?: boolean;
  schoolTypeMultipliers?: {
    public: number;
    private: number;
    international: number;
  };
}

// Icon mapping helper
const getIconComponent = (iconName?: string) => {
  const iconMap: Record<string, any> = {
    GraduationCap: TrendingUp,
    DollarSign: DollarSign,
    BookOpen: FileText,
    FileText: FileText,
    AlertCircle: AlertCircle,
    Bus: Settings,
    Heart: Settings,
    Users: Users,
  };
  return iconMap[iconName || "FileText"] || FileText;
};

export default function SupportConfigurationPage() {
  const { user } = useCurrentUser();
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [editingAmounts, setEditingAmounts] = useState<AmountConfigEdit[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initializingSupport, setInitializingSupport] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editingDocuments, setEditingDocuments] = useState<any[]>([]);
  const [editingEligibility, setEditingEligibility] = useState<any>({});
  const [editingSettings, setEditingSettings] = useState<any>({});
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [showMultipliers, setShowMultipliers] = useState(false);
  const [editingDocCardIndex, setEditingDocCardIndex] = useState<number | null>(null);

  // Only allow admins to access this page
  if (user?.role !== "admin" && user?.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Only administrators can manage support configurations.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get all support configurations
  const supportConfigs = useQuery(
    api.supportConfig.getSupportConfigurations,
    user?.foundationId ? { foundationId: user.foundationId } : "skip"
  );

  const initializeSupport = useMutation(api.supportConfig.initializeDefaultConfigs);
  const updateConfig = useMutation(api.supportConfig.updateSupportConfig);

  const handleInitializeSupport = async () => {
    if (!user?.foundationId) return;
    
    setInitializingSupport(true);
    try {
      await initializeSupport({ foundationId: user.foundationId });
      toast.success("Support configurations initialized successfully");
    } catch (error) {
      toast.error("Failed to initialize support configurations");
      console.error(error);
    } finally {
      setInitializingSupport(false);
    }
  };

  const handleToggleActive = async (configId: Id<"supportConfigurations">, currentStatus: boolean) => {
    try {
      await updateConfig({
        configId,
        updates: { isActive: !currentStatus }
      });
      toast.success(`Support configuration ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error("Failed to update configuration");
      console.error(error);
    }
  };

  const handleSaveAmounts = async () => {
    if (!selectedConfig) return;

    try {
      await updateConfig({
        configId: selectedConfig._id,
        updates: { amountConfig: editingAmounts }
      });
      toast.success("Budget amounts updated successfully");
      setEditingTab(null);
      setEditingAmounts([]);
      // Update the selected config
      setSelectedConfig({ ...selectedConfig, amountConfig: editingAmounts });
    } catch (error) {
      toast.error("Failed to update budget amounts");
      console.error(error);
    }
  };

  const updateAmountField = (index: number, field: keyof AmountConfigEdit, value: any) => {
    const updated = [...editingAmounts];
    updated[index] = { ...updated[index], [field]: value };
    setEditingAmounts(updated);
  };

  const updateMultiplier = (index: number, schoolType: 'public' | 'private' | 'international', value: number) => {
    const updated = [...editingAmounts];
    if (!updated[index].schoolTypeMultipliers) {
      updated[index].schoolTypeMultipliers = { public: 1.0, private: 1.5, international: 2.0 };
    }
    updated[index].schoolTypeMultipliers![schoolType] = value;
    setEditingAmounts(updated);
  };

  const handleSaveAmountCard = async (index: number) => {
    if (!selectedConfig) return;

    try {
      await updateConfig({
        configId: selectedConfig._id,
        updates: { amountConfig: editingAmounts }
      });
      toast.success("Budget configuration updated successfully");
      setEditingCardIndex(null);
      // Update the selected config
      setSelectedConfig({ ...selectedConfig, amountConfig: editingAmounts });
      setEditingAmounts([]);
    } catch (error) {
      toast.error("Failed to update budget configuration");
      console.error(error);
    }
  };

  const handleDeleteAmountCard = async (index: number) => {
    if (!selectedConfig) return;
    
    // Ensure at least one configuration remains
    if (selectedConfig.amountConfig.length <= 1) {
      toast.error("At least one budget configuration is required");
      return;
    }

    try {
      const newAmountConfig = selectedConfig.amountConfig.filter((_, i) => i !== index);
      await updateConfig({
        configId: selectedConfig._id,
        updates: { amountConfig: newAmountConfig }
      });
      toast.success("Budget configuration deleted successfully");
      setEditingCardIndex(null);
      setSelectedConfig({ ...selectedConfig, amountConfig: newAmountConfig });
      setEditingAmounts([]);
    } catch (error) {
      toast.error("Failed to delete budget configuration");
      console.error(error);
    }
  };

  const handleToggleAmountStatus = async (index: number) => {
    if (!selectedConfig) return;
    
    try {
      const updatedAmounts = [...selectedConfig.amountConfig];
      updatedAmounts[index] = {
        ...updatedAmounts[index],
        isActive: updatedAmounts[index].isActive === false ? true : false
      };
      
      await updateConfig({
        configId: selectedConfig._id,
        updates: { amountConfig: updatedAmounts }
      });
      
      const status = updatedAmounts[index].isActive ? "activated" : "deactivated";
      toast.success(`Budget configuration ${status} successfully`);
      setSelectedConfig({ ...selectedConfig, amountConfig: updatedAmounts });
    } catch (error) {
      toast.error("Failed to update budget status");
      console.error(error);
    }
  };

  const handleSaveDocumentCard = async (index: number) => {
    if (!selectedConfig) return;

    try {
      await updateConfig({
        configId: selectedConfig._id,
        updates: { requiredDocuments: editingDocuments }
      });
      toast.success("Document requirement updated successfully");
      setEditingDocCardIndex(null);
      setSelectedConfig({ ...selectedConfig, requiredDocuments: editingDocuments });
      setEditingDocuments([]);
    } catch (error) {
      toast.error("Failed to update document requirement");
      console.error(error);
    }
  };

  const handleDeleteDocumentCard = async (index: number) => {
    if (!selectedConfig) return;
    
    try {
      const newDocs = selectedConfig.requiredDocuments.filter((_, i) => i !== index);
      await updateConfig({
        configId: selectedConfig._id,
        updates: { requiredDocuments: newDocs }
      });
      toast.success("Document requirement deleted successfully");
      setEditingDocCardIndex(null);
      setSelectedConfig({ ...selectedConfig, requiredDocuments: newDocs });
      setEditingDocuments([]);
    } catch (error) {
      toast.error("Failed to delete document requirement");
      console.error(error);
    }
  };

  const handleToggleDocumentStatus = async (index: number) => {
    if (!selectedConfig) return;
    
    try {
      const updatedDocs = [...selectedConfig.requiredDocuments];
      updatedDocs[index] = {
        ...updatedDocs[index],
        isActive: updatedDocs[index].isActive === false ? true : false
      };
      
      await updateConfig({
        configId: selectedConfig._id,
        updates: { requiredDocuments: updatedDocs }
      });
      
      const status = updatedDocs[index].isActive ? "activated" : "deactivated";
      toast.success(`Document requirement ${status} successfully`);
      setSelectedConfig({ ...selectedConfig, requiredDocuments: updatedDocs });
    } catch (error) {
      toast.error("Failed to update document status");
      console.error(error);
    }
  };

  const handleSaveEligibility = async () => {
    if (!selectedConfig) return;

    try {
      const { minAttendance, minGradeForRenewal, reviewFrequency, improvementRequired, ...eligibilityRules } = editingEligibility;
      
      await updateConfig({
        configId: selectedConfig._id,
        updates: { 
          eligibilityRules,
          performanceRequirements: {
            minAttendance,
            minGradeForRenewal,
            reviewFrequency,
            improvementRequired
          }
        }
      });
      toast.success("Eligibility rules updated successfully");
      setEditingTab(null);
      setEditingEligibility({});
      setSelectedConfig({ 
        ...selectedConfig, 
        eligibilityRules,
        performanceRequirements: {
          minAttendance,
          minGradeForRenewal,
          reviewFrequency,
          improvementRequired
        }
      });
    } catch (error) {
      toast.error("Failed to update eligibility rules");
      console.error(error);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedConfig) return;

    try {
      await updateConfig({
        configId: selectedConfig._id,
        updates: { applicationSettings: editingSettings }
      });
      toast.success("Settings updated successfully");
      setEditingTab(null);
      setEditingSettings({});
      setSelectedConfig({ ...selectedConfig, applicationSettings: editingSettings });
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    }
  };

  if (supportConfigs === undefined) {
    return (
      <div className="flex h-screen">
        <div className="w-80 border-r p-4">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!supportConfigs || supportConfigs.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Support Configurations
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Initialize default support configurations to get started.
            </p>
            <Button 
              onClick={handleInitializeSupport}
              disabled={initializingSupport}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {initializingSupport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Initialize Default Configurations
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const totalBudget = supportConfigs
    .filter(c => c.isActive)
    .reduce((sum, c) => sum + c.amountConfig.reduce((s, a) => s + a.maxAmount, 0), 0);

  const activeCount = supportConfigs.filter(c => c.isActive).length;

  return (
    <>
      <div className="flex h-[calc(100vh-120px)] -m-6">
        {/* Left Container - Support List - STATIC/STICKY */}
        <div className="w-80 bg-white border-r flex flex-col flex-shrink-0 sticky top-0 h-full overflow-hidden">
          {/* Sidebar Header - Fixed */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Support Types</h2>
              <Button 
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Search Box */}
            <div className="mb-3">
              <Input
                type="search"
                placeholder="Search support types..."
                className="w-full"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">Active</p>
                <p className="text-lg font-bold text-gray-900">{activeCount}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">{supportConfigs.length}</p>
              </div>
            </div>
          </div>

          {/* Support List - Scrollable within sidebar */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {supportConfigs
                .filter(config => 
                  config.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  config.supportType.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((config) => {
                const Icon = getIconComponent(config.icon);
                const isSelected = selectedConfig?._id === config._id;
                
                return (
                  <button
                    key={config._id}
                    onClick={() => {
                      setSelectedConfig(config);
                      setActiveTab("overview");
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-lg mb-2 transition-all",
                      isSelected 
                        ? "bg-emerald-50 border border-emerald-200" 
                        : "hover:bg-gray-50 border border-transparent"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        config.color === "emerald" ? "bg-emerald-100 text-emerald-600" :
                        config.color === "blue" ? "bg-blue-100 text-blue-600" :
                        config.color === "purple" ? "bg-purple-100 text-purple-600" :
                        config.color === "orange" ? "bg-orange-100 text-orange-600" :
                        config.color === "red" ? "bg-red-100 text-red-600" :
                        config.color === "teal" ? "bg-teal-100 text-teal-600" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm text-gray-900 truncate">
                            {config.displayName}
                          </h3>
                          {config.isActive ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          ) : (
                            <div className="w-2 h-2 bg-gray-300 rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {config.amountConfig.length} levels configured
                        </p>
                      </div>
                      
                      {isSelected && (
                        <ChevronRight className="w-4 h-4 text-emerald-600 mt-1" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Container - Dashboard and Tabs - SCROLLABLE */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="p-6 space-y-6">
          {/* Stats Dashboard Card */}
          <Card className="bg-white rounded-lg shadow-sm border">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-700">Active Types</p>
                      <p className="text-2xl font-bold text-emerald-900">{activeCount}</p>
                    </div>
                    <Settings className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">Total Budget</p>
                      <p className="text-xl font-bold text-blue-900">{formatCurrency(totalBudget, "NGN")}</p>
                    </div>
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700">Config Count</p>
                      <p className="text-2xl font-bold text-purple-900">{supportConfigs.length}</p>
                    </div>
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-700">Avg Processing</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {Math.round(supportConfigs.reduce((sum, c) => sum + c.applicationSettings.processingDays, 0) / supportConfigs.length)}d
                      </p>
                    </div>
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Area Card */}
          {selectedConfig ? (
            <Card className="bg-white rounded-lg shadow-sm border">
              <CardHeader className="bg-gray-50 rounded-t-lg">
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">Support Configuration</h1>
                  <p className="text-gray-600 mt-1">
                    Manage support types, eligibility rules, and budget configurations
                  </p>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-3">
                      {selectedConfig.displayName}
                      {selectedConfig.isActive ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {selectedConfig.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedConfig.isActive}
                      onCheckedChange={() => handleToggleActive(selectedConfig._id, selectedConfig.isActive)}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full rounded-none border-b">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="amounts" className="flex-1">Budget</TabsTrigger>
                    <TabsTrigger value="eligibility" className="flex-1">Eligibility</TabsTrigger>
                    <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
                    <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
                  </TabsList>

                  <div className="p-6">
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="mt-0 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Processing Time</p>
                                <p className="text-2xl font-bold">
                                  {selectedConfig.applicationSettings.processingDays} days
                                </p>
                              </div>
                              <Clock className="w-8 h-8 text-blue-500" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Active Budget Levels</p>
                                <p className="text-2xl font-bold">
                                  {(editingCardIndex !== null ? editingAmounts : selectedConfig.amountConfig)
                                    .filter(a => a.isActive !== false).length}
                                  <span className="text-sm text-gray-500">/{(editingCardIndex !== null ? editingAmounts : selectedConfig.amountConfig).length}</span>
                                </p>
                              </div>
                              <School className="w-8 h-8 text-purple-500" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Active Docs</p>
                                <p className="text-2xl font-bold">
                                  {(editingDocCardIndex !== null ? editingDocuments : selectedConfig.requiredDocuments)
                                    .filter(d => d.isMandatory && d.isActive !== false).length}
                                  <span className="text-sm text-gray-500">
                                    /{(editingDocCardIndex !== null ? editingDocuments : selectedConfig.requiredDocuments)
                                      .filter(d => d.isActive !== false).length}
                                  </span>
                                </p>
                              </div>
                              <FileText className="w-8 h-8 text-orange-500" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3">Current Configuration Summary</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            {selectedConfig.applicationSettings.requiresGuardianConsent ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-sm">Guardian Consent Required</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            {selectedConfig.applicationSettings.requiresAcademicVerification ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-sm">Academic Verification</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            {selectedConfig.applicationSettings.allowMultipleApplications ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-sm">Multiple Applications</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            {selectedConfig.performanceRequirements?.minAttendance ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-sm">Attendance Tracking</span>
                          </div>
                        </div>
                      </div>


                    </TabsContent>

                    {/* Budget Tab */}
                    <TabsContent value="amounts" className="mt-0 space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">Budget Configuration by Academic Level</h3>
                          <p className="text-xs text-gray-500 mt-1">Configure amount ranges and payment frequency for each academic level</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newConfig = {
                              academicLevel: "primary",
                              minAmount: 10000,
                              maxAmount: 50000,
                              defaultAmount: 25000,
                              currency: "NGN",
                              frequency: "termly",
                              description: ""
                            };
                            // Add new config at the beginning of the array
                            setEditingAmounts([newConfig, ...selectedConfig.amountConfig]);
                            setEditingCardIndex(0); // Edit the first item (newly added)
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Level
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {(editingCardIndex !== null ? editingAmounts : selectedConfig.amountConfig).map((amount, idx) => {
                          const isEditing = editingCardIndex === idx;
                          
                          return (
                            <div 
                              key={idx} 
                              className={cn(
                                "border rounded-lg transition-all duration-200",
                                isEditing ? "bg-emerald-50 border-emerald-300 shadow-sm" : 
                                amount.isActive === false ? "bg-gray-100 opacity-60" : "hover:bg-gray-50"
                              )}
                            >
                              {isEditing ? (
                                // Edit Mode
                                <div className="p-3 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <Select
                                        value={amount.academicLevel}
                                        onValueChange={(value) => updateAmountField(idx, 'academicLevel', value)}
                                      >
                                        <SelectTrigger className="w-40 h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="nursery">Nursery</SelectItem>
                                          <SelectItem value="primary">Primary</SelectItem>
                                          <SelectItem value="jss">Junior Secondary</SelectItem>
                                          <SelectItem value="sss">Senior Secondary</SelectItem>
                                          <SelectItem value="university">University</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        placeholder="Add description (optional)"
                                        value={amount.description || ""}
                                        onChange={(e) => updateAmountField(idx, 'description', e.target.value)}
                                        className="h-8 text-sm flex-1"
                                      />
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                        onClick={() => {
                                          setEditingCardIndex(null);
                                          setEditingAmounts([]);
                                        }}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => handleSaveAmountCard(idx)}
                                      >
                                        <Save className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-5 gap-2">
                                    <div>
                                      <Label className="text-xs text-gray-600">Min Amount</Label>
                                      <Input
                                        type="number"
                                        value={amount.minAmount}
                                        onChange={(e) => updateAmountField(idx, 'minAmount', Number(e.target.value))}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-600">Max Amount</Label>
                                      <Input
                                        type="number"
                                        value={amount.maxAmount}
                                        onChange={(e) => updateAmountField(idx, 'maxAmount', Number(e.target.value))}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-600">Default</Label>
                                      <Input
                                        type="number"
                                        value={amount.defaultAmount}
                                        onChange={(e) => updateAmountField(idx, 'defaultAmount', Number(e.target.value))}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-600">Currency</Label>
                                      <Select
                                        value={amount.currency}
                                        onValueChange={(value) => updateAmountField(idx, 'currency', value)}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="NGN">₦ NGN</SelectItem>
                                          <SelectItem value="USD">$ USD</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-600">Frequency</Label>
                                      <Select
                                        value={amount.frequency}
                                        onValueChange={(value) => updateAmountField(idx, 'frequency', value as any)}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="once">One-time</SelectItem>
                                          <SelectItem value="termly">Per Term</SelectItem>
                                          <SelectItem value="monthly">Monthly</SelectItem>
                                          <SelectItem value="per_semester">Per Semester</SelectItem>
                                          <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  
                                  {showMultipliers && (
                                    <div className="border-t pt-2">
                                      <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-3 h-3 text-gray-500" />
                                        <Label className="text-xs text-gray-600">School Type Adjustments (Optional)</Label>
                                      </div>
                                      <p className="text-xs text-gray-500 mb-2">
                                        Multipliers adjust the budget based on school type. Example: 1.5x means 50% more than base amount.
                                      </p>
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <Label className="text-xs">Public Schools</Label>
                                          <Input
                                            type="number"
                                            step="0.1"
                                            value={amount.schoolTypeMultipliers?.public || 1.0}
                                            onChange={(e) => updateMultiplier(idx, 'public', Number(e.target.value))}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Private Schools</Label>
                                          <Input
                                            type="number"
                                            step="0.1"
                                            value={amount.schoolTypeMultipliers?.private || 1.5}
                                            onChange={(e) => updateMultiplier(idx, 'private', Number(e.target.value))}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">International Schools</Label>
                                          <Input
                                            type="number"
                                            step="0.1"
                                            value={amount.schoolTypeMultipliers?.international || 2.0}
                                            onChange={(e) => updateMultiplier(idx, 'international', Number(e.target.value))}
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between pt-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs"
                                      onClick={() => setShowMultipliers(!showMultipliers)}
                                    >
                                      {showMultipliers ? "Hide" : "Show"} School Type Adjustments
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs text-red-600 hover:text-red-700"
                                      onClick={() => handleDeleteAmountCard(idx)}
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // View Mode
                                <div className="p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={cn(
                                          "font-medium text-sm capitalize",
                                          amount.isActive === false && "text-gray-500"
                                        )}>
                                          {amount.academicLevel.replace(/_/g, " ")}
                                        </span>
                                        <Badge variant="outline" className="text-xs h-5">
                                          {amount.frequency === "termly" ? "Per Term" :
                                           amount.frequency === "monthly" ? "Monthly" :
                                           amount.frequency === "per_semester" ? "Per Semester" :
                                           amount.frequency === "yearly" ? "Yearly" : "One-time"}
                                        </Badge>
                                        <Badge className="text-xs h-5 bg-emerald-100 text-emerald-700">
                                          {amount.currency}
                                        </Badge>
                                        {amount.isActive === false && (
                                          <Badge variant="secondary" className="text-xs h-5">Inactive</Badge>
                                        )}
                                      </div>
                                      {amount.description && (
                                        <p className="text-xs text-gray-500 mb-1">{amount.description}</p>
                                      )}
                                      <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                          <span className="text-xs text-gray-500">Range:</span>
                                          <p className="font-medium">
                                            {formatCurrency(amount.minAmount, amount.currency)} - {formatCurrency(amount.maxAmount, amount.currency)}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-xs text-gray-500">Default:</span>
                                          <p className="font-medium">
                                            {formatCurrency(amount.defaultAmount, amount.currency)}
                                          </p>
                                        </div>
                                        {amount.schoolTypeMultipliers && (
                                          <div>
                                            <span className="text-xs text-gray-500">School Adjustments:</span>
                                            <div className="flex gap-2">
                                              <span className="text-xs">P: {amount.schoolTypeMultipliers.public}x</span>
                                              <span className="text-xs">Pr: {amount.schoolTypeMultipliers.private}x</span>
                                              <span className="text-xs">I: {amount.schoolTypeMultipliers.international}x</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                      <Switch
                                        checked={amount.isActive !== false}
                                        onCheckedChange={() => handleToggleAmountStatus(idx)}
                                        className="h-5 w-9"
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:bg-emerald-100"
                                        onClick={() => {
                                          setEditingAmounts(selectedConfig.amountConfig);
                                          setEditingCardIndex(idx);
                                          setShowMultipliers(false);
                                        }}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:bg-red-100"
                                        onClick={() => handleDeleteAmountCard(idx)}
                                      >
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>

                    {/* Eligibility Tab */}
                    <TabsContent value="eligibility" className="mt-0 space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Eligibility Rules</h3>
                        <div className="flex gap-2">
                          {editingTab === "eligibility" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingTab(null);
                                  setEditingEligibility({});
                                }}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleSaveEligibility}
                              >
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingTab("eligibility");
                                setEditingEligibility({
                                  ...selectedConfig.eligibilityRules,
                                  ...selectedConfig.performanceRequirements
                                });
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {editingTab === "eligibility" ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Minimum Academic Level</Label>
                              <Select 
                                value={editingEligibility.minAcademicLevel || "none"}
                                onValueChange={(value) => setEditingEligibility({...editingEligibility, minAcademicLevel: value === "none" ? undefined : value})}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="No minimum" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No minimum</SelectItem>
                                  <SelectItem value="nursery_1">Nursery 1</SelectItem>
                                  <SelectItem value="primary_1">Primary 1</SelectItem>
                                  <SelectItem value="jss_1">JSS 1</SelectItem>
                                  <SelectItem value="sss_1">SSS 1</SelectItem>
                                  <SelectItem value="university_1">University Year 1</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Maximum Academic Level</Label>
                              <Select 
                                value={editingEligibility.maxAcademicLevel || "none"}
                                onValueChange={(value) => setEditingEligibility({...editingEligibility, maxAcademicLevel: value === "none" ? undefined : value})}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="No maximum" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No maximum</SelectItem>
                                  <SelectItem value="nursery_2">Nursery 2</SelectItem>
                                  <SelectItem value="primary_6">Primary 6</SelectItem>
                                  <SelectItem value="jss_3">JSS 3</SelectItem>
                                  <SelectItem value="sss_3">SSS 3</SelectItem>
                                  <SelectItem value="university_6">University Year 6</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Minimum Age</Label>
                              <Input
                                type="number"
                                value={editingEligibility.minAge || 0}
                                onChange={(e) => setEditingEligibility({...editingEligibility, minAge: Number(e.target.value)})}
                                placeholder="0 for no minimum"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Maximum Age</Label>
                              <Input
                                type="number"
                                value={editingEligibility.maxAge || 0}
                                onChange={(e) => setEditingEligibility({...editingEligibility, maxAge: Number(e.target.value)})}
                                placeholder="0 for no maximum"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Minimum Grade (%)</Label>
                              <Input
                                type="number"
                                value={editingEligibility.requiresMinGrade || 0}
                                onChange={(e) => setEditingEligibility({...editingEligibility, requiresMinGrade: Number(e.target.value)})}
                                placeholder="0 for no minimum"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Minimum Attendance (%)</Label>
                              <Input
                                type="number"
                                value={editingEligibility.minAttendance || 0}
                                onChange={(e) => setEditingEligibility({...editingEligibility, minAttendance: Number(e.target.value)})}
                                placeholder="0 for no minimum"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Min Grade for Renewal (%)</Label>
                              <Input
                                type="number"
                                value={editingEligibility.minGradeForRenewal || 0}
                                onChange={(e) => setEditingEligibility({...editingEligibility, minGradeForRenewal: Number(e.target.value)})}
                                placeholder="0 for no minimum"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Review Frequency</Label>
                              <Select 
                                value={editingEligibility.reviewFrequency || "termly"}
                                onValueChange={(value) => setEditingEligibility({...editingEligibility, reviewFrequency: value})}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="termly">Termly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="per_semester">Per Semester</SelectItem>
                                  <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedConfig.eligibilityRules.minAcademicLevel && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Target className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="text-xs text-gray-600">Minimum Level</p>
                              <p className="font-medium capitalize">
                                {selectedConfig.eligibilityRules.minAcademicLevel.replace(/_/g, " ")}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {selectedConfig.eligibilityRules.maxAcademicLevel && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Target className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="text-xs text-gray-600">Maximum Level</p>
                              <p className="font-medium capitalize">
                                {selectedConfig.eligibilityRules.maxAcademicLevel.replace(/_/g, " ")}
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedConfig.eligibilityRules.minAge && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Users className="w-5 h-5 text-purple-500" />
                            <div>
                              <p className="text-xs text-gray-600">Minimum Age</p>
                              <p className="font-medium">{selectedConfig.eligibilityRules.minAge} years</p>
                            </div>
                          </div>
                        )}

                        {selectedConfig.eligibilityRules.maxAge && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Users className="w-5 h-5 text-purple-500" />
                            <div>
                              <p className="text-xs text-gray-600">Maximum Age</p>
                              <p className="font-medium">{selectedConfig.eligibilityRules.maxAge} years</p>
                            </div>
                          </div>
                        )}

                        {selectedConfig.eligibilityRules.requiresMinGrade && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Percent className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="text-xs text-gray-600">Minimum Grade</p>
                              <p className="font-medium">{selectedConfig.eligibilityRules.requiresMinGrade}%</p>
                            </div>
                          </div>
                        )}

                        {selectedConfig.performanceRequirements?.minAttendance && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-600">Minimum Attendance</p>
                              <p className="font-medium">{selectedConfig.performanceRequirements.minAttendance}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                      )}

                      {!editingTab && selectedConfig.performanceRequirements && (
                        <div>
                          <h4 className="font-medium mb-2 mt-4">Performance Requirements</h4>
                          <div className="space-y-2">
                            {selectedConfig.performanceRequirements.minGradeForRenewal && (
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm">Minimum Grade for Renewal</span>
                                <Badge>{selectedConfig.performanceRequirements.minGradeForRenewal}%</Badge>
                              </div>
                            )}
                            {selectedConfig.performanceRequirements.reviewFrequency && (
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm">Review Frequency</span>
                                <Badge variant="outline" className="capitalize">
                                  {selectedConfig.performanceRequirements.reviewFrequency}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents" className="mt-0 space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">Required Documents</h3>
                          <p className="text-xs text-gray-500 mt-1">Configure document requirements for this support type</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newDoc = {
                              documentType: "",
                              displayName: "",
                              description: "",
                              isMandatory: true,
                              validityPeriod: 90,
                              isActive: true
                            };
                            setEditingDocuments([newDoc, ...selectedConfig.requiredDocuments]);
                            setEditingDocCardIndex(0);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Document Requirement
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {(editingDocCardIndex !== null ? editingDocuments : selectedConfig.requiredDocuments).map((doc, idx) => {
                          const isEditing = editingDocCardIndex === idx;
                          const isInactive = doc.isActive === false;
                          
                          return (
                            <div 
                              key={idx} 
                              className={cn(
                                "border rounded-lg transition-all duration-200",
                                isEditing ? "bg-emerald-50 border-emerald-300 shadow-sm" : 
                                isInactive ? "bg-gray-100 opacity-60" : "hover:bg-gray-50"
                              )}
                            >
                              {isEditing ? (
                                // Edit Mode
                                <div className="p-3 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Edit Document Requirement</h4>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                        onClick={() => {
                                          setEditingDocCardIndex(null);
                                          setEditingDocuments([]);
                                        }}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => handleSaveDocumentCard(idx)}
                                      >
                                        <Save className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs text-gray-600">Document Type ID</Label>
                                      <Input
                                        value={doc.documentType}
                                        onChange={(e) => {
                                          const updated = [...editingDocuments];
                                          updated[idx].documentType = e.target.value;
                                          setEditingDocuments(updated);
                                        }}
                                        placeholder="e.g., bank_statement"
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-600">Display Name</Label>
                                      <Input
                                        value={doc.displayName}
                                        onChange={(e) => {
                                          const updated = [...editingDocuments];
                                          updated[idx].displayName = e.target.value;
                                          setEditingDocuments(updated);
                                        }}
                                        placeholder="e.g., Bank Statement"
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <Label className="text-xs text-gray-600">Description</Label>
                                      <Input
                                        value={doc.description || ""}
                                        onChange={(e) => {
                                          const updated = [...editingDocuments];
                                          updated[idx].description = e.target.value;
                                          setEditingDocuments(updated);
                                        }}
                                        placeholder="Brief description of the document"
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-gray-600">Validity Period (days)</Label>
                                      <Input
                                        type="number"
                                        value={doc.validityPeriod || 90}
                                        onChange={(e) => {
                                          const updated = [...editingDocuments];
                                          updated[idx].validityPeriod = Number(e.target.value);
                                          setEditingDocuments(updated);
                                        }}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={doc.isMandatory}
                                          onCheckedChange={(checked) => {
                                            const updated = [...editingDocuments];
                                            updated[idx].isMandatory = checked;
                                            setEditingDocuments(updated);
                                          }}
                                        />
                                        <Label className="text-xs">Mandatory</Label>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={doc.isActive !== false}
                                          onCheckedChange={(checked) => {
                                            const updated = [...editingDocuments];
                                            updated[idx].isActive = checked;
                                            setEditingDocuments(updated);
                                          }}
                                        />
                                        <Label className="text-xs">Active</Label>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // View Mode
                                <div className="p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <FileText className={cn(
                                        "w-5 h-5 mt-0.5",
                                        isInactive ? "text-gray-400" :
                                        doc.isMandatory ? "text-red-500" : "text-yellow-500"
                                      )} />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className={cn(
                                            "font-medium text-sm",
                                            isInactive && "text-gray-500"
                                          )}>
                                            {doc.displayName}
                                          </p>
                                          {doc.isMandatory && !isInactive && (
                                            <Badge variant="destructive" className="text-xs h-5">Required</Badge>
                                          )}
                                          {doc.validityPeriod && (
                                            <Badge variant="outline" className="text-xs h-5">
                                              {doc.validityPeriod} days
                                            </Badge>
                                          )}
                                          {isInactive && (
                                            <Badge variant="secondary" className="text-xs h-5">Inactive</Badge>
                                          )}
                                        </div>
                                        {doc.description && (
                                          <p className="text-xs text-gray-500">{doc.description}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">Type: {doc.documentType}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                      <Switch
                                        checked={!isInactive}
                                        onCheckedChange={() => handleToggleDocumentStatus(idx)}
                                        className="h-5 w-9"
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:bg-emerald-100"
                                        onClick={() => {
                                          setEditingDocuments(selectedConfig.requiredDocuments);
                                          setEditingDocCardIndex(idx);
                                        }}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:bg-red-100"
                                        onClick={() => handleDeleteDocumentCard(idx)}
                                      >
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="mt-0 space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Application Settings</h3>
                        <div className="flex gap-2">
                          {editingTab === "settings" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingTab(null);
                                  setEditingSettings({});
                                }}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleSaveSettings}
                              >
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingTab("settings");
                                setEditingSettings(selectedConfig.applicationSettings);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {editingTab === "settings" ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs">Processing Days</Label>
                              <Input
                                type="number"
                                value={editingSettings.processingDays || 7}
                                onChange={(e) => setEditingSettings({...editingSettings, processingDays: Number(e.target.value)})}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Application Deadline</Label>
                              <Input
                                value={editingSettings.applicationDeadline || ""}
                                onChange={(e) => setEditingSettings({...editingSettings, applicationDeadline: e.target.value})}
                                placeholder="e.g., 30 days before term start"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Auto-Approval Threshold (%)</Label>
                              <Input
                                type="number"
                                value={editingSettings.autoApprovalThreshold || 0}
                                onChange={(e) => setEditingSettings({...editingSettings, autoApprovalThreshold: Number(e.target.value)})}
                                placeholder="0 for no auto-approval"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-green-500" />
                                <span className="text-sm font-medium">Guardian Consent Required</span>
                              </div>
                              <Switch 
                                checked={editingSettings.requiresGuardianConsent}
                                onCheckedChange={(checked) => setEditingSettings({...editingSettings, requiresGuardianConsent: checked})}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-purple-500" />
                                <span className="text-sm font-medium">Academic Verification Required</span>
                              </div>
                              <Switch 
                                checked={editingSettings.requiresAcademicVerification}
                                onCheckedChange={(checked) => setEditingSettings({...editingSettings, requiresAcademicVerification: checked})}
                              />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-indigo-500" />
                                <span className="text-sm font-medium">Allow Multiple Applications</span>
                              </div>
                              <Switch 
                                checked={editingSettings.allowMultipleApplications}
                                onCheckedChange={(checked) => setEditingSettings({...editingSettings, allowMultipleApplications: checked})}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-blue-500" />
                              <span className="font-medium">Processing Time</span>
                            </div>
                            <Badge>{selectedConfig.applicationSettings.processingDays} days</Badge>
                          </div>

                          {selectedConfig.applicationSettings.applicationDeadline && (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-orange-500" />
                                <span className="font-medium">Application Deadline</span>
                              </div>
                              <Badge variant="outline">
                                {selectedConfig.applicationSettings.applicationDeadline}
                              </Badge>
                            </div>
                          )}

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Shield className="w-5 h-5 text-green-500" />
                              <span className="font-medium">Guardian Consent</span>
                            </div>
                            <Switch 
                              checked={selectedConfig.applicationSettings.requiresGuardianConsent}
                              disabled
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5 text-purple-500" />
                              <span className="font-medium">Academic Verification</span>
                            </div>
                            <Switch 
                              checked={selectedConfig.applicationSettings.requiresAcademicVerification}
                              disabled
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Users className="w-5 h-5 text-indigo-500" />
                              <span className="font-medium">Multiple Applications</span>
                            </div>
                            <Switch 
                              checked={selectedConfig.applicationSettings.allowMultipleApplications}
                              disabled
                            />
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white rounded-lg shadow-sm border">
              <CardContent className="flex items-center justify-center p-12">
                <div className="text-center">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a Support Configuration
                  </h3>
                  <p className="text-gray-600">
                    Choose a support type from the list to view and manage its details
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </div>

      {/* Add Support Modal */}
      {showAddModal && user?.foundationId && (
        <AddSupportModal
          foundationId={user.foundationId}
          onClose={() => setShowAddModal(false)}
          onSuccess={(newSupportId) => {
            setShowAddModal(false);
            // If a new support ID is returned, select it automatically
            if (newSupportId && supportConfigs) {
              const newConfig = supportConfigs.find(config => config._id === newSupportId);
              if (newConfig) {
                setSelectedConfig(newConfig);
                setActiveTab("overview");
              }
            }
          }}
        />
      )}
    </>
  );
}