"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  GraduationCap,
  Users,
  Target,
  TrendingUp,
  Shield,
  Heart,
  BookOpen,
  Award,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  Star,
} from "lucide-react";

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  const features = [
    {
      icon: Users,
      title: "Comprehensive Management",
      description: "Manage 500+ beneficiaries across all Nigerian education levels from nursery to university.",
    },
    {
      icon: Target,
      title: "Application Workflow",
      description: "Streamlined application process with multi-reviewer system and automated decision tracking.",
    },
    {
      icon: BookOpen,
      title: "Academic Tracking",
      description: "Monitor performance with configurable alerts and intervention flagging system.",
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Role-based access control with comprehensive audit logging for transparency.",
    },
  ];

  const stats = [
    { value: "500+", label: "Beneficiaries Supported" },
    { value: "₦50M+", label: "Funds Disbursed" },
    { value: "95%", label: "Success Rate" },
    { value: "12+", label: "Partner Schools" },
  ];

  const testimonials = [
    {
      quote: "The foundation changed my life. I'm now in my final year studying Medicine.",
      author: "Mary A.",
      role: "Beneficiary, University of Lagos",
      rating: 5,
    },
    {
      quote: "Efficient platform that makes managing our educational support seamless.",
      author: "John D.",
      role: "Program Administrator",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="container mx-auto px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs md:text-sm">TOF</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm md:text-base">TheOyinbooke<span className="hidden sm:inline"> Foundation</span></h2>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/sign-in">
                <Button variant="outline" size="sm" className="md:px-4">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="md:px-4">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - grows to push footer down */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-20 pb-6 px-4 md:pt-24 md:pb-8 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <Badge className="mb-3 text-xs md:text-sm" variant="secondary">
              Empowering Nigerian Students Since 2015
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
              Educational Support for
              <span className="text-primary block mt-1">Brighter Futures</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 md:mb-6 max-w-3xl mx-auto px-2">
              Comprehensive platform for managing educational support programs, from application to graduation.
              <span className="block sm:inline"> Supporting 500+ beneficiaries across Nigeria.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 md:mb-8 px-4 sm:px-0">
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button size="lg" className="min-h-[44px] w-full sm:w-auto text-sm md:text-base">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>
              <Link href="/sign-in" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="min-h-[44px] w-full sm:w-auto text-sm md:text-base">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image/Gradient */}
          <div className="relative rounded-xl md:rounded-2xl overflow-hidden h-[150px] sm:h-[180px] md:h-[200px] bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10">
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 p-3 md:p-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 md:py-8 md:px-6 bg-gray-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold text-xs md:text-sm">TOF</span>
                </div>
                <h3 className="font-semibold text-sm md:text-base">TheOyinbooke<span className="hidden min-[400px]:inline"> Foundation</span></h3>
              </div>
              <p className="text-gray-400 text-xs md:text-sm">
                Empowering Nigerian students through comprehensive educational support.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Quick Links</h4>
              <ul className="space-y-1 text-gray-400 text-xs md:text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/apply" className="hover:text-white transition-colors">Apply</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Contact</h4>
              <ul className="space-y-1 text-gray-400 text-xs md:text-sm">
                <li>Lagos, Nigeria</li>
                <li className="break-all">+234 XXX XXX XXXX</li>
                <li className="break-all text-[11px] md:text-sm">info@toyinbookefoundation.org</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-5 pt-5 md:mt-6 md:pt-6 text-center text-gray-400 text-xs md:text-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>&copy; 2025 TheOyinbooke Foundation. <span className="hidden sm:inline">All rights reserved.</span></p>
              <div className="flex gap-3 md:gap-4 text-xs md:text-sm">
                <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}