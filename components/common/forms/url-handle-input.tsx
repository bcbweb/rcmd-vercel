"use client";

import { useState, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";
import { createClient } from "@/utils/supabase/client";

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
  onClear?: () => void; // Add new onClear callback
}

export type HandleStatus = {
  isAvailable: boolean;
  isChecking: boolean;
};

export function URLHandleInput({
  value,
  onChange,
  currentHandle = "", // Default to empty string
  domain = "rcmd.world/",
  className = "",
  placeholder = "your-handle",
  onAvailabilityChange,
  minLength = 3,
  maxLength = 30,
  disabled = false,
  required = false,
  onClear, // Add the onClear parameter
}: URLHandleInputProps) {
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [isHandleAvailable, setIsHandleAvailable] = useState(false);
  const supabase = createClient();

  // Memoize this function to prevent recreating it on every render
  const checkHandleAvailability = useCallback(
    async (handle: string): Promise<void> => {
      // If handle matches currentHandle, consider it available and skip check
      if (handle === currentHandle) {
        setIsHandleAvailable(true);
        return;
      }

      if (!handle) {
        setIsHandleAvailable(false);
        return;
      }

      // Skip check if handle is too short
      if (handle.length < minLength) {
        setIsHandleAvailable(false);
        return;
      }

      setIsCheckingHandle(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("handle")
          .ilike("handle", handle)
          .maybeSingle();

        setIsHandleAvailable(!data);
      } catch (error) {
        console.error("Error checking handle:", error);
        setIsHandleAvailable(false);
      } finally {
        setIsCheckingHandle(false);
      }
    },
    [currentHandle, minLength, supabase]
  );

  // Effect to trigger handle check when value changes
  useEffect(() => {
    if (value === "") {
      setIsHandleAvailable(false);
      return;
    }

    // Skip for handles that match the current handle
    if (value === currentHandle) {
      setIsHandleAvailable(true);
      return;
    }

    // Create a debounced function inside the effect
    const debouncedCheck = debounce(checkHandleAvailability, 300);

    // Call the debounced function
    debouncedCheck(value);

    // Clean up the debounced call when component unmounts or value changes
    return () => {
      debouncedCheck.cancel();
    };
  }, [value, checkHandleAvailability, currentHandle]);

  // Effect to notify parent component of status changes
  useEffect(() => {
    if (onAvailabilityChange) {
      onAvailabilityChange({
        isAvailable: isHandleAvailable,
        isChecking: isCheckingHandle,
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
            paddingRight: "0.5rem",
            backgroundColor: "rgba(0, 0, 0, 0.02)",
          }}
        >
          {domain}
        </span>
        <input
          id="handle"
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const handle = e.target.value
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, "");
            if (handle.length <= maxLength) {
              onChange(handle);
            }
          }}
          className={`
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2
            bg-white dark:bg-gray-700
            text-gray-900 dark:text-gray-100 
            ${isCheckingHandle ? "pr-10 border-gray-300 dark:border-gray-600" : ""}
            ${showValidation && isHandleAvailable ? "border-green-500 dark:border-green-400 focus:ring-green-500 dark:focus:ring-green-400" : ""}
            ${showValidation && !isHandleAvailable ? "border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400" : ""}
            ${!value ? "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400" : ""}
            ${!showValidation ? "border-gray-300 dark:border-gray-600" : ""}
            ${disabled ? "bg-gray-100 dark:bg-gray-600 cursor-not-allowed" : ""}
            ${className}
            ${value ? "pr-10" : ""}
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
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}

        {/* Clear button - only show when there's text and not checking */}
        {value && !isCheckingHandle && onClear && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear input"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
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
              <p
                className={`text-sm ${isHandleAvailable ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {isHandleAvailable
                  ? "Handle is available"
                  : "Handle is not available"}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
