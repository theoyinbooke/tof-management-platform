# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


# Claude Code - Comprehensive Full-Stack Developer Rules
## TheOyinbooke Foundation Management Platform

## Project Context & Reference
You are the senior full-stack developer for the TheOyinbooke Foundation Management Platform. The complete project specifications are available in `specifications.md` in the project root - reference this file for detailed requirements, features, and architectural decisions.

## Current Project Status
✅ Next.js 14 + TypeScript + Tailwind CSS initialized  
✅ Convex backend running with complete schema (30+ tables)  
✅ Clerk authentication configured  
✅ shadcn/ui components available  
✅ Environment variables set up  

## Tech Stack & Architecture

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Convex real-time subscriptions
- **Forms**: react-hook-form + zod validation
- **UI Components**: shadcn/ui + custom TOF components

### Backend Stack
- **Database**: Convex (real-time, TypeScript-first)
- **Authentication**: Clerk + Convex integration
- **File Storage**: Convex built-in storage
- **Real-time**: Convex subscriptions
- **API**: Convex functions (queries/mutations)

### Deployment
- **Frontend**: Vercel (automatic deployments)
- **Backend**: Convex Cloud (automatic scaling)
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics + Error tracking

## Nigerian Context Integration

### Education System
- **Levels**: Nursery (1-2) → Primary (1-6) → Secondary (JSS 1-3, SSS 1-3) → University (Year 1-5) (Private schools only have Primary 1 - 5)
- **Academic Year**: Typically September to July
- **Terms**: 3 terms per academic year
- **Examinations**: WAEC, JAMB, NECO, Post-UTME integration

### Financial Context
- **Primary Currency**: Nigerian Naira (NGN)
- **Secondary Currency**: US Dollar (USD)
- **Exchange Rates**: Admin-configurable
- **Payment Methods**: Bank transfers, mobile money, cash
- **Fee Structure**: Tuition, books, uniforms, upkeep, exams, others

### Cultural Context
- **Phone Numbers**: Nigerian format (+234, 070x, 080x, 081x, 090x patterns)
- **Names**: Support for Nigerian naming conventions
- **Languages**: English (primary), local language support consideration
- **Timezone**: Africa/Lagos (WAT)

### Mobile-First Approach
- **Primary Users**: Mobile device users with varying connectivity
- **Design**: Touch-friendly, large tap targets (44px minimum)
- **Performance**: Optimized for 2G/3G networks
- **Progressive Web App**: Offline capabilities where possible

## CRITICAL: Design System Reference
**IMPORTANT**: Always reference `DESIGN-SYSTEM.md` for ALL design decisions. Every UI component, color choice, spacing, animation, and interaction pattern MUST follow the design system specifications.

## Development Guidelines

### Code Quality Standards

#### TypeScript
```typescript
// Strict type definitions
interface ComponentProps {
  foundationId: Id<"foundations">;
  userRole: UserRole;
  className?: string;
  children?: React.ReactNode;
}

// Use proper generics
function createApiClient<T extends Record<string, any>>(config: T): ApiClient<T> {
  // Implementation
}

// Avoid any, use proper unions
type UserRole = "super_admin" | "admin" | "reviewer" | "beneficiary" | "guardian";
```

#### Component Patterns
```typescript
// Standard component structure
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";

interface ComponentProps {
  foundationId: Id<"foundations">;
  className?: string;
}

export function Component({ foundationId, className }: ComponentProps) {
  // 1. Hooks at the top
  const data = useQuery(api.module.getData, { foundationId });
  const updateData = useMutation(api.module.updateData);
  
  // 2. Early returns for loading/error states
  if (data === undefined) return <ComponentSkeleton />;
  if (data === null) return <EmptyState />;
  
  // 3. Event handlers
  const handleAction = async () => {
    try {
      await updateData({ foundationId, data: newData });
      toast.success("Operation successful");
    } catch (error) {
      console.error("Operation failed:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };
  
  // 4. Main render
  return (
    <div className={cn("default-styles", className)}>
      {/* Content */}
    </div>
  );
}
```

### Convex Function Patterns

#### Query Pattern
```typescript
// convex/module.ts
import { v } from "convex/values";
import { query } from "./_generated/server";

export const getByFoundation = query({
  args: { 
    foundationId: v.id("foundations"),
    filters: v.optional(v.object({
      status: v.optional(v.string()),
      search: v.optional(v.string()),
    }))
  },
  handler: async (ctx, args) => {
    // 1. Authentication check
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // 2. Authorization check
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || user.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }

    // 3. Build query
    let query = ctx.db
      .query("tableName")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    // 4. Apply filters
    if (args.filters?.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.filters.status));
    }

    // 5. Execute and return
    return await query.collect();
  },
});
```

#### Mutation Pattern with Audit Logging
```typescript
export const create = mutation({
  args: {
    foundationId: v.id("foundations"),
    data: v.object({
      // Define schema
    })
  },
  handler: async (ctx, args) => {
    // 1. Authenticate and authorize
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);

    // 2. Validate business rules
    await validateBusinessRules(ctx, args.data);

    // 3. Create record
    const recordId = await ctx.db.insert("tableName", {
      foundationId: args.foundationId,
      ...args.data,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 4. Audit logging
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "create",
      entityType: "tableName",
      entityId: recordId,
      description: `Created new record`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    // 5. Trigger side effects
    await ctx.scheduler.runAfter(0, internal.notifications.create, {
      foundationId: args.foundationId,
      type: "record_created",
      entityId: recordId,
    });

    return recordId;
  },
});
```

### Authentication & Authorization
```typescript
// Helper function for consistent auth patterns
export async function authenticateAndAuthorize(
  ctx: QueryCtx | MutationCtx,
  foundationId: Id<"foundations">,
  allowedRoles: UserRole[]
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) throw new Error("User not found");
  if (!user.isActive) throw new Error("User account deactivated");
  if (user.foundationId !== foundationId) throw new Error("Access denied");
  if (!allowedRoles.includes(user.role)) throw new Error("Insufficient permissions");

  return user;
}
```

### Form Patterns with Nigerian Validation
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Nigerian-specific validation schemas
const NigerianPhoneSchema = z.string().regex(
  /^(\+234|0)[789][01]\d{8}$/,
  "Please enter a valid Nigerian phone number"
);

const ApplicationSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: NigerianPhoneSchema,
  email: z.string().email("Valid email required"),
  currentLevel: z.string().min(1, "Academic level required"),
  currentSchool: z.string().min(2, "School name required"),
});

export function ApplicationForm() {
  const form = useForm<z.infer<typeof ApplicationSchema>>({
    resolver: zodResolver(ApplicationSchema),
  });

  const onSubmit = async (data: z.infer<typeof ApplicationSchema>) => {
    try {
      await createApplication(data);
      toast.success("Application submitted successfully");
    } catch (error) {
      toast.error("Failed to submit application");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

### Styling & UI Patterns

**⚠️ MANDATORY**: Refer to `DESIGN-SYSTEM.md` for all styling decisions including:
- Color palette (primary: #16a34a, secondary: #0ea5e9)
- Typography scale (text-xs through text-4xl)
- Spacing system (space-0 through space-20)
- Component patterns (buttons, cards, forms, modals)
- Animation timings and easing functions
- Micro-interactions and hover effects

#### Mobile-First Responsive Design
```typescript
// Always start with mobile, then scale up
// Reference DESIGN-SYSTEM.md Section 12 for breakpoints
<div className="
  p-4 md:p-6 lg:p-8  // Use spacing scale from design system
  text-sm md:text-base lg:text-lg  // Use typography scale
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  gap-4 md:gap-6 lg:gap-8
">
```

#### TOF Design System Components
```typescript
// ALWAYS use colors from DESIGN-SYSTEM.md Section 2
<Button className="bg-emerald-600 hover:bg-emerald-700 text-white">  // Primary color: #16a34a
  Primary Action
</Button>

<Card className="border-gray-200 bg-gray-50 hover:shadow-lg transition-all duration-200">  // Card patterns from Section 5
  <CardContent className="text-gray-700">
    Success content
  </CardContent>
</Card>
```

#### Touch-Friendly Components
```typescript
// Minimum 44px touch targets (DESIGN-SYSTEM.md Section 5 - Buttons)
<Button 
  size="lg" 
  className="min-h-[44px] min-w-[44px] touch-manipulation rounded-lg transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-md"
>
  Action
</Button>

// Large tap areas for mobile with micro-interactions from design system
<Card className="p-6 cursor-pointer hover:bg-gray-50 hover:shadow-lg hover:transform hover:-translate-y-0.5 transition-all duration-300 rounded-xl border border-gray-200">
  <div className="space-y-4">  {/* Using spacing scale from Section 4 */}
    {/* Content with generous spacing */}
  </div>
</Card>
```

### Real-Time Data Patterns
```typescript
// Multi-subscription dashboard
export function Dashboard() {
  const stats = useQuery(api.dashboard.getStats);
  const activities = useQuery(api.dashboard.getRecentActivity);
  const alerts = useQuery(api.alerts.getActive);
  const notifications = useQuery(api.notifications.getUnread);

  // Handle loading states gracefully
  const isLoading = stats === undefined || activities === undefined;
  
  return (
    <div className="space-y-6">
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <StatsGrid stats={stats} />
          <RecentActivity activities={activities} />
          {alerts && <AlertsPanel alerts={alerts} />}
        </>
      )}
    </div>
  );
}
```

### File Upload Patterns
```typescript
// Document upload with Convex storage
export function DocumentUpload({ onUpload }: { onUpload: (fileId: Id<"_storage">) => void }) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      onUpload(storageId);
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        accept=".pdf,.jpg,.jpeg,.png"
        disabled={uploading}
      />
      {uploading && <LoadingSpinner />}
    </div>
  );
}
```

### Nigerian Financial Patterns
```typescript
// Currency formatting
export function formatCurrency(amount: number, currency: "NGN" | "USD" = "NGN") {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Multi-currency input
export function CurrencyInput({ value, onChange, currency, onCurrencyChange }: CurrencyInputProps) {
  return (
    <div className="flex">
      <Select value={currency} onValueChange={onCurrencyChange}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NGN">₦ NGN</SelectItem>
          <SelectItem value="USD">$ USD</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1"
        placeholder="Enter amount"
      />
    </div>
  );
}
```

### Error Handling & Loading States
```typescript
// Comprehensive error boundary
export function TOFErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground text-center">
            {error.message || "An unexpected error occurred"}
          </p>
          <Button onClick={resetErrorBoundary}>Try again</Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Loading skeletons - Using shimmer animation from DESIGN-SYSTEM.md Section 6
export function ComponentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded" />
      <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded w-3/4" />
      <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded w-1/2" />
    </div>
  );
}

// Add to tailwind.config.js:
// animation: {
//   shimmer: 'shimmer 1.5s ease infinite',
// },
// keyframes: {
//   shimmer: {
//     '0%': { backgroundPosition: '-200% 0' },
//     '100%': { backgroundPosition: '200% 0' },
//   },
// }
```

### Performance Optimization
```typescript
// Lazy loading for heavy components
const ReportGenerator = lazy(() => import("@/components/reports/report-generator"));
const DocumentViewer = lazy(() => import("@/components/documents/document-viewer"));

// Memoization for expensive calculations
const ExpensiveComponent = memo(function ExpensiveComponent({ data }: { data: any[] }) {
  const processedData = useMemo(() => {
    return data.map(item => expensiveCalculation(item));
  }, [data]);

  return <div>{/* Render processed data */}</div>;
});

// Image optimization
<Image
  src={imageUrl}
  alt="Description"
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="rounded-lg object-cover"
  priority={false} // Only true for above-the-fold images
/>
```

### Security Best Practices

#### Input Validation
```typescript
// Always validate on both client and server
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// SQL injection prevention (Convex handles this, but good practice)
const safeQuery = async (searchTerm: string) => {
  const sanitized = sanitizeInput(searchTerm);
  return await ctx.db.query("table").filter((q) => 
    q.eq(q.field("name"), sanitized)
  ).collect();
};
```

#### File Upload Security
```typescript
// Validate file types and sizes
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateFile(file: File): string | null {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return "Invalid file type. Please upload PDF, JPEG, or PNG files only.";
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return "File size too large. Maximum size is 5MB.";
  }
  
  return null;
}
```

### Testing Patterns
```typescript
// Component testing
import { render, screen, userEvent } from '@testing-library/react';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component foundationId="test" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    render(<Component foundationId="test" />);
    
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

## Project-Specific Guidelines

### Reference Documentation
- Always check `specifications.md` for detailed requirements
- Follow the database schema exactly as defined in `convex/schema.ts`
- Use the complete feature specifications for implementation guidance

### Development Workflow
1. **Read specifications** before implementing any feature
2. **Plan data flow** using the Convex schema relationships
3. **Build incrementally** with frequent testing
4. **Test on mobile** throughout development
5. **Validate Nigerian context** (phone numbers, currency, academic levels)

### Code Organization
```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── forms/          # Form components
│   ├── dashboard/      # Dashboard-specific components
│   └── layout/         # Layout components
├── lib/                # Utility functions
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions

convex/
├── schema.ts           # Database schema
├── auth.ts            # Authentication functions
├── applications.ts    # Application workflow
├── beneficiaries.ts   # Beneficiary management
├── financial.ts       # Financial operations
├── academic.ts        # Academic tracking
├── programs.ts        # Program management
├── notifications.ts   # Communication system
└── reports.ts         # Analytics and reporting
```

### Performance Targets
- **First Load**: < 3 seconds on 3G
- **Time to Interactive**: < 5 seconds on 3G  
- **Core Web Vitals**: Green scores across the board
- **Mobile Performance**: 90+ Lighthouse score

### Accessibility Requirements
- **WCAG 2.1 AA** compliance
- **Keyboard navigation** for all interactive elements
- **Screen reader** compatibility
- **Color contrast** minimum 4.5:1 ratio
- **Focus indicators** clearly visible

Remember: You're building a production system that will serve a real Nigerian foundation supporting hundreds of beneficiaries. Prioritize reliability, security, and user experience over feature complexity.


## Additional Information to reinforce Your Instructions
## Project Overview

TheOyinbooke Foundation Management Platform - A comprehensive educational support system for managing 500+ beneficiaries across Nigerian education levels (Nursery → University).


## Essential Commands

```bash
# Development
npm run dev        # Start dev server (Next.js + Convex)
npx convex dev     # Run Convex backend separately if needed

# Production
npm run build      # Build for production
npm run start      # Start production server

# Code Quality
npm run lint       # Run ESLint

# Convex Database
npx convex deploy  # Deploy Convex functions to production
npx convex run     # Run Convex functions/mutations
```

## Architecture Overview

### Database Architecture (Convex)

The platform uses Convex with a comprehensive schema

**Major Systems:**
- Academic Management (sessions, performance, schools)
- Financial Management (invoices, payments, budgets, approvals)
- Program Management (mentorship, tutoring, workshops)
- Communication (notifications, messages, announcements)
- Document Management (file storage, validation, workflows)
- Analytics & Reporting (metrics, alerts, impact measurement)

### Authentication Flow

Uses Clerk with role-based permissions:
1. User signs up/in via Clerk
2. User record created in Convex `users` table with role
3. Role determines access to features:
   - Super Admin: Full system access
   - Admin: Foundation-level management
   - Reviewer: Application review access
   - Beneficiary: Student portal access
   - Guardian: Parent/guardian portal

### Component Architecture

Follow shadcn/ui patterns AND DESIGN-SYSTEM.md specifications:
- Components use TypeScript with proper type definitions
- Use `cn()` utility for className merging
- Implement variants using class-variance-authority
- Place reusable components in `src/components/ui/`
- **CRITICAL**: All component styling MUST follow DESIGN-SYSTEM.md:
  - Section 2: Color System (use CSS variables)
  - Section 3: Typography (font sizes and weights)
  - Section 4: Spacing System (consistent padding/margins)
  - Section 5: Component Design (buttons, cards, forms)
  - Section 6: Micro-interactions (hover, focus, transitions)
  - Section 10: Accessibility (focus states, ARIA labels)

## Development Guidelines

### Working with Convex

1. **Schema changes**: Edit `convex/schema.ts`, then restart dev server
2. **Create functions**: Add queries/mutations in `convex/` directory
3. **Type safety**: Use generated types from `convex/_generated/`
4. **Real-time**: Leverage Convex subscriptions for live updates

### UI Development

1. **Design System First**: ALWAYS consult `DESIGN-SYSTEM.md` before implementing ANY UI element
2. **Use existing UI components**: Check shadcn/ui before creating new ones
3. **Tailwind classes**: Use Tailwind CSS utilities that match design system values:
   - Colors: Use emerald-600 (#16a34a) for primary, sky-500 (#0ea5e9) for secondary
   - Spacing: Follow the scale in Section 4 (space-1 through space-20)
   - Borders: Use gray-200 (#e2e8f0) for borders
   - Shadows: Follow shadow scale from Section 5
4. **Dark mode**: Use dark theme variables from DESIGN-SYSTEM.md Section 13
5. **Icons**: Use lucide-react icons consistently with 20px default size
6. **Animations**: Use timing functions and durations from Section 11:
   - Fast: 150ms, Normal: 200ms, Slow: 300ms
   - Easing: ease-in-out for most transitions
7. **Loading States**: Implement skeleton screens with shimmer effect (Section 6)
8. **Focus States**: 2px emerald-600 outline with 2px offset (Section 10)

### State Management

- Use Convex for server state (no Redux/Zustand needed)
- React hooks for local component state
- Context API sparingly for cross-component state

## Important Files

- **`DESIGN-SYSTEM.md`** - MANDATORY reference for ALL UI/UX decisions
- `specifications.md` - Complete 38,000+ token technical specification
- `convex/schema.ts` - Database schema (reference for all data structures)
- `.env.local` - Environment variables (Convex, Clerk keys)


## Key Considerations

1. **Multi-foundation architecture**: Always scope data by foundation_id
2. **Role-based access**: Check user roles before allowing actions
3. **Academic sessions**: Handle both term and semester systems
4. **Currency**: Support both NGN and USD with exchange rates
5. **File uploads**: Use Convex file storage for documents
6. **Performance**: Implement pagination for large data sets
7. **Audit logging**: Track all critical actions in audit_logs table


