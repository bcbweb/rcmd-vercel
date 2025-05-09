"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

export default function AccountManagementPage() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [localLoading, setLocalLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");

  const supabase = createClient();
  const router = useRouter();
  const { userId } = useAuthStore();
  const { clearProfile } = useProfileStore();

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setEmail(user?.email || "");
      } catch (error) {
        console.error("Error fetching user email:", error);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchEmail();
  }, [supabase.auth]);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsChangingPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      setIsDeletingAccount(true);
      if (!userId) {
        toast.error("No authenticated user");
        return;
      }

      // Get auth user ID separately
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Delete profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("auth_user_id", userId);

      if (profileError) throw profileError;

      // Clear auth and profile stores
      clearProfile();
      useAuthStore.getState().setUserId(null);

      // Delete auth user
      if (user) {
        // Note: admin.deleteUser may require server action depending on setup
        const { error: authError } = await supabase.auth.admin.deleteUser(
          user.id
        );
        if (authError) throw authError;
      }

      await supabase.auth.signOut();
      router.push("/sign-in");
      toast.success("Account deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteModal(false);
    }
  }

  // Reset confirmation text when dialog closes
  const handleDialogChange = (open: boolean) => {
    setShowDeleteModal(open);
    if (!open) {
      setConfirmDelete("");
    }
  };

  // Show loading spinner during initial data fetch
  if (localLoading) {
    return (
      <div className="flex justify-center items-center h-full py-10">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Account management
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Make changes to your personal information or account type.
        </p>
      </div>

      {/* Email Section */}
      <div className="border rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Your account
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Email · Private
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="mt-1 block w-full rounded-md bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Password Change Section */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md shadow-sm px-3 py-2"
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md shadow-sm px-3 py-2"
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPassword}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md"
          >
            {isChangingPassword ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Account Type Section */}
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Convert to a business account
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          With a business account you'll have access to tools like ads and
          analytics to grow your presence.
        </p>
        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700">
          Convert account
        </button>
      </div>

      {/* Delete Account Section */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
          Delete Account
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Once you delete your account, there is no going back. Please be
          certain.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-red-600">
              Delete Your Account
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              This will permanently delete your account and all associated data.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="bg-red-100 rounded-full p-1 mr-2 mt-0.5">
                  <span className="block h-1.5 w-1.5 rounded-full bg-red-600"></span>
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  All your personal information will be deleted
                </span>
              </li>
              <li className="flex items-start">
                <span className="bg-red-100 rounded-full p-1 mr-2 mt-0.5">
                  <span className="block h-1.5 w-1.5 rounded-full bg-red-600"></span>
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  All your recommendations, collections, and links will be
                  permanently removed
                </span>
              </li>
              <li className="flex items-start">
                <span className="bg-red-100 rounded-full p-1 mr-2 mt-0.5">
                  <span className="block h-1.5 w-1.5 rounded-full bg-red-600"></span>
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  Your social media connections will be removed
                </span>
              </li>
            </ul>

            <div className="pt-2">
              <label
                htmlFor="confirm-delete"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Type "<span className="font-bold">delete my account</span>" to
                confirm:
              </label>
              <input
                id="confirm-delete"
                type="text"
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm"
                placeholder="delete my account"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md border border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={
                isDeletingAccount || confirmDelete !== "delete my account"
              }
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeletingAccount ? "Deleting..." : "Permanently Delete Account"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
