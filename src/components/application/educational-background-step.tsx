"use client";

import { UseFormReturn } from "react-hook-form";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface EducationalBackgroundStepProps {
  form: UseFormReturn<any>;
}

// Default academic levels if none are configured
const defaultAcademicLevels = [
  { name: "Nursery 1", category: "nursery" },
  { name: "Nursery 2", category: "nursery" },
  { name: "Primary 1", category: "primary" },
  { name: "Primary 2", category: "primary" },
  { name: "Primary 3", category: "primary" },
  { name: "Primary 4", category: "primary" },
  { name: "Primary 5", category: "primary" },
  { name: "Primary 6", category: "primary" },
  { name: "JSS 1", category: "secondary" },
  { name: "JSS 2", category: "secondary" },
  { name: "JSS 3", category: "secondary" },
  { name: "SSS 1", category: "secondary" },
  { name: "SSS 2", category: "secondary" },
  { name: "SSS 3", category: "secondary" },
  { name: "Year 1 (University)", category: "university" },
  { name: "Year 2 (University)", category: "university" },
  { name: "Year 3 (University)", category: "university" },
  { name: "Year 4 (University)", category: "university" },
  { name: "Year 5 (University)", category: "university" },
];

export function EducationalBackgroundStep({ form }: EducationalBackgroundStepProps) {
  // Try to get configured academic levels from the first foundation
  const foundations = useQuery(api.foundations.getAll);
  const firstFoundation = foundations?.[0];
  
  const configData = useQuery(
    api.foundations.getConfigurationData,
    firstFoundation ? { foundationId: firstFoundation._id } : "skip"
  );

  // Use configured levels if available, otherwise fall back to defaults
  const academicLevels = configData?.academicLevels?.length 
    ? configData.academicLevels 
    : defaultAcademicLevels;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "nursery": return "bg-purple-100 text-purple-800";
      case "primary": return "bg-blue-100 text-blue-800";
      case "secondary": return "bg-green-100 text-green-800";
      case "university": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Academic Status */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Academic Status</h3>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="education.currentLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Academic Level *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your current academic level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {academicLevels.map((level, index) => (
                      <SelectItem key={index} value={level.name}>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCategoryColor(level.category)}`}
                          >
                            {level.category}
                          </Badge>
                          {level.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the academic level you are currently in or will be entering
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="education.currentSchool"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current School/Institution *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Lagos State University, St. Michael's Primary School" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Enter the full name of your current school or institution
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Academic History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Academic History</h3>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="education.hasRepeatedClass"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I have repeated a class/grade before
                  </FormLabel>
                  <FormDescription>
                    Check this box if you have ever repeated a class or grade level
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Special Needs */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Special Considerations</h3>
        <FormField
          control={form.control}
          name="education.specialNeeds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Educational Needs or Support Required</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please describe any special educational needs, learning differences, or support you require (optional)"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This information helps us provide appropriate support if you are selected. 
                All information is kept confidential.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Information Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-blue-600 mt-0.5">
            ℹ️
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">About Academic Levels</h4>
            <p className="text-sm text-blue-800">
              The Nigerian education system follows: Nursery → Primary (1-6) → Secondary 
              (JSS 1-3, SSS 1-3) → University (Year 1-5). Select the level that best 
              matches your current academic status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}