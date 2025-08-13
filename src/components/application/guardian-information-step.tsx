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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GuardianInformationStepProps {
  form: UseFormReturn<any>;
}

const relationshipOptions = [
  "Father",
  "Mother", 
  "Legal Guardian",
  "Grandparent",
  "Uncle",
  "Aunt",
  "Older Sibling",
  "Foster Parent",
  "Other Relative",
  "Family Friend",
  "Other"
];

export function GuardianInformationStep({ form }: GuardianInformationStepProps) {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-amber-600 mt-0.5">
            👨‍👩‍👧‍👦
          </div>
          <div>
            <h4 className="font-medium text-amber-900 mb-1">Guardian Information Required</h4>
            <p className="text-sm text-amber-800">
              We need information about your parent or guardian for communication purposes 
              and emergency contact. This person should be your primary caregiver or the 
              person responsible for your education.
            </p>
          </div>
        </div>
      </div>

      {/* Guardian Details */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Guardian Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="guardian.firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guardian First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Mary" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guardian.lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guardian Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Johnson" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Relationship */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Relationship</h3>
        <FormField
          control={form.control}
          name="guardian.relationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship to Applicant *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {relationshipOptions.map((relationship) => (
                    <SelectItem key={relationship} value={relationship}>
                      {relationship}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                How is this person related to you?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="guardian.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+234 803 123 4567" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Nigerian phone number for emergency contact
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guardian.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="mary.johnson@example.com" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Optional, but recommended for communication
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Employment Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Employment Information</h3>
        <FormField
          control={form.control}
          name="guardian.occupation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Occupation/Job Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Teacher, Business Owner, Civil Servant" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Optional: What does your guardian do for work?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Privacy Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-green-600 mt-0.5">
            🔒
          </div>
          <div>
            <h4 className="font-medium text-green-900 mb-1">Privacy & Security</h4>
            <p className="text-sm text-green-800">
              All guardian information is kept strictly confidential and will only be used 
              for communication about your application and, if selected, program updates. 
              We never share personal information with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}