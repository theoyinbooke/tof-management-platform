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

export function FeeCategories() {
  const { user } = useCurrentUser();
  const feeCategories = useQuery(
    api.financial.getFeeCategories,
    user?.foundationId ? { foundationId: user.foundationId } : "skip"
  );
  
  const createFeeCategory = useMutation(api.financial.createFeeCategory);
  const updateFeeCategory = useMutation(api.financial.updateFeeCategory);
  const deleteFeeCategory = useMutation(api.financial.deleteFeeCategory);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isRequired: false,
    sortOrder: 0,
    isActive: true,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isRequired: false,
      sortOrder: feeCategories?.length || 0,
      isActive: true,
    });
    setIsAdding(false);
    setEditingId(null);
  };
  
  useEffect(() => {
    if (!isAdding && !editingId && feeCategories?.length) {
      resetForm();
    }
  }, [isAdding, editingId, feeCategories]);
  
  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      isRequired: false,
      sortOrder: feeCategories?.length || 0,
      isActive: true,
    });
  };
  
  const handleEdit = (category: any) => {
    setIsAdding(false);
    setEditingId(category._id);
    setFormData({
      name: category.name,
      description: category.description || "",
      isRequired: category.isRequired,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
  };
  
  const handleDelete = async (categoryId: string) => {
    if (!user?.foundationId) return;
    
    try {
      await deleteFeeCategory({
        feeCategoryId: categoryId,
        foundationId: user.foundationId,
      });
      toast.success("Fee category deleted successfully");
    } catch (error) {
      console.error("Error deleting fee category:", error);
      toast.error("Failed to delete fee category");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.foundationId) return;
    
    setIsSaving(true);
    
    try {
      if (editingId) {
        // Update existing fee category
        await updateFeeCategory({
          feeCategoryId: editingId,
          foundationId: user.foundationId,
          name: formData.name,
          description: formData.description,
          isRequired: formData.isRequired,
          sortOrder: formData.sortOrder,
          isActive: formData.isActive,
        });
        toast.success("Fee category updated successfully");
      } else {
        // Create new fee category
        await createFeeCategory({
          foundationId: user.foundationId,
          name: formData.name,
          description: formData.description,
          isRequired: formData.isRequired,
          sortOrder: formData.sortOrder,
          isActive: formData.isActive,
        });
        toast.success("Fee category created successfully");
      }
      
      resetForm();
    } catch (error) {
      console.error("Error saving fee category:", error);
      toast.error("Failed to save fee category");
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
              <CardTitle>Fee Categories</CardTitle>
              <CardDescription>
                Configure different types of fees tracked by the system
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Form for adding/editing */}
          {(isAdding || editingId) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingId ? "Edit Fee Category" : "Add Fee Category"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Category Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="e.g., Tuition, Books, Uniform"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="sortOrder">Sort Order</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => handleChange("sortOrder", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        placeholder="Enter description for this fee category"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="isRequired">Required</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isRequired"
                          checked={formData.isRequired}
                          onCheckedChange={(checked) => handleChange("isRequired", checked)}
                        />
                        <span>{formData.isRequired ? "Yes" : "No"}</span>
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
          
          {/* List of fee categories */}
          <div className="space-y-4">
            {feeCategories?.map((category) => (
              <Card key={category._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${category.isRequired ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>
                        {category.isRequired ? "Required" : "Optional"}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${category.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!feeCategories || feeCategories.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No fee categories configured yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}