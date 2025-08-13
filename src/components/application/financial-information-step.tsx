"use client";

import { UseFormReturn } from "react-hook-form";
import { 
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface FinancialInformationStepProps {
  form: UseFormReturn<any>;
}

const incomeRanges = [
  { value: "below_50k", label: "Below ₦50,000 per month", description: "Less than ₦600,000 annually" },
  { value: "50k_100k", label: "₦50,000 - ₦100,000 per month", description: "₦600,000 - ₦1,200,000 annually" },
  { value: "100k_200k", label: "₦100,000 - ₦200,000 per month", description: "₦1,200,000 - ₦2,400,000 annually" },
  { value: "above_200k", label: "Above ₦200,000 per month", description: "More than ₦2,400,000 annually" },
];

export function FinancialInformationStep({ form }: FinancialInformationStepProps) {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-blue-600 mt-0.5">
            💰
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Financial Information</h4>
            <p className="text-sm text-blue-800">
              This information helps us understand your family's financial situation and 
              prioritize assistance for those who need it most. All information is kept 
              strictly confidential and is used only for scholarship evaluation purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Family Income */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Family Income</h3>
        <FormField
          control={form.control}
          name="financial.familyIncome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Family Income Range</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select income range (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {incomeRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      <div>
                        <div className="font-medium">{range.label}</div>
                        <div className="text-xs text-gray-600">{range.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Optional: This helps us understand your family's financial capacity. 
                Select the range that best represents your total household income.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Other Support */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Other Financial Support</h3>
        <FormField
          control={form.control}
          name="financial.hasOtherSupport"
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
                  I am currently receiving support from other scholarships or organizations
                </FormLabel>
                <FormDescription>
                  Check this box if you receive educational support from other sources 
                  (government, other foundations, corporations, etc.)
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* Income Range Guide */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Income Range Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {incomeRanges.map((range) => (
            <div key={range.value} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  {range.value.replace("_", " - ").replace("k", "K")}
                </Badge>
              </div>
              <div className="text-sm font-medium">{range.label}</div>
              <div className="text-xs text-gray-600">{range.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">💡 Why We Ask</h4>
          <p className="text-sm text-yellow-800">
            Financial information helps us prioritize support for students who need it most. 
            We aim to assist families who may struggle to afford educational expenses.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">🔒 Privacy Protection</h4>
          <p className="text-sm text-green-800">
            All financial information is encrypted and accessible only to authorized 
            foundation staff involved in the application review process.
          </p>
        </div>
      </div>

      {/* Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> Financial need is one factor in our evaluation process, 
          but it's not the only criterion. We also consider academic potential, 
          personal circumstances, and commitment to education. Don't let financial 
          status discourage you from applying.
        </p>
      </div>
    </div>
  );
}