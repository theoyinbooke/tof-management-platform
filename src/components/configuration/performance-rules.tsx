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
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export function PerformanceRules() {
  const { user } = useCurrentUser();
  const performanceRules = useQuery(
    api.alerts.getPerformanceRules,
    user?.foundationId ? { foundationId: user.foundationId } : "skip"
  );
  
  const createPerformanceRule = useMutation(api.alerts.createPerformanceRule);
  const updatePerformanceRule = useMutation(api.alerts.updatePerformanceRule);
  const deletePerformanceRule = useMutation(api.alerts.deletePerformanceRule);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    conditions: {
      consecutiveTermsBelow: undefined as number | undefined,
      gradeThreshold: undefined as number | undefined,
      attendanceThreshold: undefined as number | undefined,
      missedUploads: undefined as number | undefined,
    },
    actions: {
      notify_admin: false,
      flag_for_review: false,
      schedule_intervention: false,
    },
    isActive: true,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      conditions: {
        consecutiveTermsBelow: undefined,
        gradeThreshold: undefined,
        attendanceThreshold: undefined,
        missedUploads: undefined,
      },
      actions: {
        notify_admin: false,
        flag_for_review: false,
        schedule_intervention: false,
      },
      isActive: true,
    });
    setIsAdding(false);
    setEditingId(null);
  };
  
  useEffect(() => {
    if (!isAdding && !editingId && performanceRules?.length) {
      resetForm();
    }
  }, [isAdding, editingId, performanceRules]);
  
  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleConditionChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [field]: value === "" ? undefined : parseInt(value) || undefined
      }
    }));
  };
  
  const handleActionChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      actions: {
        ...prev.actions,
        [field]: checked
      }
    }));
  };
  
  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    resetForm();
  };
  
  const handleEdit = (rule: any) => {
    setIsAdding(false);
    setEditingId(rule._id);
    setFormData({
      name: rule.name,
      description: rule.description,
      conditions: {
        consecutiveTermsBelow: rule.conditions?.consecutiveTermsBelow,
        gradeThreshold: rule.conditions?.gradeThreshold,
        attendanceThreshold: rule.conditions?.attendanceThreshold,
        missedUploads: rule.conditions?.missedUploads,
      },
      actions: {
        notify_admin: rule.actions?.includes("notify_admin") || false,
        flag_for_review: rule.actions?.includes("flag_for_review") || false,
        schedule_intervention: rule.actions?.includes("schedule_intervention") || false,
      },
      isActive: rule.isActive,
    });
  };
  
  const handleDelete = async (ruleId: string) => {
    if (!user?.foundationId) return;
    
    try {
      await deletePerformanceRule({
        ruleId: ruleId,
        foundationId: user.foundationId,
      });
      toast.success("Performance rule deleted successfully");
    } catch (error) {
      console.error("Error deleting performance rule:", error);
      toast.error("Failed to delete performance rule");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.foundationId) return;
    
    setIsSaving(true);
    
    try {
      // Prepare actions array
      const actions = Object.entries(formData.actions)
        .filter(([_, checked]) => checked)
        .map(([action]) => action);
      
      if (editingId) {
        // Update existing performance rule
        await updatePerformanceRule({
          ruleId: editingId,
          foundationId: user.foundationId,
          name: formData.name,
          description: formData.description,
          conditions: formData.conditions,
          actions: actions,
          isActive: formData.isActive,
        });
        toast.success("Performance rule updated successfully");
      } else {
        // Create new performance rule
        await createPerformanceRule({
          foundationId: user.foundationId,
          name: formData.name,
          description: formData.description,
          conditions: formData.conditions,
          actions: actions,
          isActive: formData.isActive,
        });
        toast.success("Performance rule created successfully");
      }
      
      resetForm();
    } catch (error) {
      console.error("Error saving performance rule:", error);
      toast.error("Failed to save performance rule");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    resetForm();
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Performance Rules</CardTitle>
              <CardDescription>
                Configure automated alert rules for academic performance
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Form for adding/editing */}
          {(isAdding || editingId) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingId ? "Edit Performance Rule" : "Add Performance Rule"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Rule Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="e.g., Poor Performance Alert"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      placeholder="Enter description for this rule"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Conditions</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="consecutiveTermsBelow">Consecutive Terms Below Threshold</Label>
                        <Input
                          id="consecutiveTermsBelow"
                          type="number"
                          value={formData.conditions.consecutiveTermsBelow || ""}
                          onChange={(e) => handleConditionChange("consecutiveTermsBelow", e.target.value)}
                          placeholder="e.g., 2"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="gradeThreshold">Grade Threshold (%)</Label>
                        <Input
                          id="gradeThreshold"
                          type="number"
                          value={formData.conditions.gradeThreshold || ""}
                          onChange={(e) => handleConditionChange("gradeThreshold", e.target.value)}
                          placeholder="e.g., 60"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="attendanceThreshold">Attendance Threshold (%)</Label>
                        <Input
                          id="attendanceThreshold"
                          type="number"
                          value={formData.conditions.attendanceThreshold || ""}
                          onChange={(e) => handleConditionChange("attendanceThreshold", e.target.value)}
                          placeholder="e.g., 75"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="missedUploads">Missed Report Uploads</Label>
                        <Input
                          id="missedUploads"
                          type="number"
                          value={formData.conditions.missedUploads || ""}
                          onChange={(e) => handleConditionChange("missedUploads", e.target.value)}
                          placeholder="e.g., 2"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Actions</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="notify_admin"
                          checked={formData.actions.notify_admin}
                          onCheckedChange={(checked) => handleActionChange("notify_admin", checked as boolean)}
                        />
                        <Label htmlFor="notify_admin">Notify Admin</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="flag_for_review"
                          checked={formData.actions.flag_for_review}
                          onCheckedChange={(checked) => handleActionChange("flag_for_review", checked as boolean)}
                        />
                        <Label htmlFor="flag_for_review">Flag for Review</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="schedule_intervention"
                          checked={formData.actions.schedule_intervention}
                          onCheckedChange={(checked) => handleActionChange("schedule_intervention", checked as boolean)}
                        />
                        <Label htmlFor="schedule_intervention">Schedule Intervention</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="isActive">Active</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleChange("isActive", checked)}
                      />
                      <span>{formData.isActive ? "Yes" : "No"}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          
          {/* List of performance rules */}
          <div className="space-y-4">
            {performanceRules?.map((rule) => (
              <Card key={rule._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{rule.name}</h3>
                      <p className="text-sm text-gray-500">{rule.description}</p>
                      <div className="mt-2 text-xs text-gray-400">
                        {rule.conditions?.consecutiveTermsBelow && (
                          <span className="mr-2">Consecutive terms below: {rule.conditions.consecutiveTermsBelow}</span>
                        )}
                        {rule.conditions?.gradeThreshold && (
                          <span className="mr-2">Grade threshold: {rule.conditions.gradeThreshold}%</span>
                        )}
                        {rule.conditions?.attendanceThreshold && (
                          <span className="mr-2">Attendance threshold: {rule.conditions.attendanceThreshold}%</span>
                        )}
                        {rule.conditions?.missedUploads && (
                          <span>Missed uploads: {rule.conditions.missedUploads}</span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Actions: {rule.actions?.join(", ")}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${rule.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </span>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(rule._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!performanceRules || performanceRules.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No performance rules configured yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}