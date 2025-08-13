"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  UserPlus, 
  Mail, 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  AlertCircle,
  Crown
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const InviteUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.enum(["admin", "reviewer", "beneficiary", "guardian"], {
    required_error: "Please select a role",
  }),
  message: z.string().optional(),
});

type InviteUserFormData = z.infer<typeof InviteUserSchema>;

interface InviteUserDialogProps {
  onInviteSent?: () => void;
}

export function InviteUserDialog({ onInviteSent }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useCurrentUser();

  const form = useForm<InviteUserFormData>({
    resolver: zodResolver(InviteUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: undefined,
      message: "",
    },
  });

  // For now, we'll use a simple email invitation (in production, integrate with email service)
  const sendInvitation = useMutation(api.users.createInvitation);

  const roleDescriptions = {
    admin: "Full access to foundation settings, user management, and all features",
    reviewer: "Can review applications, manage beneficiaries, and view reports",
    beneficiary: "Student access to their own profile, documents, and progress",
    guardian: "Parent/guardian access to their child's information and communication"
  };

  const roleIcons = {
    admin: <ShieldCheck className="w-4 h-4 text-red-600" />,
    reviewer: <Shield className="w-4 h-4 text-blue-600" />,
    beneficiary: <UserCheck className="w-4 h-4 text-green-600" />,
    guardian: <Users className="w-4 h-4 text-orange-600" />
  };

  const onSubmit = async (data: InviteUserFormData) => {
    if (!user?.foundationId) {
      toast.error("No foundation found");
      return;
    }

    setIsLoading(true);
    try {
      await sendInvitation({
        foundationId: user.foundationId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        invitedBy: user._id,
        message: data.message,
      });

      toast.success(`Invitation sent to ${data.email}`);
      form.reset();
      setOpen(false);
      onInviteSent?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = form.watch("role");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite New Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your foundation team. They'll receive an email with instructions to set up their account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormDescription>
                    They'll receive an invitation at this email address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role for this user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                      <div className="mt-0.5">{roleIcons[selectedRole]}</div>
                      <span>{roleDescriptions[selectedRole]}</span>
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRole === "admin" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Admin Role Warning</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Admin users will have full access to foundation settings, financial data, user management, 
                  and all sensitive information. Only invite trusted team members as admins.
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a personal message to include in the invitation email..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This message will be included in the invitation email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}