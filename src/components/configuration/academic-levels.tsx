"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2 } from "lucide-react";

export function AcademicLevels() {
  const { user } = useCurrentUser();
  const academicLevels = useQuery(
    api.academic.getByFoundation,
    user?.foundationId ? { foundationId: user.foundationId } : "skip"
  );
  
  const createAcademicLevel = useMutation(api.academic.create);
  const updateAcademicLevel = useMutation(api.academic.update);
  const deleteAcademicLevel = useMutation(api.academic.remove);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "primary" as "nursery" | "primary" | "secondary" | "university",
    sortOrder: 0,
    isActive: true,
  });
  
  const [isSaving, setIsSaving] = useState(false);
  
  const resetForm = () => {
    setFormData({
      name: "",
      category: "primary",
      sortOrder: academicLevels?.length || 0,
      isActive: true,
    });
    setIsAdding(false);
    setEditingId(null);
  };
  
  useEffect(() => {
    if (!isAdding && !editingId && academicLevels?.length) {
      resetForm();
    }
  }, [isAdding, editingId, academicLevels]);
  
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
      category: "primary",
      sortOrder: academicLevels?.length || 0,
      isActive: true,
    });
  };
  
  const handleEdit = (level: any) => {
    setIsAdding(false);
    setEditingId(level._id);
    setFormData({
      name: level.name,
      category: level.category,
      sortOrder: level.sortOrder,
      isActive: level.isActive,
    });
  };
  
  const handleDelete = async (levelId: string) => {
    if (!user?.foundationId) return;
    
    try {
      await deleteAcademicLevel({
        academicLevelId: levelId,
        foundationId: user.foundationId,
      });
      toast.success("Academic level deleted successfully");
    } catch (error) {
      console.error("Error deleting academic level:", error);
      toast.error("Failed to delete academic level");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.foundationId) return;
    
    setIsSaving(true);
    
    try {
      if (editingId) {
        // Update existing academic level
        await updateAcademicLevel({
          academicLevelId: editingId,
          foundationId: user.foundationId,
          name: formData.name,
          category: formData.category,
          sortOrder: formData.sortOrder,
          isActive: formData.isActive,
        });
        toast.success("Academic level updated successfully");
      } else {
        // Create new academic level
        await createAcademicLevel({
          foundationId: user.foundationId,
          name: formData.name,
          category: formData.category,
          sortOrder: formData.sortOrder,
          isActive: formData.isActive,
        });
        toast.success("Academic level created successfully");
      }
      
      resetForm();
    } catch (error) {
      console.error("Error saving academic level:", error);
      toast.error("Failed to save academic level");
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
              <CardTitle>Academic Levels</CardTitle>
              <CardDescription>
                Configure education levels for the Nigerian education system
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Level
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Form for adding/editing */}
          {(isAdding || editingId) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingId ? "Edit Academic Level" : "Add Academic Level"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Level Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="e.g., Primary 1, JSS 1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleChange("category", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nursery">Nursery</SelectItem>
                          <SelectItem value="primary">Primary</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="university">University</SelectItem>
                        </SelectContent>
                      </Select>
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
          
          {/* List of academic levels */}
          <div className="space-y-4">
            {academicLevels?.map((level) => (
              <Card key={level._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{level.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{level.category}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${level.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {level.isActive ? "Active" : "Inactive"}
                      </span>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(level)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(level._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {(!academicLevels || academicLevels.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No academic levels configured yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}