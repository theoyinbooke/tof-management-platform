"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  GraduationCap,
  Users,
  DollarSign,
  FileText,
  AlertCircle,
  UserPlus,
  MessageSquare,
  Calendar,
  Edit
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Id } from "../../../../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ApplicationReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const applicationId = params.applicationId as Id<"applications">;
  
  const [reviewDialog, setReviewDialog] = useState<"approve" | "reject" | "waitlist" | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Fetch application details
  const application = useQuery(
    api.applications.getForReviewById,
    applicationId ? { applicationId } : "skip"
  );

  // Get available reviewers
  const reviewers = useQuery(
    api.users.getByRoles,
    application?.foundationId ? {
      foundationId: application.foundationId,
      roles: ["reviewer", "admin", "super_admin"]
    } : "skip"
  );

  // Mutations
  const updateStatus = useMutation(api.applications.updateStatus);
  const assignReviewer = useMutation(api.applications.assignReviewer);
  const createBeneficiaryFromApplication = useMutation(api.beneficiaries.createFromApplication);

  const getStatusBadge = (status: string) => {
    const styles = {
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      waitlisted: "bg-purple-100 text-purple-800"
    };
    
    return (
      <Badge className={styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}>
        {status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const handleStatusUpdate = async (status: string) => {
    if (!applicationId) return;
    
    try {
      await updateStatus({
        applicationId,
        status: status as any,
        reviewComments,
        internalNotes
      });
      
      toast.success(`Application ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "waitlisted"} successfully`);
      setReviewDialog(null);
      setReviewComments("");
      setInternalNotes("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update application status");
    }
  };

  const handleCreateBeneficiary = async () => {
    if (!applicationId || !application?.foundationId) return;
    
    try {
      await createBeneficiaryFromApplication({
        applicationId,
        foundationId: application.foundationId
      });
      toast.success("Beneficiary created successfully!");
      router.push("/beneficiaries");
    } catch (error: any) {
      toast.error(error.message || "Failed to create beneficiary");
    }
  };

  const handleAssignReviewer = async (reviewerId: string) => {
    if (!applicationId) return;
    
    try {
      await assignReviewer({
        applicationId,
        reviewerId: reviewerId as Id<"users">
      });
      toast.success("Reviewer assigned successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign reviewer");
    }
  };

  if (!application) {
    return (
      <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer"]}>
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Application not found</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin", "reviewer"]}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {application.firstName} {application.lastName}
              </h1>
              <p className="text-gray-600 mt-1">
                Application #{application.applicationNumber}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {getStatusBadge(application.status)}
            {application.status === "approved" && (
              <Button
                onClick={handleCreateBeneficiary}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Beneficiary
              </Button>
            )}
          </div>
        </div>

        {/* Application Status and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Review Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label>Assign Reviewer</Label>
                <Select
                  value={application.reviewerId || ""}
                  onValueChange={handleAssignReviewer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewers?.map((reviewer) => (
                      <SelectItem key={reviewer._id} value={reviewer._id}>
                        {reviewer.firstName} {reviewer.lastName} ({reviewer.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 md:items-end">
                {application.status !== "approved" && (
                  <Button
                    onClick={() => setReviewDialog("approve")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                )}
                {application.status !== "rejected" && (
                  <Button
                    onClick={() => setReviewDialog("reject")}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                )}
                <Button
                  onClick={() => setReviewDialog("waitlist")}
                  variant="outline"
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Waitlist
                </Button>
              </div>
            </div>

            {/* Review History */}
            {application.reviews && application.reviews.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-4">Review History</h3>
                <div className="space-y-4">
                  {application.reviews.map((review) => (
                    <div key={review._id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Review by {review.reviewerId}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </div>
                      </div>
                      {review.comments && (
                        <p className="text-gray-700 mb-2">{review.comments}</p>
                      )}
                      {review.internalNotes && (
                        <p className="text-sm text-gray-600 italic">
                          Internal: {review.internalNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                  <p className="mt-1">{application.firstName} {application.middleName} {application.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                  <p className="mt-1">{application.dateOfBirth}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Gender</Label>
                  <p className="mt-1 capitalize">{application.gender}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Contact</Label>
                  <div className="mt-1 space-y-1">
                    {application.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="w-3 h-3" />
                        {application.phone}
                      </div>
                    )}
                    {application.email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="w-3 h-3" />
                        {application.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Address</Label>
                <div className="mt-1 flex items-start gap-1">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p>{application.address.street}</p>
                    <p className="text-sm text-gray-600">
                      {application.address.city}, {application.address.state}, {application.address.country}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guardian Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Guardian Name</Label>
                <p className="mt-1">{application.guardian.firstName} {application.guardian.lastName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Relationship</Label>
                  <p className="mt-1 capitalize">{application.guardian.relationship}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Occupation</Label>
                  <p className="mt-1">{application.guardian.occupation || "Not provided"}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Contact Information</Label>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-1 text-sm">
                    <Phone className="w-3 h-3" />
                    {application.guardian.phone}
                  </div>
                  {application.guardian.email && (
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="w-3 h-3" />
                      {application.guardian.email}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Educational Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Educational Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Current Academic Level</Label>
                <p className="mt-1">
                  <Badge variant="outline" className="capitalize">
                    {application.education.currentLevel}
                  </Badge>
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Current School</Label>
                <p className="mt-1">{application.education.currentSchool}</p>
              </div>
              
              {application.education.specialNeeds && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Special Needs</Label>
                  <p className="mt-1 text-sm bg-yellow-50 p-3 rounded-md">
                    {application.education.specialNeeds}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.financial.familyIncome && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Family Income Range</Label>
                  <p className="mt-1">
                    <Badge variant="outline">
                      {application.financial.familyIncome.replace("_", " - ").replace("k", "K")}
                    </Badge>
                  </p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Has Other Support</Label>
                <p className="mt-1">
                  <Badge variant={application.financial.hasOtherSupport ? "secondary" : "outline"}>
                    {application.financial.hasOtherSupport ? "Yes" : "No"}
                  </Badge>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Essays Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Application Essays
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-600">Personal Statement</Label>
              <div className="mt-2 p-4 bg-gray-50 rounded-md">
                <p className="text-gray-700 leading-relaxed">
                  {application.essays.personalStatement}
                </p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Educational Goals</Label>
              <div className="mt-2 p-4 bg-gray-50 rounded-md">
                <p className="text-gray-700 leading-relaxed">
                  {application.essays.educationalGoals}
                </p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Why Applying</Label>
              <div className="mt-2 p-4 bg-gray-50 rounded-md">
                <p className="text-gray-700 leading-relaxed">
                  {application.essays.whyApplying}
                </p>
              </div>
            </div>
            
            {application.essays.additionalInfo && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Additional Information</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-700 leading-relaxed">
                    {application.essays.additionalInfo}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Application Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-sm font-medium text-gray-600">Submitted</Label>
                <p className="mt-1">{formatDate(application.submittedAt || application.createdAt)}</p>
              </div>
              {application.reviewedAt && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Reviewed</Label>
                  <p className="mt-1">{formatDate(application.reviewedAt)}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                <p className="mt-1">{formatDate(application.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialog !== null} onOpenChange={() => setReviewDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {reviewDialog === "approve" && "Approve Application"}
                {reviewDialog === "reject" && "Reject Application"}
                {reviewDialog === "waitlist" && "Waitlist Application"}
              </DialogTitle>
              <DialogDescription>
                Add comments and finalize your review decision for {application.firstName} {application.lastName}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Comments to Applicant</Label>
                <Textarea
                  placeholder="Comments that will be shared with the applicant..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Internal Notes (Private)</Label>
                <Textarea
                  placeholder="Internal notes for your team (not shared with applicant)..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleStatusUpdate(reviewDialog!)}
                className={
                  reviewDialog === "approve" 
                    ? "bg-green-600 hover:bg-green-700"
                    : reviewDialog === "reject"
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-purple-600 hover:bg-purple-700"
                }
              >
                {reviewDialog === "approve" && "Approve Application"}
                {reviewDialog === "reject" && "Reject Application"}
                {reviewDialog === "waitlist" && "Add to Waitlist"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}