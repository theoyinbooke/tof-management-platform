"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Edit3, 
  AlertCircle,
  Shield,
  ShieldCheck,
  UserCheck,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

const EditUserSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  role: z.enum(["super_admin", "admin", "reviewer", "beneficiary", "guardian"], {
    required_error: "Please select a role",
  }),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

type EditUserFormData = z.infer<typeof EditUserSchema>;

interface EditUserDialogProps {
  userId: Id<"users">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ userId, open, onOpenChange }: EditUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user data
  const user = useQuery(api.admin.getUserById, { userId });
  const updateUserProfile = useMutation(api.users.updateProfile);
  const updateUserRole = useMutation(api.admin.updateUserRole);
  const toggleUserStatus = useMutation(api.users.toggleActiveStatus);

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(EditUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "beneficiary",
      isActive: true,
      notes: "",
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        isActive: user.isActive,
        notes: user.notes || "",
      });
    }
  }, [user, form]);

  const roleDescriptions = {
    super_admin: "System-wide access with full administrative privileges",
    admin: "Full access to foundation settings, user management, and all features",
    reviewer: "Can review applications, manage beneficiaries, and view reports",
    beneficiary: "Student access to their own profile, documents, and progress",
    guardian: "Parent/guardian access to their child's information and communication"
  };

  const roleIcons = {
    super_admin: <ShieldCheck className="w-4 h-4 text-red-600" />,
    admin: <ShieldCheck className="w-4 h-4 text-blue-600" />,
    reviewer: <Shield className="w-4 h-4 text-purple-600" />,
    beneficiary: <UserCheck className="w-4 h-4 text-green-600" />,
    guardian: <Users className="w-4 h-4 text-orange-600" />
  };

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update basic profile information
      if (
        data.firstName !== user.firstName ||
        data.lastName !== user.lastName ||
        data.phone !== user.phone ||
        data.notes !== user.notes
      ) {
        await updateUserProfile({
          userId: user._id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || undefined,
          // Note: email updates should be handled separately for security
        });
      }

      // Update role if changed
      if (data.role !== user.role) {
        await updateUserRole({
          userId: user._id,
          newRole: data.role,
        });
      }

      // Update active status if changed
      if (data.isActive !== user.isActive) {
        await toggleUserStatus({
          userId: user._id,
        });
      }

      toast.success("User updated successfully");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = form.watch("role");

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit User: {user.firstName} {user.lastName}
          </DialogTitle>
          <DialogDescription>
            Update user information, role, and permissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john.doe@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+234 800 000 0000" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Role & Permissions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Role & Permissions</h3>
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="super_admin">
                          <div className="flex items-center gap-2">
                            {roleIcons.super_admin}
                            <span>Super Admin</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            {roleIcons.admin}
                            <span>Admin</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="reviewer">
                          <div className="flex items-center gap-2">
                            {roleIcons.reviewer}
                            <span>Reviewer</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="beneficiary">
                          <div className="flex items-center gap-2">
                            {roleIcons.beneficiary}
                            <span>Beneficiary</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="guardian">
                          <div className="flex items-center gap-2">
                            {roleIcons.guardian}
                            <span>Guardian</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedRole && (
                      <FormDescription className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 inline-flex">{roleIcons[selectedRole]}</span>
                        <span>{roleDescriptions[selectedRole]}</span>
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRole === "super_admin" && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Super Admin Warning</span>
                  </div>
                  <p className="text-sm text-red-700">
                    Super Admin users have system-wide access including the ability to manage other admins. 
                    Use this role carefully and only for trusted system administrators.
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Status</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "active")} 
                      defaultValue={field.value ? "active" : "inactive"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Inactive users cannot log in or access the system
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any internal notes about this user..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Internal notes for administrative purposes (not visible to the user)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}