"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  FileText,
  Video,
  Headphones,
  Award,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";

const quickLinks = [
  {
    title: "Video Tutorials",
    description: "Watch how-to videos",
    icon: Video,
    href: "#",
    comingSoon: true,
  },
  {
    title: "Webinar Library",
    description: "Recorded webinars and workshops",
    icon: Headphones,
    href: "#",
    comingSoon: true,
  },
  {
    title: "Success Stories",
    description: "Learn from alumni experiences",
    icon: Award,
    href: "#",
    comingSoon: true,
  },
  {
    title: "Community Forum",
    description: "Connect with other beneficiaries",
    icon: Users,
    href: "#",
    comingSoon: true,
  },
];

export default function ResourcesPage() {
  const router = useRouter();
  const { user, isAdmin } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold">Resource Library</h1>
          </div>
          <p className="text-gray-600">Download guides, templates, and educational materials</p>
        </div>
        {isAdmin && (
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                className="px-3 py-2 border rounded-md"
                disabled
              >
                <option value="all">All Categories</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickLinks.map((link, index) => (
          <Card
            key={index}
            className="hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
            onClick={() => link.comingSoon ? null : router.push(link.href)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <link.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{link.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{link.description}</p>
                  {link.comingSoon && (
                    <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">No Resources Available Yet</h3>
            <p className="text-gray-600 mb-6">
              Resources such as application guides, study materials, and policy documents will be added here by administrators.
            </p>
            {isAdmin ? (
              <div className="space-y-3">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload First Resource
                </Button>
                <p className="text-sm text-gray-500">
                  Start building your resource library for beneficiaries
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Check back soon for helpful guides and materials
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard")}
                  >
                    Back to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/help")}
                  >
                    Get Help
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <BookOpen className="w-8 h-8 text-emerald-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">About the Resource Library</h3>
              <p className="text-sm text-gray-700 mb-3">
                The Resource Library will provide you with essential documents, guides, and educational materials to support your journey. Resources will include application guides, study tips, financial aid information, and more.
              </p>
              {!isAdmin && (
                <p className="text-sm text-gray-600">
                  Resources are being prepared and will be available soon. You'll receive a notification when new materials are added.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
