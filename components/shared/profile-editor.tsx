"use client";

import { URLHandleInput } from '@/components/url-handle-input';
import countries from '@/data/countries.json';

interface ProfileEditorProps {
  handle: string;
  location: string;
  currentHandle: string;
  isLoading: boolean;
  isHandleValid: boolean;
  onHandleChange: (handle: string) => void;
  onLocationChange: (location: string) => void;
  onHandleValidityChange: (status: { isAvailable: boolean; }) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function ProfileEditor({
  handle,
  location,
  currentHandle,
  isLoading,
  isHandleValid,
  onHandleChange,
  onLocationChange,
  onHandleValidityChange,
  onSubmit
}: ProfileEditorProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            URL Handle
          </label>
          <URLHandleInput
            value={handle}
            onChange={onHandleChange}
            currentHandle={currentHandle}
            onAvailabilityChange={onHandleValidityChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Location
          </label>
          <select
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
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
      </div>

      <button
        type="submit"
        disabled={isLoading || !isHandleValid}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md"
      >
        {isLoading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}