import { useState, useEffect } from 'react';
import debounce from 'lodash/debounce';
import { createClient } from '@/utils/supabase/client';

interface URLHandleInputProps {
  value: string;
  onChange: (value: string) => void;
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

  // Explicitly type the debounced function
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
  }, [value, debouncedCheckHandle]);

  useEffect(() => {
    if (onAvailabilityChange) {
      onAvailabilityChange({
        isAvailable: isHandleAvailable,
        isChecking: isCheckingHandle
      });
    }
  }, [isHandleAvailable, isCheckingHandle, onAvailabilityChange]);

  return (
    <div>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
          {domain}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const handle = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (handle.length <= maxLength) {
              onChange(handle);
            }
          }}
          className={`pl-24 block w-full rounded-md border-gray-300 shadow-sm 
            focus:border-blue-500 focus:ring-blue-500 sm:text-sm 
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} 
            ${className}`}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
        />
      </div>
      {isCheckingHandle ? (
        <p className="mt-1 text-sm text-gray-500">Checking availability...</p>
      ) : value && (
        <>
          <p className={`mt-1 text-sm ${isHandleAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {isHandleAvailable ? 'Handle is available' : 'Handle is not available'}
          </p>
          {value.length < minLength && (
            <p className="mt-1 text-sm text-red-600">
              Handle must be at least {minLength} characters
            </p>
          )}
        </>
      )}
    </div>
  );
}