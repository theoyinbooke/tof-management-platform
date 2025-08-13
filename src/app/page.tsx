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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TOF</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">TheOyinbooke Foundation</h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/sign-in">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <Badge className="mb-4" variant="secondary">
              Empowering Nigerian Students Since 2015
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Educational Support for
              <span className="text-primary block mt-2">Brighter Futures</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Comprehensive platform for managing educational support programs, from application to graduation.
              Supporting 500+ beneficiaries across Nigeria.
            </p>
            <div className="flex gap-4 justify-center mb-12">
              <Link href="/sign-up">
                <Button size="lg" className="min-h-[48px]">
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="min-h-[48px]">
                Learn More
              </Button>
            </div>
          </div>

          {/* Hero Image/Gradient */}
          <div className="relative rounded-2xl overflow-hidden h-[400px] bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10">
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comprehensive Educational Support
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform provides end-to-end management for educational support programs,
              ensuring every beneficiary gets the support they need to succeed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose TheOyinbooke Foundation?
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Complete Academic Support</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      From nursery to university, we support students throughout their educational journey.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Financial Assistance</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Tuition, books, uniforms, and upkeep support for qualifying students.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Mentorship Programs</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Connect with mentors and participate in career guidance workshops.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Performance Monitoring</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Regular tracking and support to ensure academic success.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Link href="/sign-up">
                  <Button size="lg">
                    Start Your Application
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl transform rotate-3"></div>
              <Card className="relative">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Award className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">95%</p>
                        <p className="text-sm text-gray-600">Success Rate</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <GraduationCap className="h-8 w-8 text-secondary" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">500+</p>
                        <p className="text-sm text-gray-600">Active Beneficiaries</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Heart className="h-8 w-8 text-error" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">8 Years</p>
                        <p className="text-sm text-gray-600">Of Impact</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-gray-600">Hear from our beneficiaries and partners</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Educational Journey?
          </h2>
          <p className="text-white/90 mb-8 text-lg">
            Join hundreds of students who have transformed their lives through education.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="min-h-[48px]">
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="min-h-[48px] bg-white/10 text-white border-white hover:bg-white/20">
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">TOF</span>
                </div>
                <h3 className="font-semibold">TheOyinbooke Foundation</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering Nigerian students through comprehensive educational support.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/programs" className="hover:text-white transition-colors">Programs</Link></li>
                <li><Link href="/apply" className="hover:text-white transition-colors">Apply</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
                <li><Link href="/guidelines" className="hover:text-white transition-colors">Guidelines</Link></li>
                <li><Link href="/resources" className="hover:text-white transition-colors">Learning Resources</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Lagos, Nigeria</li>
                <li>+234 XXX XXX XXXX</li>
                <li>info@toyinbookefoundation.org</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 TheOyinbooke Foundation. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}