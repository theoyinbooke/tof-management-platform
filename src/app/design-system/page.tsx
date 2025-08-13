"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Bell, 
  ChevronRight, 
  Home, 
  Users, 
  FileText, 
  DollarSign,
  GraduationCap,
  Calendar,
  Settings,
  HelpCircle,
  Check,
  X,
  AlertCircle,
  Info
} from "lucide-react";

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">TOF Design System</h1>
          <p className="text-gray-600 mt-1">Components and patterns following our design system</p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-12">
        {/* Colors Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="h-24 bg-primary rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-gray-500">#16a34a</p>
            </div>
            <div>
              <div className="h-24 bg-secondary rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Secondary</p>
              <p className="text-xs text-gray-500">#0ea5e9</p>
            </div>
            <div>
              <div className="h-24 bg-success rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Success</p>
              <p className="text-xs text-gray-500">#16a34a</p>
            </div>
            <div>
              <div className="h-24 bg-error rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Error</p>
              <p className="text-xs text-gray-500">#dc2626</p>
            </div>
            <div>
              <div className="h-24 bg-warning rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Warning</p>
              <p className="text-xs text-gray-500">#f59e0b</p>
            </div>
            <div>
              <div className="h-24 bg-info rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Info</p>
              <p className="text-xs text-gray-500">#3b82f6</p>
            </div>
            <div>
              <div className="h-24 bg-sidebar rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Sidebar</p>
              <p className="text-xs text-gray-500">#064e3b</p>
            </div>
            <div>
              <div className="h-24 bg-gradient rounded-lg mb-2"></div>
              <p className="text-sm font-medium">Gradient</p>
              <p className="text-xs text-gray-500">Multi-color</p>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Typography</h2>
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold">Heading 1 - 36px</h1>
            </div>
            <div>
              <h2 className="text-3xl font-bold">Heading 2 - 30px</h2>
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Heading 3 - 24px</h3>
            </div>
            <div>
              <h4 className="text-xl font-semibold">Heading 4 - 20px</h4>
            </div>
            <div>
              <p className="text-lg">Body Large - 18px</p>
            </div>
            <div>
              <p className="text-base">Body Base - 16px (default)</p>
            </div>
            <div>
              <p className="text-sm">Body Small - 14px</p>
            </div>
            <div>
              <p className="text-xs">Body Extra Small - 12px</p>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Buttons</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="destructive">Destructive Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="link">Link Button</Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large (Mobile)</Button>
                <Button size="xl">Extra Large</Button>
                <Button size="icon"><Bell className="h-4 w-4" /></Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">With Icons</h3>
              <div className="flex flex-wrap gap-4">
                <Button>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
                <Button variant="secondary">
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </Button>
                <Button variant="outline">
                  Settings
                  <Settings className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">States</h3>
              <div className="flex flex-wrap gap-4">
                <Button>Normal</Button>
                <Button disabled>Disabled</Button>
                <Button className="loading">Loading...</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Card</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">This is the card content area where you can place any content.</p>
              </CardContent>
            </Card>

            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>Hover to see effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">This card has hover effects for interactivity.</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle>Accented Card</CardTitle>
                <CardDescription>With left border accent</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">This card has a colored left border for emphasis.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Form Elements Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Form Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Input Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nigerian Phone</Label>
                  <Input id="phone" placeholder="+234 XXX XXX XXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disabled">Disabled Input</Label>
                  <Input id="disabled" placeholder="Cannot edit" disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Other Elements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Badges</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Avatars</Label>
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.jpg" />
                      <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback>CD</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback>EF</AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Category Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Academic</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Financial</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Program</span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Urgent</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Loading States Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Loading States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Skeleton Loading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shimmer Effect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 bg-gray-200 animate-shimmer rounded" />
                <div className="h-4 bg-gray-200 animate-shimmer rounded w-3/4" />
                <div className="h-4 bg-gray-200 animate-shimmer rounded w-1/2" />
                <div className="h-32 bg-gray-200 animate-shimmer rounded" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Notifications Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Notifications</h2>
          <Card>
            <CardHeader>
              <CardTitle>Toast Notifications</CardTitle>
              <CardDescription>Click buttons to trigger different toast types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => toast.success("Operation completed successfully!")}
                  className="bg-success hover:bg-success/90"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Success Toast
                </Button>
                <Button 
                  onClick={() => toast.error("Something went wrong. Please try again.")}
                  variant="destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Error Toast
                </Button>
                <Button 
                  onClick={() => toast.warning("Please review before proceeding.")}
                  className="bg-warning hover:bg-warning/90 text-white"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Warning Toast
                </Button>
                <Button 
                  onClick={() => toast.info("New features are available!")}
                  className="bg-info hover:bg-info/90 text-white"
                >
                  <Info className="mr-2 h-4 w-4" />
                  Info Toast
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Micro-interactions Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Micro-interactions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardHeader>
                <CardTitle>Hover Lift Effect</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Hover to see the card lift with shadow</p>
                <ChevronRight className="mt-4 h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pulse Animation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-3 w-3 bg-primary rounded-full animate-pulse"></div>
                    <div className="absolute top-0 left-0 h-3 w-3 bg-primary rounded-full animate-ping"></div>
                  </div>
                  <span className="text-sm">Active indicator</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Focus States</CardTitle>
              </CardHeader>
              <CardContent>
                <Input placeholder="Click to see focus ring" className="focus-ring" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Educational Components */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Educational Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary"></div>
              <CardHeader>
                <div className="h-32 bg-gradient rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="h-16 w-16 text-white" />
                </div>
                <CardTitle>Onboarding Card</CardTitle>
                <CardDescription>Welcome to the platform!</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  This card style is used for onboarding and educational content with visual elements.
                </p>
                <Button className="w-full">Get Started</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm">Hover over elements to see tooltips</p>
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <div className="relative">
                      <div className="h-3 w-3 bg-primary rounded-full"></div>
                      <div className="absolute top-0 left-0 h-3 w-3 bg-primary rounded-full animate-ping"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}