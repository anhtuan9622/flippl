import React, { useState } from 'react';
import { X, Mail, Save } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
}

export default function EmailChangeModal({ isOpen, onClose, currentEmail }: EmailChangeModalProps) {
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.updateUser({ 
        email: newEmail 
      });

      if (error) throw error;

      setNewEmail('');
      onClose();
      // Show toast after modal is closed to ensure it's visible
      setTimeout(() => {
        toast.success("Check your new email for confirmation");
      }, 100);
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update email"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal is closed
  const handleClose = () => {
    setNewEmail('');
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
                <button
                  className="neo-brutalist-gray p-2"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
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
                <label htmlFor="newEmail" className="block text-sm font-black text-black mb-2">
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
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="neo-brutalist-gray px-4 py-2 font-bold"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="neo-brutalist-blue px-4 py-2 font-bold flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}