"use client";

import { useState, useEffect } from 'react';
import debounce from 'lodash/debounce';
import { createClient } from '@/utils/supabase/client';

interface URLHandleInputProps {
  value: string;
  onChange: (value: string) => void;
  currentHandle?: string; // Added currentHandle prop
  domain?: string;
  className?: string;
  placeholder?: string;
  onAvailabilityChange?: (status: HandleStatus) => void;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
}

export type HandleStatus = {
  isAvailable: boolean;
  isChecking: boolean;
};

export function URLHandleInput({
  value,
  onChange,
  currentHandle = '', // Default to empty string
  domain = 'rcmd.world/',
  className = '',
  placeholder = 'your-handle',
  onAvailabilityChange,
  minLength = 3,
  maxLength = 30,
  disabled = false,
  required = false,
}: URLHandleInputProps) {
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [isHandleAvailable, setIsHandleAvailable] = useState(false);
  const supabase = createClient();

  const checkHandleAvailability = async (handle: string): Promise<void> => {
    // If handle matches currentHandle, consider it available and skip check
    if (handle === currentHandle) {
      setIsHandleAvailable(true);
      return;
    }

    if (!handle) {
      setIsHandleAvailable(false);
      return;
    }

    setIsCheckingHandle(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('handle')
        .ilike('handle', handle)
        .maybeSingle();

      setIsHandleAvailable(!data);
    } catch (error) {
      console.error('Error checking handle:', error);
      setIsHandleAvailable(false);
    } finally {
      setIsCheckingHandle(false);
    }
  };

  const debouncedCheckHandle = debounce((handle: string) => {
    checkHandleAvailability(handle);
  }, 300);

  useEffect(() => {
    if (value) {
      debouncedCheckHandle(value);
    }
    return () => {
      debouncedCheckHandle.cancel();
    };
  }, [value]);

  useEffect(() => {
    if (onAvailabilityChange) {
      onAvailabilityChange({
        isAvailable: isHandleAvailable,
        isChecking: isCheckingHandle
      });
    }
  }, [isHandleAvailable, isCheckingHandle, onAvailabilityChange]);

  // Calculate padding based on domain length
  const domainWidth = `${domain.length * 0.65}rem`;

  // Determine if we should show validation styles and messages
  const showValidation = value && value !== currentHandle;

  return (
    <div className="space-y-1">
      <div className="relative">
        <span
          className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-500 dark:text-gray-400"
          style={{
            paddingRight: '0.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.02)'
          }}
        >
          {domain}
        </span>
        <input
          id="handle"
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const handle = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (handle.length <= maxLength) {
              onChange(handle);
            }
          }}
          className={`
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
            bg-white dark:bg-gray-700
            text-gray-900 dark:text-gray-100 
            ${isCheckingHandle ? 'pr-10 border-gray-300 dark:border-gray-600' : ''}
            ${showValidation && isHandleAvailable ? 'border-green-500 dark:border-green-400 focus:ring-green-500 dark:focus:ring-green-400' : ''}
            ${showValidation && !isHandleAvailable ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400' : ''}
            ${!value ? 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400' : ''}
            ${!showValidation ? 'border-gray-300 dark:border-gray-600' : ''}
            ${disabled ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}
            ${className}
          `}
          style={{ paddingLeft: domainWidth }}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
        />
        {isCheckingHandle && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Status Messages */}
      <div className="min-h-[20px]">
        {value && !isCheckingHandle && showValidation && (
          <>
            {value.length < minLength ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                Handle must be at least {minLength} characters
              </p>
            ) : (
              <p className={`text-sm ${isHandleAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isHandleAvailable ? 'Handle is available' : 'Handle is not available'}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}