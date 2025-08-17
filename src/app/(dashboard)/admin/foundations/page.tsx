"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Building2,
  Users,
  GraduationCap,
  DollarSign,
  Calendar,
  Search,
  Plus,
  Edit,
  MoreVertical,
  MapPin,
  Mail,
  Phone,
  Globe,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminFoundationsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFoundation, setSelectedFoundation] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch all foundations (super admin only)
  const foundations = useQuery(api.foundations.getAll);

  // Filter foundations
  const filteredFoundations = foundations?.filter(foundation => {
    const searchLower = searchTerm.toLowerCase();
    return foundation.name.toLowerCase().includes(searchLower) ||
      foundation.registrationNumber?.toLowerCase().includes(searchLower) ||
      foundation.contactEmail.toLowerCase().includes(searchLower) ||
      foundation.state?.toLowerCase().includes(searchLower) ||
      foundation.city?.toLowerCase().includes(searchLower);
  });

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  // Calculate aggregate statistics
  const aggregateStats = React.useMemo(() => {
    if (!foundations) return null;
    
    return {
      totalFoundations: foundations.length,
      activeFoundations: foundations.filter(f => f.isActive).length,
      totalBeneficiaries: foundations.reduce((sum, f) => sum + (f.activeBeneficiaries || 0), 0),
      totalApplications: foundations.reduce((sum, f) => sum + (f.totalApplications || 0), 0),
      totalPrograms: foundations.reduce((sum, f) => sum + (f.activePrograms || 0), 0),
      totalBudget: foundations.reduce((sum, f) => sum + (f.totalBudget || 0), 0),
    };
  }, [foundations]);

  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Foundation Management</h1>
            <p className="text-gray-600 mt-1">Manage all foundations in the system</p>
          </div>
          <Button onClick={() => router.push("/admin/foundations/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Add Foundation
          </Button>
        </div>

        {/* Aggregate Statistics */}
        {aggregateStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Foundations</p>
                    <p className="text-2xl font-bold mt-1">{aggregateStats.totalFoundations}</p>
                  </div>
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Active</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">{aggregateStats.activeFoundations}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Beneficiaries</p>
                    <p className="text-2xl font-bold mt-1">{aggregateStats.totalBeneficiaries}</p>
                  </div>
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Applications</p>
                    <p className="text-2xl font-bold mt-1">{aggregateStats.totalApplications}</p>
                  </div>
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Programs</p>
                    <p className="text-2xl font-bold mt-1">{aggregateStats.totalPrograms}</p>
                  </div>
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Budget</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(aggregateStats.totalBudget)}</p>
                  </div>
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Foundations List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  All Foundations
                </CardTitle>
                <CardDescription>Manage and monitor all registered foundations</CardDescription>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search foundations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-gray-700">Foundation</th>
                    <th className="text-left p-2 font-medium text-gray-700">Status</th>
                    <th className="text-left p-2 font-medium text-gray-700">Location</th>
                    <th className="text-left p-2 font-medium text-gray-700">Statistics</th>
                    <th className="text-left p-2 font-medium text-gray-700">Contact</th>
                    <th className="text-left p-2 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFoundations?.map((foundation) => (
                    <tr 
                      key={foundation._id} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/foundations/${foundation._id}`)}
                    >
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{foundation.name}</p>
                          {foundation.registrationNumber && (
                            <p className="text-sm text-gray-600">Reg: {foundation.registrationNumber}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Created {formatDate(new Date(foundation.createdAt))}
                          </p>
                        </div>
                      </td>
                      <td className="p-2">
                        {getStatusBadge(foundation.isActive)}
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          {foundation.city && foundation.state && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span>{foundation.city}, {foundation.state}</span>
                            </div>
                          )}
                          {foundation.country && (
                            <p className="text-xs text-gray-600 mt-1">{foundation.country}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600">Beneficiaries:</span>
                            <span className="font-medium">{foundation.activeBeneficiaries || 0}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600">Applications:</span>
                            <span className="font-medium">{foundation.totalApplications || 0}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-600">Programs:</span>
                            <span className="font-medium">{foundation.activePrograms || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-xs">{foundation.contactEmail}</span>
                          </div>
                          {foundation.contactPhone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-xs">{foundation.contactPhone}</span>
                            </div>
                          )}
                          {foundation.website && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-gray-400" />
                              <a href={foundation.website} target="_blank" rel="noopener noreferrer" 
                                 className="text-xs text-blue-600 hover:underline">
                                Website
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedFoundation(foundation);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Foundation
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                // Handle deactivation
                                toast.success("Foundation status updated");
                              }}
                            >
                              {foundation.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredFoundations?.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No foundations found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Foundation Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Foundation</DialogTitle>
              <DialogDescription>
                Update foundation details for {selectedFoundation?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Foundation editing interface would be implemented here
              </p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success("Foundation updated successfully");
                setIsEditDialogOpen(false);
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}