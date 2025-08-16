"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText,
  Download,
  ExternalLink,
  Book,
  GraduationCap,
  DollarSign,
  Users,
  FileCheck,
  HelpCircle,
  Calendar,
  Award,
  Briefcase,
  Heart,
  Target,
  ChevronRight,
  Search,
  Filter,
  BookOpen,
  Video,
  Headphones,
  File,
  MessageCircle,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const resourceCategories = [
  {
    title: "Application Resources",
    description: "Everything you need for a successful application",
    icon: FileText,
    color: "emerald",
    resources: [
      {
        title: "Application Guide",
        description: "Step-by-step guide to completing your application",
        type: "PDF",
        size: "2.4 MB",
        downloadUrl: "#",
      },
      {
        title: "Document Checklist",
        description: "Required documents for application submission",
        type: "PDF",
        size: "1.1 MB",
        downloadUrl: "#",
      },
      {
        title: "Sample Application",
        description: "Example of a successful application",
        type: "PDF",
        size: "3.2 MB",
        downloadUrl: "#",
      },
      {
        title: "FAQ - Applications",
        description: "Frequently asked questions about applications",
        type: "PDF",
        size: "890 KB",
        downloadUrl: "#",
      },
    ],
  },
  {
    title: "Academic Resources",
    description: "Support materials for academic success",
    icon: GraduationCap,
    color: "blue",
    resources: [
      {
        title: "Study Tips Guide",
        description: "Effective study techniques for Nigerian students",
        type: "PDF",
        size: "1.8 MB",
        downloadUrl: "#",
      },
      {
        title: "WAEC Preparation Guide",
        description: "Comprehensive guide for WAEC examination",
        type: "PDF",
        size: "4.5 MB",
        downloadUrl: "#",
      },
      {
        title: "JAMB Study Materials",
        description: "Resources for JAMB UTME preparation",
        type: "ZIP",
        size: "12.3 MB",
        downloadUrl: "#",
      },
      {
        title: "Academic Calendar Template",
        description: "Plan your academic year effectively",
        type: "XLSX",
        size: "450 KB",
        downloadUrl: "#",
      },
    ],
  },
  {
    title: "Financial Resources",
    description: "Understanding financial support and management",
    icon: DollarSign,
    color: "yellow",
    resources: [
      {
        title: "Financial Aid Overview",
        description: "Types of financial support available",
        type: "PDF",
        size: "1.5 MB",
        downloadUrl: "#",
      },
      {
        title: "Budget Planning Worksheet",
        description: "Personal budget template for students",
        type: "XLSX",
        size: "320 KB",
        downloadUrl: "#",
      },
      {
        title: "Scholarship Opportunities",
        description: "Additional scholarship programs in Nigeria",
        type: "PDF",
        size: "2.1 MB",
        downloadUrl: "#",
      },
      {
        title: "Financial Literacy Guide",
        description: "Basic financial management for students",
        type: "PDF",
        size: "3.7 MB",
        downloadUrl: "#",
      },
    ],
  },
  {
    title: "Career Development",
    description: "Resources for career planning and growth",
    icon: Briefcase,
    color: "purple",
    resources: [
      {
        title: "Career Planning Guide",
        description: "Explore career paths and opportunities",
        type: "PDF",
        size: "2.8 MB",
        downloadUrl: "#",
      },
      {
        title: "CV Writing Template",
        description: "Professional CV template and guide",
        type: "DOCX",
        size: "180 KB",
        downloadUrl: "#",
      },
      {
        title: "Interview Preparation",
        description: "Tips for successful job interviews",
        type: "PDF",
        size: "1.3 MB",
        downloadUrl: "#",
      },
      {
        title: "Internship Guide",
        description: "Finding and securing internships",
        type: "PDF",
        size: "2.0 MB",
        downloadUrl: "#",
      },
    ],
  },
  {
    title: "Foundation Policies",
    description: "Important policies and guidelines",
    icon: Shield,
    color: "red",
    resources: [
      {
        title: "Code of Conduct",
        description: "Expected behavior for all beneficiaries",
        type: "PDF",
        size: "950 KB",
        downloadUrl: "#",
      },
      {
        title: "Privacy Policy",
        description: "How we handle your personal information",
        type: "PDF",
        size: "780 KB",
        downloadUrl: "#",
      },
      {
        title: "Terms and Conditions",
        description: "Terms of participation in foundation programs",
        type: "PDF",
        size: "1.1 MB",
        downloadUrl: "#",
      },
      {
        title: "Appeals Process",
        description: "How to appeal foundation decisions",
        type: "PDF",
        size: "650 KB",
        downloadUrl: "#",
      },
    ],
  },
  {
    title: "Well-being & Support",
    description: "Mental health and wellness resources",
    icon: Heart,
    color: "pink",
    resources: [
      {
        title: "Mental Health Guide",
        description: "Managing stress and mental wellness",
        type: "PDF",
        size: "2.2 MB",
        downloadUrl: "#",
      },
      {
        title: "Support Services Directory",
        description: "Available support services and contacts",
        type: "PDF",
        size: "1.4 MB",
        downloadUrl: "#",
      },
      {
        title: "Wellness Tips",
        description: "Daily wellness practices for students",
        type: "PDF",
        size: "1.8 MB",
        downloadUrl: "#",
      },
      {
        title: "Crisis Support Contacts",
        description: "Emergency support contact information",
        type: "PDF",
        size: "450 KB",
        downloadUrl: "#",
      },
    ],
  },
];

const quickLinks = [
  {
    title: "Video Tutorials",
    description: "Watch how-to videos",
    icon: Video,
    href: "#",
  },
  {
    title: "Webinar Library",
    description: "Recorded webinars and workshops",
    icon: Headphones,
    href: "#",
  },
  {
    title: "Success Stories",
    description: "Learn from alumni experiences",
    icon: Award,
    href: "#",
  },
  {
    title: "Community Forum",
    description: "Connect with other beneficiaries",
    icon: Users,
    href: "#",
  },
];

export default function ResourcesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      emerald: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
      blue: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
      yellow: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
      purple: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
      red: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
      pink: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
    };
    return colors[color] || colors.emerald;
  };

  const getFileIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "PDF":
        return <FileText className="w-4 h-4" />;
      case "DOCX":
      case "DOC":
        return <FileText className="w-4 h-4" />;
      case "XLSX":
      case "XLS":
        return <File className="w-4 h-4" />;
      case "ZIP":
        return <File className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const filteredCategories = resourceCategories.filter(category => {
    if (selectedCategory !== "all" && category.title !== selectedCategory) {
      return false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return category.title.toLowerCase().includes(searchLower) ||
        category.description.toLowerCase().includes(searchLower) ||
        category.resources.some(resource => 
          resource.title.toLowerCase().includes(searchLower) ||
          resource.description.toLowerCase().includes(searchLower)
        );
    }
    
    return true;
  });

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-emerald-100 rounded-full">
            <BookOpen className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Resource Library</h1>
        <p className="text-gray-600">Download guides, templates, and educational materials</p>
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
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Categories</option>
                {resourceCategories.map((category) => (
                  <option key={category.title} value={category.title}>
                    {category.title}
                  </option>
                ))}
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
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push(link.href)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <link.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{link.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{link.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resource Categories */}
      <div className="space-y-6">
        {filteredCategories.map((category, categoryIndex) => {
          const colors = getColorClasses(category.color);
          
          return (
            <Card key={categoryIndex} className={`border-2 ${colors.border}`}>
              <CardHeader className={colors.bg}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 bg-white rounded-lg`}>
                    <category.icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className={colors.text}>{category.title}</CardTitle>
                    <CardDescription className={colors.text}>
                      {category.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.resources.map((resource, resourceIndex) => (
                    <div
                      key={resourceIndex}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-gray-100 rounded">
                            {getFileIcon(resource.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{resource.title}</h4>
                            <p className="text-xs text-gray-600 mb-2">{resource.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {resource.type}
                              </Badge>
                              <span className="text-xs text-gray-500">{resource.size}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No resources found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <HelpCircle className="w-8 h-8 text-emerald-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Need help finding resources?</h3>
              <p className="text-sm text-gray-700 mb-3">
                If you can't find the resource you're looking for, or need assistance with downloads, 
                please contact our support team.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => router.push("/help")}
                >
                  Get Help
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/messages")}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}