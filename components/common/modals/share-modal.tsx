"use client";

import { useState } from 'react';
import { Link2, Check } from "lucide-react";
import Twitter from '@/assets/icons/twitter.svg';
import Facebook from '@/assets/icons/facebook.svg';
import Linkedin from '@/assets/icons/linkedin.svg';
import { toast } from "sonner";

interface Props {
  onClose: () => void;
  handle: string;
}

export default function ShareModal({ onClose, handle }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/${handle}`;

  const shareData = {
    title: `Check out ${handle}'s profile`,
    text: `View ${handle}'s profile`,
    url: shareUrl,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = (platform: string) => {
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    };

    if (platform in urls) {
      window.open(urls[platform as keyof typeof urls], '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Share Profile</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleShare('twitter')}
              className="flex items-center justify-center gap-2 p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Twitter className="w-5 h-5" />
              <span>Twitter</span>
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="flex items-center justify-center gap-2 p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Facebook className="w-5 h-5" />
              <span>Facebook</span>
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="flex items-center justify-center gap-2 p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Linkedin className="w-5 h-5" />
              <span>LinkedIn</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              onClick={handleCopyLink}
              className="p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Link2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}