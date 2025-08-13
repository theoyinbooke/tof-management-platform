"use client";

import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { 
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

interface ApplicationEssaysStepProps {
  form: UseFormReturn<any>;
}

export function ApplicationEssaysStep({ form }: ApplicationEssaysStepProps) {
  const [wordCounts, setWordCounts] = useState({
    personalStatement: 0,
    educationalGoals: 0,
    whyApplying: 0,
    additionalInfo: 0,
  });

  const updateWordCount = (fieldName: string, text: string) => {
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCounts(prev => ({
      ...prev,
      [fieldName]: wordCount
    }));
  };

  const getProgress = (wordCount: number, minWords: number = 50, maxWords: number = 200) => {
    return Math.min((wordCount / maxWords) * 100, 100);
  };

  const getProgressColor = (wordCount: number, minWords: number = 50) => {
    if (wordCount < minWords) return "bg-red-500";
    if (wordCount < minWords * 1.5) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-purple-600 mt-0.5">
            ✍️
          </div>
          <div>
            <h4 className="font-medium text-purple-900 mb-1">Application Essays</h4>
            <p className="text-sm text-purple-800">
              These essays help us understand who you are, your goals, and why you're applying 
              for this scholarship. Be honest, thoughtful, and let your personality show through. 
              There are no "right" answers - we want to hear your authentic voice.
            </p>
          </div>
        </div>
      </div>

      {/* Personal Statement */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Personal Statement</h3>
        <FormField
          control={form.control}
          name="essays.personalStatement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tell us about yourself *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your story, interests, achievements, challenges you've overcome, or experiences that have shaped who you are. What makes you unique?"
                  className="min-h-[150px]"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    updateWordCount('personalStatement', e.target.value);
                  }}
                />
              </FormControl>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Word count: {wordCounts.personalStatement}</span>
                  <span>Recommended: 50-200 words</span>
                </div>
                <Progress 
                  value={getProgress(wordCounts.personalStatement)} 
                  className={`h-1 ${getProgressColor(wordCounts.personalStatement)}`}
                />
              </div>
              <FormDescription>
                Minimum 100 characters required. Be authentic and share what makes you unique.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Educational Goals */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Educational Goals</h3>
        <FormField
          control={form.control}
          name="essays.educationalGoals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What are your educational and career aspirations? *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your academic goals, what you want to study, career aspirations, and how education fits into your future plans. What do you hope to achieve?"
                  className="min-h-[150px]"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    updateWordCount('educationalGoals', e.target.value);
                  }}
                />
              </FormControl>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Word count: {wordCounts.educationalGoals}</span>
                  <span>Recommended: 50-200 words</span>
                </div>
                <Progress 
                  value={getProgress(wordCounts.educationalGoals)} 
                  className={`h-1 ${getProgressColor(wordCounts.educationalGoals)}`}
                />
              </div>
              <FormDescription>
                Minimum 100 characters required. Share your dreams and how education will help you achieve them.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Why Applying */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Why This Scholarship</h3>
        <FormField
          control={form.control}
          name="essays.whyApplying"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Why are you applying for this scholarship? *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Explain why you need this scholarship, how it will help you, and what it means to you and your family. What challenges are you facing that this scholarship would help address?"
                  className="min-h-[150px]"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    updateWordCount('whyApplying', e.target.value);
                  }}
                />
              </FormControl>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Word count: {wordCounts.whyApplying}</span>
                  <span>Recommended: 50-200 words</span>
                </div>
                <Progress 
                  value={getProgress(wordCounts.whyApplying)} 
                  className={`h-1 ${getProgressColor(wordCounts.whyApplying)}`}
                />
              </div>
              <FormDescription>
                Minimum 100 characters required. Help us understand your specific need and how we can help.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Additional Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
        <FormField
          control={form.control}
          name="essays.additionalInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Is there anything else you'd like us to know?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional: Share any additional information that you think would help us understand your situation better. This could include special circumstances, achievements, community involvement, or anything else you'd like to highlight."
                  className="min-h-[120px]"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    updateWordCount('additionalInfo', e.target.value);
                  }}
                />
              </FormControl>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Word count: {wordCounts.additionalInfo}</span>
                <span>Optional field</span>
              </div>
              <FormDescription>
                Optional: Use this space for any additional context that wasn't covered in the other questions.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Writing Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Writing Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Be honest and authentic</li>
            <li>• Use specific examples</li>
            <li>• Show, don't just tell</li>
            <li>• Proofread before submitting</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">✅ What We Look For</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Clear communication</li>
            <li>• Genuine motivation</li>
            <li>• Personal growth mindset</li>
            <li>• Commitment to education</li>
          </ul>
        </div>
      </div>
    </div>
  );
}