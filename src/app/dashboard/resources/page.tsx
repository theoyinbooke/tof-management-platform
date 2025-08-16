"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceManagement } from "@/components/resources/resource-management";
import { ResourceList } from "@/components/resources/resource-list";
import { ResourceCard } from "@/components/resources/resource-card";
import { 
  Book, 
  Download, 
  Eye, 
  Search, 
  Filter,
  Plus,
  BookOpen,
  GraduationCap,
  Award,
  Users,
  Video,
  FileText,
  Link
} from "lucide-react";

export default function ResourcesPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("view");

  // Get user data to check role and foundation
  const userData = useQuery(api.auth.getCurrentUser);
  const foundationId = userData?.foundationId;

  // Fetch resources with filters
  const resources = useQuery(
    api.resources.getResources,
    foundationId
      ? {
          foundationId,
          filters: {
            search: searchTerm || undefined,
            resourceType: selectedType !== "all" ? selectedType : undefined,
            category: selectedCategory !== "all" ? selectedCategory : undefined,
          },
        }
      : "skip"
  );

  // Fetch academic levels for filters
  const academicLevels = useQuery(
    api.resources.getAcademicLevels,
    foundationId ? { foundationId } : "skip"
  );

  // Fetch resource stats for admin
  const resourceStats = useQuery(
    api.resources.getResourceStats,
    foundationId && userData?.role && ["admin", "super_admin"].includes(userData.role)
      ? { foundationId }
      : "skip"
  );

  const isAdmin = userData?.role && ["admin", "super_admin"].includes(userData.role);

  if (!userData || !foundationId) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

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
    return typeConfig?.icon || Book;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Library</h1>
          <p className="text-gray-600 mt-1">
            Access educational materials, guides, and learning resources
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setActiveTab("manage")}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Manage Resources
          </Button>
        )}
      </div>

      {/* Admin Stats */}
      {isAdmin && resourceStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Book className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Resources</p>
                  <p className="text-2xl font-bold text-gray-900">{resourceStats.totalResources}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{resourceStats.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Download className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                  <p className="text-2xl font-bold text-gray-900">{resourceStats.totalDownloads.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-gray-900">{resourceStats.publishedResources}</p>
                  <p className="text-xs text-gray-500">{resourceStats.draftResources} drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view">View Resources</TabsTrigger>
          {isAdmin && <TabsTrigger value="manage">Manage Resources</TabsTrigger>}
        </TabsList>

        <TabsContent value="view" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
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
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Career">Career Guidance</SelectItem>
                    <SelectItem value="JAMB">JAMB Preparation</SelectItem>
                    <SelectItem value="University">University Prep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources === undefined ? (
              // Loading skeletons
              [...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-3/4 mb-3" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-2/3 mb-4" />
                    <div className="flex gap-2 mb-4">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : resources.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-12 text-center">
                  <Book className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources Found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || selectedType !== "all" || selectedCategory !== "all"
                      ? "Try adjusting your filters to see more resources."
                      : "No resources have been uploaded yet."}
                  </p>
                  {isAdmin && (
                    <Button
                      onClick={() => setActiveTab("manage")}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Resource
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              resources.map((resource) => (
                <ResourceCard
                  key={resource._id}
                  resource={resource}
                  foundationId={foundationId}
                />
              ))
            )}
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="manage" className="space-y-6">
            <ResourceManagement 
              foundationId={foundationId}
              academicLevels={academicLevels || []}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}