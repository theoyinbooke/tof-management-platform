"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  GraduationCap, 
  DollarSign, 
  AlertTriangle,
  Users,
  Settings
} from "lucide-react";
import { FoundationSettings } from "./foundation-settings";
import { AcademicLevels } from "./academic-levels";
import { FeeCategories } from "./fee-categories";
import { PerformanceRules } from "./performance-rules";

export function ConfigurationDashboard() {
  const [activeSection, setActiveSection] = useState("foundation");

  const renderSection = () => {
    switch (activeSection) {
      case "foundation":
        return <FoundationSettings />;
      case "academic":
        return <AcademicLevels />;
      case "financial":
        return <FeeCategories />;
      case "performance":
        return <PerformanceRules />;
      default:
        return <FoundationSettings />;
    }
  };

  const navigationItems = [
    {
      id: "foundation",
      title: "Foundation Settings",
      description: "Basic foundation information and operational settings",
      icon: Building,
    },
    {
      id: "academic",
      title: "Academic Levels",
      description: "Configure education levels for the Nigerian education system",
      icon: GraduationCap,
    },
    {
      id: "financial",
      title: "Fee Categories",
      description: "Configure different types of fees tracked by the system",
      icon: DollarSign,
    },
    {
      id: "performance",
      title: "Performance Rules",
      description: "Configure automated alert rules for academic performance",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuration</h1>
        <p className="text-gray-600 mt-2">
          Manage your foundation's settings, academic levels, fee categories, and performance rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Select a section to configure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveSection(item.id)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}