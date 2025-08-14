"use client";

import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Ban } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  userName: string;
  userEmail: string;
}

export function BlockUserDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  userName, 
  userEmail 
}: BlockUserDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const canSubmit = reason.trim() && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      onOpenChange(false);
      setReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Ban className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">Block User Account</DialogTitle>
              <DialogDescription>
                Prevent this user from signing in
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <Ban className="h-4 w-4" />
            <AlertDescription>
              You are about to block the account for:
              <br />
              <strong>{userName}</strong> ({userEmail})
              <br />
              This will prevent them from signing in but preserve their data.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for blocking *</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for blocking this user account..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={!canSubmit}
            >
              {isSubmitting ? "Blocking..." : "Block User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}