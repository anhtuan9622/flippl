import React, { useEffect, useState } from "react";
import { X, Mail, Save } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import Button from "../ui/Button";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

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
              <Button
                variant="default"
                icon={X}
                size="sm"
                disabled={isSubmitting}
                onClick={() => onClose()}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Current Email
                </label>
                <div className="neo-input w-full bg-gray-100 px-3 py-2">
                  {currentEmail}
                </div>
              </div>

              <div>
                <label
                  htmlFor="newEmail"
                  className="block text-sm font-black text-black mb-2"
                >
                  New Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="neo-input w-full pl-10"
                    placeholder="Enter new email address"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="default"
                  disabled={isSubmitting}
                  onClick={() => onClose()}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={Save}
                  type="submit"
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