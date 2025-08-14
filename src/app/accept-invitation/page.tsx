"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignUp, useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface InvitationData {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  foundation: {
    _id: string;
    name: string;
  } | null;
}

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();
  const { signUp, setActive } = useSignUp();
  
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query to validate invitation token
  const invitationData = useQuery(
    api.users.validateInvitationToken,
    token ? { token } : "skip"
  ) as InvitationData | undefined | null;

  // Mutation to accept invitation
  const acceptInvitation = useMutation(api.users.acceptInvitation);

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  // Handle invitation acceptance
  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError("Invalid invitation token");
      return;
    }

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!invitationData?.user) {
      setError("Invalid invitation data");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create user account with Clerk
      if (!signUp) {
        throw new Error("Sign up not initialized");
      }

      const signUpResult = await signUp.create({
        emailAddress: invitationData.user.email,
        password: password,
      });

      if (!signUpResult?.createdUserId) {
        throw new Error("Failed to create user account");
      }

      // Update user profile with first and last name
      if (signUpResult.status === "complete" || signUpResult.status === "missing_requirements") {
        try {
          await signUp.update({
            firstName: invitationData.user.firstName,
            lastName: invitationData.user.lastName,
          });
        } catch (profileError) {
          console.warn("Could not update profile:", profileError);
          // Continue with the flow even if profile update fails
        }
      }

      // Accept the invitation in our system first
      await acceptInvitation({
        token,
        clerkId: signUpResult.createdUserId,
      });

      // Then attempt to complete sign-in
      if (signUpResult.status === "complete" && setActive) {
        await setActive({ session: signUpResult.createdSessionId });
        
        toast.success("Welcome! Your account has been activated successfully.");
        router.push("/dashboard");
      } else if (signUpResult.status === "missing_requirements") {
        // Handle email verification
        toast.success("Account created! Please check your email to verify your account.");
        // Redirect to verification page or sign-in
        router.push(`/sign-in?email=${encodeURIComponent(invitationData.user.email)}`);
      } else {
        // Unknown status, redirect to sign-in
        toast.success("Account created! Please sign in to continue.");
        router.push("/sign-in");
      }
    } catch (err) {
      console.error("Invitation acceptance error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to accept invitation";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <p>Invalid invitation link</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading invitation data
  if (invitationData === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p>Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid or expired invitation
  if (invitationData === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Invalid Invitation</h2>
                <p className="text-gray-600 mt-2">
                  This invitation link is invalid, expired, or has already been used.
                </p>
              </div>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't render if user is already signed in
  if (isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
              <span className="text-white font-bold text-lg">TOF</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Accept Invitation
          </h2>
          <p className="text-gray-600">
            Complete your account setup to join {invitationData.foundation?.name}
          </p>
        </div>

        <Card className="shadow-lg border border-gray-200 rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <UserPlus className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Welcome, {invitationData.user.firstName}!
                </CardTitle>
                <CardDescription>
                  You've been invited as a {invitationData.user.role.replace('_', ' ')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* User Details */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                  {invitationData.user.email}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Role</Label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md capitalize">
                  {invitationData.user.role.replace('_', ' ')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Organization</Label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                  {invitationData.foundation?.name}
                </p>
              </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handleAcceptInvitation} className="space-y-4">
              <div>
                <Label htmlFor="password">Create Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={8}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="mt-1"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="w-full bg-primary hover:bg-primary-hover"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Invitation & Create Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">
          By accepting this invitation, you agree to TheOyinbooke Foundation's terms of service.
        </p>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function AcceptInvitationLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Loading invitation...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component with Suspense boundary
export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<AcceptInvitationLoading />}>
      <AcceptInvitationContent />
    </Suspense>
  );
}