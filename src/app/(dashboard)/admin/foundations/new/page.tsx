"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Building2, 
  ChevronLeft, 
  Loader2, 
  Save,
  MapPin,
  Mail,
  Phone,
  Globe,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function NewFoundationPage() {
  const router = useRouter();
  const createFoundation = useMutation(api.foundations.create);
  const setupDefaults = useMutation(api.foundations.setupFoundationDefaults);
  
  const [isLoading, setIsLoading] = useState(false);
  const [setupDefaultData, setSetupDefaultData] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    registrationNumber: "",
    taxId: "",
    website: "",
    
    // Contact Information
    email: "",
    phone: "",
    
    // Address
    street: "",
    city: "",
    state: "",
    country: "Nigeria",
    postalCode: "",
    
    // Bank Details
    bankName: "",
    accountName: "",
    accountNumber: "",
    swiftCode: "",
    routingNumber: "",
    
    // Settings
    defaultCurrency: "NGN" as "NGN" | "USD",
    exchangeRate: 1500,
    academicYearStart: "September",
    academicYearEnd: "July",
    applicationDeadline: "March 31",
    paymentTerms: "30 days",
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    // Validate Nigerian phone number
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      toast.error("Please enter a valid Nigerian phone number");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create the foundation
      const foundationId = await createFoundation({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode || undefined,
        },
        registrationNumber: formData.registrationNumber || undefined,
        taxId: formData.taxId || undefined,
        website: formData.website || undefined,
        bankDetails: formData.bankName ? {
          bankName: formData.bankName,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          swiftCode: formData.swiftCode || undefined,
          routingNumber: formData.routingNumber || undefined,
        } : undefined,
      });
      
      // Setup default data if requested
      if (setupDefaultData) {
        try {
          await setupDefaults({ foundationId });
          toast.success("Foundation created with default configurations!");
        } catch (error) {
          console.error("Failed to setup defaults:", error);
          toast.warning("Foundation created but default setup failed. You can set it up later.");
        }
      } else {
        toast.success("Foundation created successfully!");
      }
      
      // Redirect to the foundation detail page
      router.push(`/admin/foundations/${foundationId}`);
    } catch (error: any) {
      console.error("Failed to create foundation:", error);
      toast.error(error.message || "Failed to create foundation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/foundations")}
            disabled={isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8 text-emerald-600" />
              Create New Foundation
            </h1>
            <p className="text-muted-foreground mt-1">
              Add a new foundation to the system
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Foundation identification and registration details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Foundation Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter foundation name"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">
                    Registration Number
                  </Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
                    placeholder="CAC/XXX/XXXX"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxId">
                    Tax ID
                  </Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange("taxId", e.target.value)}
                    placeholder="Tax identification number"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">
                    Website
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="https://example.com"
                      className="pl-10"
                      type="url"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Primary contact details for the foundation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="foundation@example.com"
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+234 XXX XXX XXXX"
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>Physical location of the foundation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange("street", e.target.value)}
                    placeholder="123 Main Street"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Lagos"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="Lagos State"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    placeholder="Nigeria"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    placeholder="100001"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
              <CardDescription>Banking information for financial transactions (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange("bankName", e.target.value)}
                    placeholder="First Bank of Nigeria"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={formData.accountName}
                    onChange={(e) => handleInputChange("accountName", e.target.value)}
                    placeholder="Foundation Account Name"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                    placeholder="0123456789"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="swiftCode">SWIFT Code</Label>
                  <Input
                    id="swiftCode"
                    value={formData.swiftCode}
                    onChange={(e) => handleInputChange("swiftCode", e.target.value)}
                    placeholder="FBNINGLA"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Options */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Options</CardTitle>
              <CardDescription>Configure initial foundation settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="setupDefaults"
                  checked={setupDefaultData}
                  onChange={(e) => setSetupDefaultData(e.target.checked)}
                  className="mt-1"
                  disabled={isLoading}
                />
                <div>
                  <Label htmlFor="setupDefaults" className="font-medium cursor-pointer">
                    Setup default configurations
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically create Nigerian academic levels, standard fee categories, and common document types.
                    This is recommended for new foundations.
                  </p>
                </div>
              </div>
              
              {setupDefaultData && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-emerald-600 mt-0.5" />
                    <div className="text-sm text-emerald-800">
                      <p className="font-medium mb-1">The following will be created automatically:</p>
                      <ul className="list-disc list-inside space-y-1 text-emerald-700">
                        <li>19 Nigerian academic levels (Nursery → University)</li>
                        <li>8 standard fee categories (Tuition, Books, Uniform, etc.)</li>
                        <li>8 common document types (Birth Certificate, School Certificate, etc.)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/foundations")}
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
                  Creating Foundation...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Foundation
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}