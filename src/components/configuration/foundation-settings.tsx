"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FoundationSettings() {
  const { user } = useCurrentUser();
  const foundation = useQuery(
    api.foundations.getById,
    user?.foundationId ? { foundationId: user.foundationId } : "skip"
  );
  
  const updateSettings = useMutation(api.foundations.updateSettings);
  const updateFoundation = useMutation(api.foundations.update);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    defaultCurrency: "NGN",
    exchangeRate: 1500,
    academicYearStart: "September",
    academicYearEnd: "July",
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (foundation) {
      setFormData({
        name: foundation.name || "",
        description: foundation.description || "",
        defaultCurrency: foundation.settings?.defaultCurrency || "NGN",
        exchangeRate: foundation.settings?.exchangeRate || 1500,
        academicYearStart: foundation.settings?.academicYearStart || "September",
        academicYearEnd: foundation.settings?.academicYearEnd || "July",
      });
    }
  }, [foundation]);
  
  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.foundationId) return;
    
    setIsSaving(true);
    
    try {
      // Update foundation details
      await updateFoundation({
        foundationId: user.foundationId,
        name: formData.name,
        description: formData.description,
      });
      
      // Update foundation settings
      await updateSettings({
        foundationId: user.foundationId,
        settings: {
          defaultCurrency: formData.defaultCurrency as "NGN" | "USD",
          exchangeRate: formData.exchangeRate,
          academicYearStart: formData.academicYearStart,
          academicYearEnd: formData.academicYearEnd,
        },
      });
      
      toast.success("Foundation settings updated successfully");
    } catch (error) {
      console.error("Error updating foundation settings:", error);
      toast.error("Failed to update foundation settings");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Foundation Settings</CardTitle>
        <CardDescription>
          Configure basic foundation information and operational settings
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foundation Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Foundation Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Foundation Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter foundation name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter foundation description"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          {/* Financial Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Select
                  value={formData.defaultCurrency}
                  onValueChange={(value) => handleChange("defaultCurrency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exchangeRate">Exchange Rate (NGN to USD)</Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.01"
                  value={formData.exchangeRate}
                  onChange={(e) => handleChange("exchangeRate", parseFloat(e.target.value) || 0)}
                  placeholder="Enter exchange rate"
                />
              </div>
            </div>
          </div>
          
          {/* Academic Year Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Academic Year Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academicYearStart">Academic Year Start</Label>
                <Select
                  value={formData.academicYearStart}
                  onValueChange={(value) => handleChange("academicYearStart", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select start month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="January">January</SelectItem>
                    <SelectItem value="February">February</SelectItem>
                    <SelectItem value="March">March</SelectItem>
                    <SelectItem value="April">April</SelectItem>
                    <SelectItem value="May">May</SelectItem>
                    <SelectItem value="June">June</SelectItem>
                    <SelectItem value="July">July</SelectItem>
                    <SelectItem value="August">August</SelectItem>
                    <SelectItem value="September">September</SelectItem>
                    <SelectItem value="October">October</SelectItem>
                    <SelectItem value="November">November</SelectItem>
                    <SelectItem value="December">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="academicYearEnd">Academic Year End</Label>
                <Select
                  value={formData.academicYearEnd}
                  onValueChange={(value) => handleChange("academicYearEnd", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select end month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="January">January</SelectItem>
                    <SelectItem value="February">February</SelectItem>
                    <SelectItem value="March">March</SelectItem>
                    <SelectItem value="April">April</SelectItem>
                    <SelectItem value="May">May</SelectItem>
                    <SelectItem value="June">June</SelectItem>
                    <SelectItem value="July">July</SelectItem>
                    <SelectItem value="August">August</SelectItem>
                    <SelectItem value="September">September</SelectItem>
                    <SelectItem value="October">October</SelectItem>
                    <SelectItem value="November">November</SelectItem>
                    <SelectItem value="December">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Foundation Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}