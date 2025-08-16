"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourceList } from "./resource-list";
import { FileUpload } from "./file-upload";
import { toast } from "sonner";
import {
  Plus,
  Upload,
  Save,
  X,
  Link as LinkIcon,
  FileText,
  Video,
  Book,
  Users,
  Award,
  GraduationCap,
  BookOpen,
} from "lucide-react";

interface ResourceManagementProps {
  foundationId: Id<"foundations">;
  academicLevels: Array<{
    _id: Id<"academicLevels">;
    name: string;
    category: string;
  }>;
}

export function ResourceManagement({ foundationId, academicLevels }: ResourceManagementProps) {
  const [activeTab, setActiveTab] = useState("create");
  const [editingResource, setEditingResource] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    resourceType: "",
    categories: [] as string[],
    academicLevels: [] as Id<"academicLevels">[],
    fileId: null as Id<"_storage"> | null,
    externalUrl: "",
    content: "",
    isPublic: true,
    accessLevel: "all_beneficiaries",
    authorName: "",
    isPublished: false,
  });

  const [newCategory, setNewCategory] = useState("");

  // Mutations
  const createResource = useMutation(api.resources.createResource);
  const updateResource = useMutation(api.resources.updateResource);

  // Queries
  const resources = useQuery(api.resources.getResources, {
    foundationId,
    filters: { isPublished: undefined },
  });

  const resourceTypes = [
    { value: "study_material", label: "Study Material", icon: BookOpen },
    { value: "career_guide", label: "Career Guide", icon: GraduationCap },
    { value: "scholarship_info", label: "Scholarship Info", icon: Award },
    { value: "educational_video", label: "Educational Video", icon: Video },
    { value: "tutorial", label: "Tutorial", icon: Users },
    { value: "template", label: "Template", icon: FileText },
    { value: "handbook", label: "Handbook", icon: Book },
  ];

  const accessLevels = [
    { value: "all_beneficiaries", label: "All Beneficiaries" },
    { value: "specific_levels", label: "Specific Academic Levels" },
    { value: "admin_only", label: "Admin Only" },
  ];

  const availableCategories = [
    "Mathematics",
    "Science",
    "English",
    "Career Guidance",
    "JAMB Preparation",
    "University Prep",
    "Life Skills",
    "Financial Literacy",
    "Leadership",
    "Technology",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (!formData.resourceType) {
      toast.error("Resource type is required");
      return;
    }

    if (formData.categories.length === 0) {
      toast.error("At least one category is required");
      return;
    }

    if (!formData.fileId && !formData.externalUrl && !formData.content) {
      toast.error("Please provide either a file, external URL, or content");
      return;
    }

    try {
      if (editingResource) {
        await updateResource({
          resourceId: editingResource._id,
          foundationId,
          ...formData,
        });
        toast.success("Resource updated successfully");
        setEditingResource(null);
      } else {
        await createResource({
          foundationId,
          ...formData,
        });
        toast.success("Resource created successfully");
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        resourceType: "",
        categories: [],
        academicLevels: [],
        fileId: null,
        externalUrl: "",
        content: "",
        isPublic: true,
        accessLevel: "all_beneficiaries",
        authorName: "",
        isPublished: false,
      });

      setActiveTab("list");
    } catch (error) {
      toast.error("Failed to save resource");
      console.error("Error saving resource:", error);
    }
  };

  const handleEdit = (resource: any) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      resourceType: resource.resourceType,
      categories: resource.categories || [],
      academicLevels: resource.academicLevels || [],
      fileId: resource.fileId || null,
      externalUrl: resource.externalUrl || "",
      content: resource.content || "",
      isPublic: resource.isPublic,
      accessLevel: resource.accessLevel,
      authorName: resource.authorName || "",
      isPublished: resource.isPublished,
    });
    setActiveTab("create");
  };

  const handleCancelEdit = () => {
    setEditingResource(null);
    setFormData({
      title: "",
      description: "",
      resourceType: "",
      categories: [],
      academicLevels: [],
      fileId: null,
      externalUrl: "",
      content: "",
      isPublic: true,
      accessLevel: "all_beneficiaries",
      authorName: "",
      isPublished: false,
    });
  };

  const addCategory = () => {
    if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }));
      setNewCategory("");
    }
  };

  const removeCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }));
  };

  const toggleAcademicLevel = (levelId: Id<"academicLevels">) => {
    setFormData(prev => ({
      ...prev,
      academicLevels: prev.academicLevels.includes(levelId)
        ? prev.academicLevels.filter(id => id !== levelId)
        : [...prev.academicLevels, levelId]
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="relative">
            {editingResource ? "Edit Resource" : "Create Resource"}
            {editingResource && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Editing
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="list">Resource List</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingResource ? (
                  <>
                    <Save className="h-5 w-5" />
                    Edit Resource
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Create New Resource
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {editingResource
                  ? "Update the resource information below"
                  : "Add a new resource to the library for beneficiaries"}
              </CardDescription>
              {editingResource && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="w-fit"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter resource title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resourceType">Resource Type *</Label>
                    <Select
                      value={formData.resourceType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, resourceType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the resource and its purpose"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authorName">Author Name</Label>
                  <Input
                    id="authorName"
                    value={formData.authorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                    placeholder="External author name (optional)"
                  />
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  <Label>Categories *</Label>
                  <div className="flex gap-2 mb-2">
                    <Select value="" onValueChange={(value) => {
                      if (value && !formData.categories.includes(value)) {
                        setFormData(prev => ({
                          ...prev,
                          categories: [...prev.categories, value]
                        }));
                      }
                    }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select from available categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Or add custom category"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                    />
                    <Button type="button" onClick={addCategory} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.categories.map((category) => (
                      <Badge key={category} variant="secondary" className="cursor-pointer">
                        {category}
                        <X
                          className="h-3 w-3 ml-1"
                          onClick={() => removeCategory(category)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Academic Levels */}
                <div className="space-y-3">
                  <Label>Academic Levels</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {academicLevels.map((level) => (
                      <div key={level._id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={level._id}
                          checked={formData.academicLevels.includes(level._id)}
                          onChange={() => toggleAcademicLevel(level._id)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={level._id} className="text-sm">
                          {level.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <Label>Resource Content</Label>
                  <Tabs defaultValue="file" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="file">File Upload</TabsTrigger>
                      <TabsTrigger value="link">External Link</TabsTrigger>
                      <TabsTrigger value="content">Text Content</TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="space-y-3">
                      <FileUpload
                        onFileUploaded={(fileId) => setFormData(prev => ({ ...prev, fileId }))}
                        currentFileId={formData.fileId}
                      />
                    </TabsContent>

                    <TabsContent value="link" className="space-y-3">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-gray-500" />
                        <Input
                          value={formData.externalUrl}
                          onChange={(e) => setFormData(prev => ({ ...prev, externalUrl: e.target.value }))}
                          placeholder="https://example.com/resource"
                          type="url"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="content" className="space-y-3">
                      <Textarea
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter text content for the resource"
                        rows={8}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Access Control */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessLevel">Access Level</Label>
                    <Select
                      value={formData.accessLevel}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, accessLevel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accessLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isPublic"
                        checked={formData.isPublic}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                      />
                      <Label htmlFor="isPublic">Public Resource</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isPublished"
                        checked={formData.isPublished}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
                      />
                      <Label htmlFor="isPublished">Publish Now</Label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="h-4 w-4 mr-2" />
                    {editingResource ? "Update Resource" : "Create Resource"}
                  </Button>
                  {editingResource && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <ResourceList
            foundationId={foundationId}
            resources={resources || []}
            onEdit={handleEdit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}