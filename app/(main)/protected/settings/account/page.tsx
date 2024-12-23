"use client";

import { useState } from "react";
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import router from "next/router";

export default function AccountManagementPage() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const supabase = createClient();

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsChangingPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeletingAccount(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Delete profile first (assuming cascade delete is set up)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('auth_user_id', user.id);

      if (profileError) throw profileError;

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      if (authError) throw authError;

      await supabase.auth.signOut();
      router.push('/sign-in');
      toast.success('Account deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
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
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your account</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Email · Private
              </label>
              <input
                type="email"
                value="user@example.com"
                disabled
                className="mt-1 block w-full rounded-md bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Password
              </label>
              <button
                onClick={() => setIsChangingPassword(true)}
                className="mt-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                Change password
              </button>
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
          With a business account you'll have access to tools like ads and analytics to grow your presence.
        </p>
        <button
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          Convert account
        </button>
      </div>

      {/* Delete Account Section */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
          Delete Account
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={isDeletingAccount}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md"
        >
          {isDeletingAccount ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}