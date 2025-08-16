"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  Video,
  Users,
  Settings,
  Shield,
  DollarSign,
  GraduationCap,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

const helpCategories = [
  {
    title: "Getting Started",
    description: "Learn the basics of using the platform",
    icon: Book,
    topics: [
      "Creating your first application",
      "Understanding user roles",
      "Navigating the dashboard",
      "Setting up your profile",
    ],
  },
  {
    title: "Applications",
    description: "Managing and reviewing applications",
    icon: FileText,
    topics: [
      "Submitting an application",
      "Application review process",
      "Required documents",
      "Application status tracking",
    ],
  },
  {
    title: "Beneficiary Management",
    description: "Supporting and tracking beneficiaries",
    icon: Users,
    topics: [
      "Adding beneficiaries",
      "Tracking academic progress",
      "Managing financial support",
      "Communication with beneficiaries",
    ],
  },
  {
    title: "Academic Features",
    description: "Academic tracking and reporting",
    icon: GraduationCap,
    topics: [
      "Recording performance",
      "Creating academic sessions",
      "Performance alerts",
      "Academic reports",
    ],
  },
  {
    title: "Financial Management",
    description: "Payments, invoices, and budgets",
    icon: DollarSign,
    topics: [
      "Creating invoices",
      "Processing payments",
      "Budget tracking",
      "Financial reports",
    ],
  },
  {
    title: "Security & Privacy",
    description: "Keeping your data safe",
    icon: Shield,
    topics: [
      "Account security",
      "Data privacy",
      "User permissions",
      "Audit logs",
    ],
  },
];

const contactMethods = [
  {
    title: "Email Support",
    description: "Get help via email",
    icon: Mail,
    action: "support@theoyinbookefoundation.com",
    type: "email",
  },
  {
    title: "Phone Support",
    description: "Call us directly",
    icon: Phone,
    action: "+234 xxx xxxx xxx",
    type: "phone",
  },
  {
    title: "Live Chat",
    description: "Chat with our support team",
    icon: MessageCircle,
    action: "Start Chat",
    type: "chat",
  },
  {
    title: "Video Tutorials",
    description: "Watch how-to videos",
    icon: Video,
    action: "View Tutorials",
    type: "video",
  },
];

export default function HelpPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-emerald-100 rounded-full">
            <HelpCircle className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">How can we help you?</h1>
        <p className="text-gray-600">Find answers to common questions and get support</p>
      </div>

      {/* Search Bar */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search for help topics..."
              className="w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button 
              size="sm" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700"
            >
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {helpCategories.map((category, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <category.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription className="mt-1">{category.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {category.topics.map((topic, topicIndex) => (
                  <li key={topicIndex} className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600">
                    <ChevronRight className="w-4 h-4" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Support */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
          <CardDescription>Our support team is here to assist you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactMethods.map((method, index) => (
              <div key={index} className="bg-white p-4 rounded-lg text-center hover:shadow-md transition-shadow">
                <method.icon className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h3 className="font-medium mb-1">{method.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                {method.type === "email" ? (
                  <a href={`mailto:${method.action}`} className="text-emerald-600 hover:underline text-sm">
                    {method.action}
                  </a>
                ) : method.type === "phone" ? (
                  <span className="text-emerald-600 text-sm">{method.action}</span>
                ) : (
                  <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300">
                    {method.action}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Access important resources and documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => router.push("/resources")}
            >
              <Book className="w-4 h-4 mr-2" />
              Resources
            </Button>
            <Button
              variant="outline"
              className="justify-start"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}