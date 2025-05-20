"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { storeManualSocialAccount } from "@/utils/social-auth";
import { Loader2 } from "lucide-react";

interface TikTokUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TikTokUsernameModal({
  isOpen,
  onClose,
  onSuccess,
}: TikTokUsernameModalProps) {
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the modal to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username) {
      setError("Please enter your TikTok username");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Remove @ symbol if user included it
      const cleanUsername = username.startsWith("@")
        ? username.substring(1)
        : username;

      // Store the manual TikTok account connection
      const success = await storeManualSocialAccount("tiktok", cleanUsername);

      if (success) {
        onSuccess();
        onClose();
      } else {
        setError("Failed to connect TikTok account. Please try again.");
      }
    } catch (err) {
      console.error("Error connecting TikTok:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md"
      >
        <div className="text-center mb-5">
          <div className="inline-flex justify-center items-center mb-4">
            <Image
              src="/icons/tiktok.svg"
              alt="TikTok"
              width={48}
              height={48}
              className="rounded-md"
            />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Connect TikTok
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Enter your TikTok username to connect your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="tiktok-username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400">
                @
              </span>
              <input
                type="text"
                id="tiktok-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:pointer-events-none inline-flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
