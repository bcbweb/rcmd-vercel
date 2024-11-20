"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

interface UsernameInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  currentUsername?: string;
  className?: string;
}

export default function UsernameInput({
  value,
  onChange,
  currentUsername = '',
  className = '',
}: UsernameInputProps) {
  const [status, setStatus] = useState<'checking' | 'available' | 'taken' | null>(null);
  const supabase = createClient();

  const checkUsername = useCallback(async (username: string) => {
    if (username === currentUsername) {
      setStatus(null);
      onChange(username, true);
      return;
    }

    if (!username || username.length < 3) {
      setStatus(null);
      onChange(username, false);
      return;
    }

    setStatus('checking');

    try {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username);

      if (data && data.length > 0) {
        setStatus('taken');
        onChange(username, false);
      } else {
        setStatus('available');
        onChange(username, true);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setStatus('taken');
      onChange(username, false);
    }
  }, [currentUsername, onChange, supabase]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkUsername(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value, checkUsername]);

  return (
    <div className="space-y-1">
      <label
        htmlFor="username"
        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        Username
      </label>
      <div className="relative">
        <input
          id="username"
          type="text"
          value={value}
          onChange={(e) => {
            const newValue = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
            onChange(newValue, false);
            setStatus(null);
          }}
          className={`
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
            bg-white dark:bg-gray-700
            text-gray-900 dark:text-gray-100 
            ${status === 'checking' ? 'pr-10 border-gray-300 dark:border-gray-600' : ''}
            ${status === 'available' ? 'border-green-500 dark:border-green-400 focus:ring-green-500 dark:focus:ring-green-400' : ''}
            ${status === 'taken' ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400' : ''}
            ${status === null ? 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400' : ''}
            ${className}
          `}
          placeholder="Choose a username"
        />
        {status === 'checking' && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Status Messages */}
      <div className="min-h-[20px]"> {/* Fixed height container for status messages */}
        {value !== currentUsername && status === 'taken' && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Username is already taken
          </p>
        )}
        {value !== currentUsername && status === 'available' && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Username is available
          </p>
        )}
      </div>
    </div>
  );
}