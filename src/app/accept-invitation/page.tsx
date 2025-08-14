"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Info } from "lucide-react";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();
  
  const invitationAccepted = searchParams.get("invitation-accepted");

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    } else if (invitationAccepted === "true") {
      // User just completed Clerk signup from invitation, redirect to sign-in
      router.push("/sign-in");
    }
  }, [isSignedIn, invitationAccepted, router]);

  // This page is now just for display while redirecting
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
            Welcome to TheOyinbooke Foundation
          </h2>
        </div>

        <Card className="shadow-lg border border-gray-200 rounded-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              {invitationAccepted === "true" ? (
                <>
                  <div className="flex justify-center">
                    <CheckCircle className="h-12 w-12 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Account Created Successfully!</h3>
                    <p className="text-gray-600 mt-2">
                      Your account has been created. You'll be redirected to sign in shortly.
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p>Redirecting...</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-center">
                    <Info className="h-12 w-12 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Invitation System Updated</h3>
                    <p className="text-gray-600 mt-2">
                      Our invitation system has been updated. If you have an invitation link, 
                      it will redirect you to create your account directly.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={() => router.push("/sign-up")}
                      className="w-full bg-primary hover:bg-primary-hover"
                    >
                      Create Account
                    </Button>
                    <Button
                      onClick={() => router.push("/sign-in")}
                      variant="outline"
                      className="w-full"
                    >
                      Sign In
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">
          By using TheOyinbooke Foundation platform, you agree to our terms of service.
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
            <p>Loading...</p>
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