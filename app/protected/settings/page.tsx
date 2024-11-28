"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@/utils/supabase/client';
import { toast } from "sonner";
import { URLHandleInput } from '@/components/url-handle-input';
import countries from '@/data/countries.json';

interface SettingsFormData {
  handle: string;
  location: string;
  email: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const supabase = createClient();

  const [formData, setFormData] = useState<SettingsFormData>({
    handle: '',
    location: '',
    email: '',
  });

  const [originalData, setOriginalData] = useState<SettingsFormData>({
    handle: '',
    location: '',
    email: '',
  });

  const [isHandleValid, setIsHandleValid] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/sign-in');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('handle, location')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;

      const userData = {
        handle: profile?.handle || '',
        location: profile?.location || '',
        email: user.email || '',
      };

      setFormData(userData);
      setOriginalData(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          handle: formData.handle,
          location: formData.location,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id);

      if (profileError) throw profileError;

      // Update email if changed
      if (formData.email !== originalData.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });
        if (emailError) throw emailError;
        toast.success('Verification email sent to new address');
      }

      toast.success('Settings updated successfully');
      setOriginalData(formData);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  }

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

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Account Settings
      </h1>

      <div className="space-y-8">
        {/* Profile Settings */}
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                URL Handle
              </label>
              <URLHandleInput
                value={formData.handle}
                onChange={(handle) => setFormData(prev => ({ ...prev, handle }))}
                currentHandle={originalData.handle}
                onAvailabilityChange={(status) => setIsHandleValid(status.isAvailable)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Location
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="mt-1 block w-full rounded-md shadow-sm px-3 py-2"
              >
                <option value="">Select a country</option>
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full rounded-md shadow-sm px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isHandleValid}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>

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
    </div>
  );
}