import React, { useEffect, useState } from "react";
import { X, Mail, Save } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
}

export default function EmailChangeModal({
  isOpen,
  onClose,
  currentEmail,
}: EmailChangeModalProps) {
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (currentEmail === newEmail) {
      toast.error("New email should be different from current email");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      toast.error(error.message || "Failed to update email");
      setIsSubmitting(false);
      return;
    }
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "USER_UPDATED") {
          handleClose();
          setTimeout(
            () => toast.success("Check your new email for confirmation"),
            100
          );
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Reset form and close modal
  const handleClose = () => {
    setNewEmail("");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
          <div className="neo-brutalist-white p-6">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-2xl font-black text-black">
                Change Email
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button
                  variant="default"
                  icon={X}
                  onClick={handleClose}
                  disabled={isSubmitting}
                />
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="email"
                  value={currentEmail}
                  label="Current Email"
                  disabled
                  icon={Mail}
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  label="New Email"
                  placeholder="Enter new email address"
                  required
                  disabled={isSubmitting}
                  icon={Mail}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Dialog.Close asChild>
                  <Button
                    variant="default"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  variant="primary"
                  icon={Save}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
