"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Building2, 
  ChevronLeft, 
  Loader2, 
  Save,
  Settings,
  DollarSign,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function EditFoundationPage() {
  const params = useParams();
  const router = useRouter();
  const foundationId = params.foundationId as string;
  
  // Validate foundation ID
  const isValidId = foundationId && foundationId.length > 20 && !foundationId.includes("/");
  
  // Fetch foundation data
  const foundation = useQuery(
    api.foundations.getById,
    isValidId ? { foundationId: foundationId as Id<"foundations"> } : "skip"
  );
  
  // Mutations
  const updateFoundation = useMutation(api.foundations.update);
  const updateSettings = useMutation(api.foundations.updateSettings);
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "settings">("details");
  
  // Form state for foundation details
  const [detailsForm, setDetailsForm] = useState({
    name: "",
    registrationNumber: "",
    taxId: "",
    website: "",
    email: "",
    phone: "",
  });
  
  // Form state for settings
  const [settingsForm, setSettingsForm] = useState({
    defaultCurrency: "NGN" as "NGN" | "USD",
    exchangeRate: 1500,
    academicYearStart: "September",
    academicYearEnd: "July",
    applicationDeadline: "March 31",
    paymentTerms: "30 days",
  });
  
  // Load foundation data into forms
  useEffect(() => {
    if (foundation) {
      setDetailsForm({
        name: foundation.name || "",
        registrationNumber: foundation.description || "",
        taxId: "",
        website: "",
        email: "",
        phone: "",
      });
      
      if (foundation.settings) {
        setSettingsForm({
          defaultCurrency: foundation.settings.defaultCurrency || "NGN",
          exchangeRate: foundation.settings.exchangeRate || 1500,
          academicYearStart: foundation.settings.academicYearStart || "September",
          academicYearEnd: foundation.settings.academicYearEnd || "July",
          applicationDeadline: foundation.settings.applicationDeadline || "March 31",
          paymentTerms: foundation.settings.paymentTerms || "30 days",
        });
      }
    }
  }, [foundation]);
  
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidId) {
      toast.error("Invalid foundation ID");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await updateFoundation({
        foundationId: foundationId as Id<"foundations">,
        name: detailsForm.name || undefined,
        registrationNumber: detailsForm.registrationNumber || undefined,
        taxId: detailsForm.taxId || undefined,
        website: detailsForm.website || undefined,
        email: detailsForm.email || undefined,
        phone: detailsForm.phone || undefined,
      });
      
      toast.success("Foundation details updated successfully");
      router.push(`/admin/foundations/${foundationId}`);
    } catch (error: any) {
      console.error("Failed to update foundation:", error);
      toast.error(error.message || "Failed to update foundation");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidId) {
      toast.error("Invalid foundation ID");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await updateSettings({
        foundationId: foundationId as Id<"foundations">,
        settings: {
          defaultCurrency: settingsForm.defaultCurrency,
          exchangeRate: settingsForm.exchangeRate,
          academicYearStart: settingsForm.academicYearStart,
          academicYearEnd: settingsForm.academicYearEnd,
          applicationDeadline: settingsForm.applicationDeadline,
          paymentTerms: settingsForm.paymentTerms,
        },
      });
      
      toast.success("Foundation settings updated successfully");
      router.push(`/admin/foundations/${foundationId}`);
    } catch (error: any) {
      console.error("Failed to update settings:", error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isValidId) {
    return (
      <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Foundation ID</h2>
            <p className="text-muted-foreground mb-4">The foundation ID provided is not valid.</p>
            <Button onClick={() => router.push("/admin/foundations")}>
              Back to Foundations
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  if (!foundation) {
    return (
      <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/foundations/${foundationId}`)}
            disabled={isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8 text-emerald-600" />
              Edit Foundation
            </h1>
            <p className="text-muted-foreground mt-1">
              {foundation.name}
            </p>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "details" ? "default" : "outline"}
            onClick={() => setActiveTab("details")}
            disabled={isLoading}
          >
            Foundation Details
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "outline"}
            onClick={() => setActiveTab("settings")}
            disabled={isLoading}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
        
        {/* Details Tab */}
        {activeTab === "details" && (
          <form onSubmit={handleDetailsSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Foundation Information</CardTitle>
                <CardDescription>Update basic foundation details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Foundation Name</Label>
                    <Input
                      id="name"
                      value={detailsForm.name}
                      onChange={(e) => setDetailsForm({ ...detailsForm, name: e.target.value })}
                      placeholder="Enter foundation name"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      value={detailsForm.registrationNumber}
                      onChange={(e) => setDetailsForm({ ...detailsForm, registrationNumber: e.target.value })}
                      placeholder="CAC/XXX/XXXX"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input
                      id="taxId"
                      value={detailsForm.taxId}
                      onChange={(e) => setDetailsForm({ ...detailsForm, taxId: e.target.value })}
                      placeholder="Tax identification number"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={detailsForm.website}
                      onChange={(e) => setDetailsForm({ ...detailsForm, website: e.target.value })}
                      placeholder="https://example.com"
                      type="url"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={detailsForm.email}
                      onChange={(e) => setDetailsForm({ ...detailsForm, email: e.target.value })}
                      placeholder="foundation@example.com"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={detailsForm.phone}
                      onChange={(e) => setDetailsForm({ ...detailsForm, phone: e.target.value })}
                      placeholder="+234 XXX XXX XXXX"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/foundations/${foundationId}`)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
        
        {/* Settings Tab */}
        {activeTab === "settings" && (
          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Foundation Settings</CardTitle>
                <CardDescription>Configure operational settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select
                      value={settingsForm.defaultCurrency}
                      onValueChange={(value: "NGN" | "USD") => 
                        setSettingsForm({ ...settingsForm, defaultCurrency: value })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="exchangeRate">Exchange Rate (NGN to USD)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="exchangeRate"
                        type="number"
                        value={settingsForm.exchangeRate}
                        onChange={(e) => setSettingsForm({ 
                          ...settingsForm, 
                          exchangeRate: parseFloat(e.target.value) || 0 
                        })}
                        className="pl-10"
                        placeholder="1500"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="academicStart">Academic Year Start</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="academicStart"
                        value={settingsForm.academicYearStart}
                        onChange={(e) => setSettingsForm({ 
                          ...settingsForm, 
                          academicYearStart: e.target.value 
                        })}
                        className="pl-10"
                        placeholder="September"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="academicEnd">Academic Year End</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="academicEnd"
                        value={settingsForm.academicYearEnd}
                        onChange={(e) => setSettingsForm({ 
                          ...settingsForm, 
                          academicYearEnd: e.target.value 
                        })}
                        className="pl-10"
                        placeholder="July"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="applicationDeadline">Application Deadline</Label>
                    <Input
                      id="applicationDeadline"
                      value={settingsForm.applicationDeadline}
                      onChange={(e) => setSettingsForm({ 
                        ...settingsForm, 
                        applicationDeadline: e.target.value 
                      })}
                      placeholder="March 31"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Input
                      id="paymentTerms"
                      value={settingsForm.paymentTerms}
                      onChange={(e) => setSettingsForm({ 
                        ...settingsForm, 
                        paymentTerms: e.target.value 
                      })}
                      placeholder="30 days"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/foundations/${foundationId}`)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </ProtectedRoute>
  );
}