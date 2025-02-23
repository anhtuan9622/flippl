import React, { useState, useEffect } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ShareButtonProps {
  yearToDateStats: {
    profit: number;
    trades: number;
    tradingDays: number;
    winRate: number;
  };
}

export default function ShareButton({ yearToDateStats }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const fetchOrCreateShareId = async () => {
    if (!isOpen || hasInitialized) return;
    
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('share_id')
        .eq('id', session.user.id)
        .single();

      if (fetchError) throw fetchError;

      let finalShareId: string;

      if (profile?.share_id) {
        finalShareId = profile.share_id;
      } else {
        finalShareId = Math.random().toString(36).substring(2, 15);
        
        // Update profile with new share_id
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ share_id: finalShareId })
          .eq('id', session.user.id);

        if (updateError) throw updateError;
      }

      setShareUrl(`${window.location.origin}/share/${finalShareId}`);
      setHasInitialized(true);
    } catch (error) {
      console.error('Error fetching/creating share URL:', error);
      toast.error('Failed to generate share link. Try again');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !hasInitialized) {
      fetchOrCreateShareId();
    }
  }, [isOpen, hasInitialized]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast.success('Share link copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy to clipboard. Try again');
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className="neo-brutalist-blue px-4 py-2 font-bold flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
          <div className="neo-brutalist-white p-6">
            <Dialog.Title className="text-2xl font-black text-black mb-4">
              Share Link
            </Dialog.Title>

            <div className="space-y-4">
              <p className="text-gray-600">
                Share your all-time trading summary with others. The link will automatically show your latest data.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={isLoading ? 'Generating share link...' : shareUrl}
                  readOnly
                  className="neo-input flex-1"
                  placeholder={isLoading ? 'Generating share link...' : 'Share link will appear here'}
                />
                <button
                  onClick={copyToClipboard}
                  className="neo-brutalist-blue p-2"
                  disabled={isLoading || !shareUrl}
                >
                  {isCopied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="flex justify-end mt-6">
                <Dialog.Close asChild>
                  <button className="neo-brutalist-gray px-4 py-2 font-bold">
                    Close
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}