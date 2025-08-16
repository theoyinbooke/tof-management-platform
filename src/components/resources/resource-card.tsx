"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Download,
  Eye,
  ExternalLink,
  FileText,
  Video,
  Book,
  Users,
  Award,
  GraduationCap,
  BookOpen,
  Calendar,
  User,
  Globe,
  Lock,
  Star,
} from "lucide-react";

interface ResourceCardProps {
  resource: any;
  foundationId: Id<"foundations">;
}

export function ResourceCard({ resource, foundationId }: ResourceCardProps) {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Mutations
  const incrementViews = useMutation(api.resources.incrementViews);
  const incrementDownloads = useMutation(api.resources.incrementDownloads);

  const resourceTypeIcons = {
    study_material: BookOpen,
    career_guide: GraduationCap,
    scholarship_info: Award,
    educational_video: Video,
    tutorial: Users,
    template: FileText,
    handbook: Book,
  };

  const ResourceIcon = resourceTypeIcons[resource.resourceType as keyof typeof resourceTypeIcons] || Book;

  const handleView = async () => {
    try {
      await incrementViews({
        resourceId: resource._id,
        foundationId,
      });
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error("Error incrementing views:", error);
      setIsViewDialogOpen(true);
    }
  };

  const handleDownload = async () => {
    try {
      if (resource.fileId) {
        await incrementDownloads({
          resourceId: resource._id,
          foundationId,
        });
        
        // Create download link
        const downloadUrl = `/api/download/${resource.fileId}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = resource.title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Download started");
      }
    } catch (error) {
      toast.error("Failed to download resource");
      console.error("Download error:", error);
    }
  };

  const handleExternalLink = async () => {
    if (resource.externalUrl) {
      try {
        await incrementViews({
          resourceId: resource._id,
          foundationId,
        });
        window.open(resource.externalUrl, '_blank');
      } catch (error) {
        console.error("Error incrementing views:", error);
        window.open(resource.externalUrl, '_blank');
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getResourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      study_material: "Study Material",
      career_guide: "Career Guide",
      scholarship_info: "Scholarship Info",
      educational_video: "Educational Video",
      tutorial: "Tutorial",
      template: "Template",
      handbook: "Handbook",
    };
    return labels[type] || type;
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <CardHeader onClick={handleView}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                <ResourceIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <Badge variant="secondary" className="mb-2">
                  {getResourceTypeLabel(resource.resourceType)}
                </Badge>
                <CardTitle className="text-lg line-clamp-2 group-hover:text-emerald-700 transition-colors">
                  {resource.title}
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {resource.isPublic ? (
                <Globe className="h-4 w-4 text-gray-400" />
              ) : (
                <Lock className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <CardDescription className="line-clamp-3">
            {resource.description}
          </CardDescription>

          {/* Categories */}
          {resource.categories && resource.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resource.categories.slice(0, 3).map((category: string) => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
              {resource.categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{resource.categories.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {resource.views || 0}
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {resource.downloads || 0}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(resource.createdAt)}
            </div>
          </div>

          {/* Author */}
          {resource.authorName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {resource.authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>by {resource.authorName}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleView}
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            
            {resource.fileId && (
              <Button
                onClick={handleDownload}
                size="sm"
                variant="outline"
                className="hover:bg-emerald-50 hover:border-emerald-300"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            
            {resource.externalUrl && (
              <Button
                onClick={handleExternalLink}
                size="sm"
                variant="outline"
                className="hover:bg-emerald-50 hover:border-emerald-300"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <ResourceIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">{resource.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {getResourceTypeLabel(resource.resourceType)}
                  </Badge>
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
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{resource.description}</p>
            </div>

            {/* Categories */}
            {resource.categories && resource.categories.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {resource.categories.map((category: string) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            {resource.content && (
              <div>
                <h3 className="font-semibold mb-2">Content</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {resource.content}
                  </pre>
                </div>
              </div>
            )}

            {/* External URL */}
            {resource.externalUrl && (
              <div>
                <h3 className="font-semibold mb-2">External Link</h3>
                <Button
                  onClick={handleExternalLink}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {resource.externalUrl}
                </Button>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-gray-400" />
                <span>{resource.views || 0} views</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Download className="h-4 w-4 text-gray-400" />
                <span>{resource.downloads || 0} downloads</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Created {formatDate(resource.createdAt)}</span>
              </div>
              {resource.authorName && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>by {resource.authorName}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {resource.fileId && (
                <Button
                  onClick={handleDownload}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Resource
                </Button>
              )}
              
              {resource.externalUrl && (
                <Button
                  onClick={handleExternalLink}
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open External Link
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}