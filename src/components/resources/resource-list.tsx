"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Edit,
  Trash2,
  Eye,
  Download,
  ExternalLink,
  FileText,
  Video,
  Book,
  Users,
  Award,
  GraduationCap,
  BookOpen,
  Search,
  MoreHorizontal,
  Globe,
  Lock,
  CheckCircle,
  Clock,
  Archive,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ResourceListProps {
  foundationId: Id<"foundations">;
  resources: any[];
  onEdit: (resource: any) => void;
}

export function ResourceList({ foundationId, resources, onEdit }: ResourceListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");

  // Mutations
  const deleteResource = useMutation(api.resources.deleteResource);
  const bulkUpdateStatus = useMutation(api.resources.bulkUpdateResourceStatus);

  const resourceTypes = [
    { value: "all", label: "All Types" },
    { value: "study_material", label: "Study Materials", icon: BookOpen },
    { value: "career_guide", label: "Career Guides", icon: GraduationCap },
    { value: "scholarship_info", label: "Scholarship Info", icon: Award },
    { value: "educational_video", label: "Educational Videos", icon: Video },
    { value: "tutorial", label: "Tutorials", icon: Users },
    { value: "template", label: "Templates", icon: FileText },
    { value: "handbook", label: "Handbooks", icon: Book },
  ];

  const getResourceTypeIcon = (type: string) => {
    const typeConfig = resourceTypes.find(t => t.value === type);
    const IconComponent = typeConfig?.icon || Book;
    return <IconComponent className="h-4 w-4" />;
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.categories.some((cat: string) => cat.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === "all" || resource.resourceType === selectedType;
    
    const matchesStatus = selectedStatus === "all" || 
                         (selectedStatus === "published" && resource.isPublished) ||
                         (selectedStatus === "draft" && !resource.isPublished);

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDelete = async (resourceId: string, title: string) => {
    try {
      await deleteResource({
        resourceId: resourceId as Id<"resources">,
        foundationId,
      });
      toast.success(`Resource "${title}" deleted successfully`);
    } catch (error) {
      toast.error("Failed to delete resource");
      console.error("Delete error:", error);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedResources.length === 0) return;

    try {
      if (bulkAction === "publish") {
        const updated = await bulkUpdateStatus({
          foundationId,
          resourceIds: selectedResources as Id<"resources">[],
          isPublished: true,
        });
        toast.success(`Published ${updated} resources`);
      } else if (bulkAction === "unpublish") {
        const updated = await bulkUpdateStatus({
          foundationId,
          resourceIds: selectedResources as Id<"resources">[],
          isPublished: false,
        });
        toast.success(`Unpublished ${updated} resources`);
      }
      
      setSelectedResources([]);
      setBulkAction("");
    } catch (error) {
      toast.error("Failed to perform bulk action");
      console.error("Bulk action error:", error);
    }
  };

  const toggleResourceSelection = (resourceId: string) => {
    setSelectedResources(prev => 
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedResources.length === filteredResources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(filteredResources.map(r => r._id));
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                {resourceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedResources.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedResources.length} resource{selectedResources.length !== 1 ? 's' : ''} selected
              </span>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Bulk Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="publish">Publish</SelectItem>
                  <SelectItem value="unpublish">Unpublish</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                size="sm" 
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Apply
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setSelectedResources([])}
              >
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource List */}
      <div className="space-y-4">
        {filteredResources.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Book className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources Found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedType !== "all" || selectedStatus !== "all"
                  ? "Try adjusting your filters to see more resources."
                  : "No resources have been created yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                checked={selectedResources.length === filteredResources.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                Select All ({filteredResources.length} resources)
              </span>
            </div>

            {/* Resource Cards */}
            {filteredResources.map((resource) => (
              <Card key={resource._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedResources.includes(resource._id)}
                      onCheckedChange={() => toggleResourceSelection(resource._id)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getResourceTypeIcon(resource.resourceType)}
                            <h3 className="text-lg font-semibold text-gray-900">
                              {resource.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              {resource.isPublished ? (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Published
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Draft
                                </Badge>
                              )}
                              {resource.isPublic ? (
                                <Badge variant="outline">
                                  <Globe className="h-3 w-3 mr-1" />
                                  Public
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Private
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {resource.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {resource.categories.map((category: string) => (
                              <Badge key={category} variant="secondary" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {resource.views || 0} views
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="h-4 w-4" />
                              {resource.downloads || 0} downloads
                            </div>
                            <div>
                              Created {formatDate(resource.createdAt)}
                            </div>
                            {resource.authorName && (
                              <div>
                                by {resource.authorName}
                              </div>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(resource)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {resource.fileId && (
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                            )}
                            {resource.externalUrl && (
                              <DropdownMenuItem>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Link
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{resource.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(resource._id, resource.title)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}