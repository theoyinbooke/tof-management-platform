"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Building2, Plus, Settings, Trash2, Edit, Users, GraduationCap, FileText, DollarSign, ChevronRight, Loader2, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Activity, Power, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface FoundationWithStats {
  _id: Id<"foundations">;
  name: string;
  description?: string;
  logo?: Id<"_storage">;
  settings: {
    defaultCurrency: "NGN" | "USD";
    exchangeRate: number;
    academicYearStart: string;
    academicYearEnd: string;
    applicationDeadline: string;
    paymentTerms: string;
  };
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  stats: {
    beneficiaries: number;
    users: number;
  };
}

export function FoundationManagement() {
  const foundations = useQuery(api.foundations.getAll) as FoundationWithStats[] | undefined;
  const createFoundation = useMutation(api.foundations.create);
  const updateFoundation = useMutation(api.foundations.update);
  const updateSettings = useMutation(api.foundations.updateSettings);
  const setupDefaults = useMutation(api.foundations.setupFoundationDefaults);
  const toggleStatus = useMutation(api.foundations.toggleStatus);
  const deleteFoundation = useMutation(api.foundations.deleteFoundation);
  
  const [selectedFoundation, setSelectedFoundation] = useState<FoundationWithStats | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states for creating new foundation
  const [newFoundation, setNewFoundation] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "Nigeria",
    postalCode: "",
    registrationNumber: "",
    taxId: "",
    website: "",
  });

  // Form states for editing foundation
  const [editFoundation, setEditFoundation] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "Nigeria",
    postalCode: "",
    registrationNumber: "",
    taxId: "",
    website: "",
  });

  // Settings form state
  const [settings, setSettings] = useState({
    defaultCurrency: "NGN" as "NGN" | "USD",
    exchangeRate: 1500,
    academicYearStart: "September",
    academicYearEnd: "July",
    applicationDeadline: "March 31",
    paymentTerms: "30 days",
  });

  const handleCreateFoundation = async () => {
    if (!newFoundation.name || !newFoundation.email || !newFoundation.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const foundationId = await createFoundation({
        name: newFoundation.name,
        email: newFoundation.email,
        phone: newFoundation.phone,
        address: {
          street: newFoundation.street,
          city: newFoundation.city,
          state: newFoundation.state,
          country: newFoundation.country,
          postalCode: newFoundation.postalCode,
        },
        registrationNumber: newFoundation.registrationNumber || undefined,
        taxId: newFoundation.taxId || undefined,
        website: newFoundation.website || undefined,
      });

      // Setup default data for the new foundation
      await setupDefaults({ foundationId });

      toast.success("Foundation created successfully with default configurations");
      setIsCreateDialogOpen(false);
      resetNewFoundationForm();
    } catch (error) {
      console.error("Failed to create foundation:", error);
      toast.error("Failed to create foundation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFoundation = async () => {
    if (!selectedFoundation) return;

    setIsLoading(true);
    try {
      await updateFoundation({
        foundationId: selectedFoundation._id,
        name: editFoundation.name || undefined,
        email: editFoundation.email || undefined,
        phone: editFoundation.phone || undefined,
        registrationNumber: editFoundation.registrationNumber || undefined,
        taxId: editFoundation.taxId || undefined,
        website: editFoundation.website || undefined,
      });

      toast.success("Foundation updated successfully");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update foundation:", error);
      toast.error("Failed to update foundation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedFoundation) return;

    setIsLoading(true);
    try {
      await updateSettings({
        foundationId: selectedFoundation._id,
        settings: {
          defaultCurrency: settings.defaultCurrency,
          exchangeRate: settings.exchangeRate,
          academicYearStart: settings.academicYearStart,
          academicYearEnd: settings.academicYearEnd,
          applicationDeadline: settings.applicationDeadline,
          paymentTerms: settings.paymentTerms,
        },
      });

      toast.success("Settings updated successfully");
      setIsSettingsDialogOpen(false);
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  const resetNewFoundationForm = () => {
    setNewFoundation({
      name: "",
      email: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      country: "Nigeria",
      postalCode: "",
      registrationNumber: "",
      taxId: "",
      website: "",
    });
  };

  const openEditDialog = (foundation: FoundationWithStats) => {
    setSelectedFoundation(foundation);
    setEditFoundation({
      name: foundation.name,
      email: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      country: "Nigeria",
      postalCode: "",
      registrationNumber: foundation.description || "",
      taxId: "",
      website: "",
    });
    setIsEditDialogOpen(true);
  };

  const openSettingsDialog = (foundation: FoundationWithStats) => {
    setSelectedFoundation(foundation);
    setSettings(foundation.settings);
    setIsSettingsDialogOpen(true);
  };

  const handleToggleStatus = async (foundation: FoundationWithStats) => {
    setIsLoading(true);
    try {
      const result = await toggleStatus({ foundationId: foundation._id });
      toast.success(
        result.newStatus 
          ? `${foundation.name} has been activated` 
          : `${foundation.name} has been deactivated`
      );
    } catch (error) {
      console.error("Failed to toggle foundation status:", error);
      toast.error("Failed to update foundation status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFoundation = async (foundation: FoundationWithStats) => {
    if (!confirm(`Are you sure you want to delete ${foundation.name}? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteFoundation({ foundationId: foundation._id });
      toast.success(`${foundation.name} has been deleted`);
    } catch (error: any) {
      console.error("Failed to delete foundation:", error);
      toast.error(error.message || "Failed to delete foundation");
    } finally {
      setIsLoading(false);
    }
  };

  if (foundations === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Foundation Management</h2>
          <p className="text-muted-foreground">
            Manage all foundations in the system
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Foundation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Foundation</DialogTitle>
              <DialogDescription>
                Add a new foundation to the system. Default configurations will be created automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Foundation Name *</Label>
                  <Input
                    id="name"
                    value={newFoundation.name}
                    onChange={(e) => setNewFoundation({ ...newFoundation, name: e.target.value })}
                    placeholder="Enter foundation name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newFoundation.email}
                    onChange={(e) => setNewFoundation({ ...newFoundation, email: e.target.value })}
                    placeholder="foundation@example.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={newFoundation.phone}
                    onChange={(e) => setNewFoundation({ ...newFoundation, phone: e.target.value })}
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={newFoundation.website}
                    onChange={(e) => setNewFoundation({ ...newFoundation, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={newFoundation.registrationNumber}
                    onChange={(e) => setNewFoundation({ ...newFoundation, registrationNumber: e.target.value })}
                    placeholder="CAC/XXX/XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={newFoundation.taxId}
                    onChange={(e) => setNewFoundation({ ...newFoundation, taxId: e.target.value })}
                    placeholder="Tax identification number"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Address Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={newFoundation.street}
                      onChange={(e) => setNewFoundation({ ...newFoundation, street: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={newFoundation.city}
                      onChange={(e) => setNewFoundation({ ...newFoundation, city: e.target.value })}
                      placeholder="Lagos"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={newFoundation.state}
                      onChange={(e) => setNewFoundation({ ...newFoundation, state: e.target.value })}
                      placeholder="Lagos State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={newFoundation.country}
                      onChange={(e) => setNewFoundation({ ...newFoundation, country: e.target.value })}
                      placeholder="Nigeria"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={newFoundation.postalCode}
                      onChange={(e) => setNewFoundation({ ...newFoundation, postalCode: e.target.value })}
                      placeholder="100001"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateFoundation} 
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Foundation"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Foundations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{foundations.length}</div>
            <p className="text-xs text-muted-foreground">
              Active foundations in system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beneficiaries</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {foundations.reduce((acc, f) => acc + f.stats.beneficiaries, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all foundations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {foundations.reduce((acc, f) => acc + f.stats.users, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              System users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Beneficiaries</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {foundations.length > 0 
                ? Math.round(foundations.reduce((acc, f) => acc + f.stats.beneficiaries, 0) / foundations.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per foundation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Foundations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Foundations</CardTitle>
          <CardDescription>
            View and manage all foundations registered in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foundation Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Beneficiaries</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foundations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No foundations found. Create your first foundation to get started.
                  </TableCell>
                </TableRow>
              ) : (
                foundations.map((foundation) => (
                  <TableRow key={foundation._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                        {foundation.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "capitalize",
                        foundation.isActive 
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" 
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                      )}>
                        {foundation.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {foundation.settings.defaultCurrency}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3 text-muted-foreground" />
                        {foundation.stats.beneficiaries}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {foundation.stats.users}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(foundation.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditDialog(foundation)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSettingsDialog(foundation)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Configure Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(foundation)}
                            className={foundation.isActive ? "text-orange-600" : "text-emerald-600"}
                          >
                            <Power className="mr-2 h-4 w-4" />
                            {foundation.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          {foundation.stats.beneficiaries === 0 && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteFoundation(foundation)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Foundation
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Foundation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Foundation</DialogTitle>
            <DialogDescription>
              Update foundation information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Foundation Name</Label>
                <Input
                  id="edit-name"
                  value={editFoundation.name}
                  onChange={(e) => setEditFoundation({ ...editFoundation, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFoundation.email}
                  onChange={(e) => setEditFoundation({ ...editFoundation, email: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editFoundation.phone}
                  onChange={(e) => setEditFoundation({ ...editFoundation, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={editFoundation.website}
                  onChange={(e) => setEditFoundation({ ...editFoundation, website: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-registration">Registration Number</Label>
                <Input
                  id="edit-registration"
                  value={editFoundation.registrationNumber}
                  onChange={(e) => setEditFoundation({ ...editFoundation, registrationNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tax">Tax ID</Label>
                <Input
                  id="edit-tax"
                  value={editFoundation.taxId}
                  onChange={(e) => setEditFoundation({ ...editFoundation, taxId: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateFoundation} 
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Foundation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Foundation Settings</DialogTitle>
            <DialogDescription>
              Configure foundation operational settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select
                  value={settings.defaultCurrency}
                  onValueChange={(value: "NGN" | "USD") => setSettings({ ...settings, defaultCurrency: value })}
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
                <Label htmlFor="exchange-rate">Exchange Rate (NGN to USD)</Label>
                <Input
                  id="exchange-rate"
                  type="number"
                  value={settings.exchangeRate}
                  onChange={(e) => setSettings({ ...settings, exchangeRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academic-start">Academic Year Start</Label>
                <Input
                  id="academic-start"
                  value={settings.academicYearStart}
                  onChange={(e) => setSettings({ ...settings, academicYearStart: e.target.value })}
                  placeholder="September"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic-end">Academic Year End</Label>
                <Input
                  id="academic-end"
                  value={settings.academicYearEnd}
                  onChange={(e) => setSettings({ ...settings, academicYearEnd: e.target.value })}
                  placeholder="July"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="application-deadline">Application Deadline</Label>
                <Input
                  id="application-deadline"
                  value={settings.applicationDeadline}
                  onChange={(e) => setSettings({ ...settings, applicationDeadline: e.target.value })}
                  placeholder="March 31"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-terms">Payment Terms</Label>
                <Input
                  id="payment-terms"
                  value={settings.paymentTerms}
                  onChange={(e) => setSettings({ ...settings, paymentTerms: e.target.value })}
                  placeholder="30 days"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateSettings} 
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}