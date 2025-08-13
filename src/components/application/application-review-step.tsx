"use client";

import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { 
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Edit, User, GraduationCap, Users, DollarSign, FileText, AlertTriangle } from "lucide-react";

interface ApplicationReviewStepProps {
  form: UseFormReturn<any>;
  onEdit?: (step: number) => void;
}

export function ApplicationReviewStep({ form, onEdit }: ApplicationReviewStepProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  
  const formData = form.getValues();
  
  const canSubmit = agreedToTerms && agreedToPrivacy;

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const formatWordCount = (text: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-emerald-900 mb-1">Review Your Application</h4>
            <p className="text-sm text-emerald-800">
              Please review all the information below carefully. You can edit any section by clicking 
              the edit button. Once you submit, you won't be able to make changes.
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(1)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Full Name</p>
              <p className="font-medium">
                {[formData.firstName, formData.middleName, formData.lastName]
                  .filter(Boolean)
                  .join(' ') || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Date of Birth</p>
              <p className="font-medium">{formatDate(formData.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Gender</p>
              <p className="font-medium capitalize">{formData.gender || 'Not provided'}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Phone</p>
              <p className="font-medium">{formData.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p className="font-medium">{formData.email || 'Not provided'}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600">Address</p>
            <p className="font-medium">
              {[
                formData.address?.street,
                formData.address?.city,
                formData.address?.state,
                formData.address?.country
              ].filter(Boolean).join(', ') || 'Not provided'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Educational Background */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="w-5 h-5" />
              Educational Background
            </CardTitle>
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(2)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Level</p>
              <p className="font-medium">{formData.education?.currentLevel || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Current School</p>
              <p className="font-medium">{formData.education?.currentSchool || 'Not provided'}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600">Academic History</p>
            <div className="flex gap-2 mt-1">
              {formData.education?.hasRepeatedClass ? (
                <Badge variant="outline" className="text-yellow-800 bg-yellow-50">
                  Has repeated a class
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-800 bg-green-50">
                  No repeated classes
                </Badge>
              )}
            </div>
          </div>
          
          {formData.education?.specialNeeds && (
            <div>
              <p className="text-sm font-medium text-gray-600">Special Needs</p>
              <p className="font-medium">{formData.education.specialNeeds}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guardian Information */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5" />
              Guardian Information
            </CardTitle>
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(3)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Guardian Name</p>
              <p className="font-medium">
                {[formData.guardian?.firstName, formData.guardian?.lastName]
                  .filter(Boolean)
                  .join(' ') || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Relationship</p>
              <p className="font-medium">{formData.guardian?.relationship || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Phone</p>
              <p className="font-medium">{formData.guardian?.phone || 'Not provided'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p className="font-medium">{formData.guardian?.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Occupation</p>
              <p className="font-medium">{formData.guardian?.occupation || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5" />
              Financial Information
            </CardTitle>
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(4)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-600">Family Income Range</p>
            <p className="font-medium">
              {formData.financial?.familyIncome ? 
                formData.financial.familyIncome.replace('_', ' - ').replace('k', 'K') : 
                'Not provided'
              }
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600">Other Support</p>
            <div className="flex gap-2 mt-1">
              {formData.financial?.hasOtherSupport ? (
                <Badge variant="outline" className="text-blue-800 bg-blue-50">
                  Receiving other support
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-800 bg-gray-50">
                  No other support
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Essays */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Application Essays
            </CardTitle>
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(5)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Personal Statement</p>
              <Badge variant="outline" className="text-xs">
                {formatWordCount(formData.essays?.personalStatement)} words
              </Badge>
            </div>
            <p className="text-sm bg-gray-50 p-3 rounded border">
              {formData.essays?.personalStatement || 'Not provided'}
            </p>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Educational Goals</p>
              <Badge variant="outline" className="text-xs">
                {formatWordCount(formData.essays?.educationalGoals)} words
              </Badge>
            </div>
            <p className="text-sm bg-gray-50 p-3 rounded border">
              {formData.essays?.educationalGoals || 'Not provided'}
            </p>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Why This Scholarship</p>
              <Badge variant="outline" className="text-xs">
                {formatWordCount(formData.essays?.whyApplying)} words
              </Badge>
            </div>
            <p className="text-sm bg-gray-50 p-3 rounded border">
              {formData.essays?.whyApplying || 'Not provided'}
            </p>
          </div>
          
          {formData.essays?.additionalInfo && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Additional Information</p>
                <Badge variant="outline" className="text-xs">
                  {formatWordCount(formData.essays?.additionalInfo)} words
                </Badge>
              </div>
              <p className="text-sm bg-gray-50 p-3 rounded border">
                {formData.essays.additionalInfo}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5" />
            Terms and Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="agreedToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => {
                      setAgreedToTerms(checked as boolean);
                      field.onChange(checked);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <p className="text-sm font-medium">
                    I agree to the terms and conditions *
                  </p>
                  <p className="text-xs text-gray-600">
                    I understand that the information provided in this application is true and complete. 
                    I agree to provide additional documentation if requested and understand that false 
                    information may result in disqualification.
                  </p>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreedToPrivacy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={agreedToPrivacy}
                    onCheckedChange={(checked) => {
                      setAgreedToPrivacy(checked as boolean);
                      field.onChange(checked);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <p className="text-sm font-medium">
                    I consent to the processing of my personal data *
                  </p>
                  <p className="text-xs text-gray-600">
                    I consent to TheOyinbooke Foundation collecting, processing, and storing my personal 
                    data for the purpose of scholarship evaluation and program administration. I understand 
                    my data will be handled in accordance with the foundation's privacy policy.
                  </p>
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Submission Warning */}
      {!canSubmit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">Action Required</h4>
              <p className="text-sm text-yellow-800">
                Please review all information above and agree to the terms and conditions to submit your application.
              </p>
            </div>
          </div>
        </div>
      )}

      {canSubmit && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">Ready to Submit</h4>
              <p className="text-sm text-green-800">
                Your application is complete and ready for submission. Click "Submit Application" to finalize your scholarship application.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}