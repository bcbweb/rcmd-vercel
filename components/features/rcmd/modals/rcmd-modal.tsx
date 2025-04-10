"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { uploadContentImage } from "@/utils/storage";
import Image from "next/image";
import { useModalStore } from "@/stores/modal-store";
import { useRCMDStore } from "@/stores/rcmd-store";
import { TagInput } from "@/components/common/forms";
import LinkInput from "@/components/ui/link-input";
import { Spinner } from "@/components/ui/spinner";
import Script from "next/script";
import { RCMDType, RCMDVisibility } from "@/types";
import { toast } from "sonner";
import { imageLoader } from "@/utils/image";

// Fix TypeScript declarations for Google Maps
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            inputField: HTMLInputElement,
            options?: {
              types?: string[];
              componentRestrictions?: { country: string | string[] };
              fields?: string[];
            }
          ) => GoogleMapsAutocomplete;
        };
        event: {
          clearInstanceListeners: (instance: GoogleMapsAutocomplete) => void;
        };
      };
    };
  }
}

// Define a type for the Google Maps Autocomplete
type GoogleMapsAutocomplete = {
  addListener: (event: string, callback: () => void) => void;
  getPlace: () => {
    place_id?: string;
    name?: string;
    formatted_address?: string;
    geometry?: {
      location: {
        lat(): number;
        lng(): number;
      };
    };
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  };
};

export default function RCMDModal() {
  const {
    isRCMDModalOpen,
    setIsRCMDModalOpen,
    onModalSuccess,
    isRCMDEditMode,
    rcmdToEdit,
  } = useModalStore();

  const { insertRCMD, updateRCMD, isLoading: isSavingRCMD } = useRCMDStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("other");
  const [visibility, setVisibility] = useState("private");
  const [isSaving, setIsSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataImageUrl, setMetadataImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    place_id: string;
    description: string;
    lat?: number;
    lng?: number;
  } | null>(null);
  const [locationInput, setLocationInput] = useState("");
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Refs
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Define resetForm function
  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setType("other");
    setVisibility("private");
    setFile(null);
    setUploadError(null);
    setTags([]);
    setUrl("");
    setLocation(null);
    setLocationInput("");
    setMetadataImageUrl(null);
    setMetadataError(null);
  }, []);

  // Define handleClose function
  const handleClose = useCallback(() => {
    resetForm();
    setIsRCMDModalOpen(false);
  }, [resetForm, setIsRCMDModalOpen]);

  // Populate form with existing RCMD data when in edit mode
  useEffect(() => {
    // Reset form when modal opens
    if (!isRCMDModalOpen) return;

    // If in edit mode and we have data, populate the form
    if (isRCMDEditMode && rcmdToEdit) {
      setTitle(rcmdToEdit.title || "");
      setDescription(rcmdToEdit.description || "");
      setType(rcmdToEdit.type || "other");
      setVisibility(rcmdToEdit.visibility || "private");
      setTags(rcmdToEdit.tags || []);
      setUrl(rcmdToEdit.url || "");

      // Handle location data
      if (rcmdToEdit.location) {
        let locationData;
        if (typeof rcmdToEdit.location === "string") {
          try {
            locationData = JSON.parse(rcmdToEdit.location);
          } catch {
            locationData = { address: rcmdToEdit.location };
          }
        } else {
          locationData = rcmdToEdit.location;
        }

        if (locationData.address) {
          setLocationInput(locationData.address);
          setLocation({
            place_id: locationData.placeId || "",
            description: locationData.address,
            lat: locationData.coordinates?.lat,
            lng: locationData.coordinates?.lng,
          });
        }
      }

      // Handle image
      if (rcmdToEdit.featured_image) {
        setMetadataImageUrl(rcmdToEdit.featured_image);
      }
    } else {
      // Reset all form fields for new RCMD
      resetForm();
    }
  }, [isRCMDModalOpen, isRCMDEditMode, rcmdToEdit, resetForm]);

  // Add effect to prevent background scrolling when modal is open
  useEffect(() => {
    if (isRCMDModalOpen) {
      // Save the current overflow value to restore later
      const originalOverflow = document.body.style.overflow;
      // Prevent background scrolling
      document.body.style.overflow = "hidden";

      // Cleanup function to restore scrolling when modal closes
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isRCMDModalOpen]);

  // Initialize Google Maps Autocomplete with better error handling
  useEffect(() => {
    if (
      !isRCMDModalOpen ||
      !locationInputRef.current ||
      !window.google?.maps?.places ||
      !mapsLoaded
    ) {
      return;
    }

    let autocompleteInstance: GoogleMapsAutocomplete | null = null;

    try {
      // Create the autocomplete object with more specific fields
      const autocomplete = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          types: ["establishment", "geocode"],
          fields: [
            "place_id",
            "formatted_address",
            "geometry",
            "name",
            "address_components",
          ],
        }
      );

      autocompleteInstance = autocomplete;
      autocompleteRef.current = autocomplete;

      // Add place_changed event listener with better error handling
      const placeChangedListener = () => {
        try {
          const place = autocomplete.getPlace();

          // More comprehensive checks for place data
          if (!place) {
            console.warn("No place data received from Google Maps");
            return;
          }

          // Check if we have a valid place selection (not just user input)
          if (!place.place_id) {
            console.warn("Invalid place selection - no place_id");
            return;
          }

          // Get coordinates if available
          const lat = place.geometry?.location?.lat?.();
          const lng = place.geometry?.location?.lng?.();

          // Get the most specific address possible
          const description =
            place.formatted_address || place.name || locationInput;

          // Update both states in a single batch to prevent race conditions
          setLocation({
            place_id: place.place_id,
            description,
            ...(lat !== undefined && { lat }),
            ...(lng !== undefined && { lng }),
          });
          setLocationInput(description);
        } catch (error) {
          console.error("Error handling place change:", error);
          // Clear location data on error
          setLocation(null);
        }
      };

      autocomplete.addListener("place_changed", placeChangedListener);

      // Clean up on unmount
      return () => {
        if (autocompleteInstance && window.google?.maps?.event) {
          try {
            window.google.maps.event.clearInstanceListeners(
              autocompleteInstance
            );
          } catch (error) {
            console.error("Error cleaning up Google Maps listeners:", error);
          }
        }
      };
    } catch (error) {
      console.error("Error initializing Google Maps Autocomplete:", error);
      // Show error state to user
      setLocation(null);
    }
  }, [isRCMDModalOpen, mapsLoaded, locationInput]);

  const handleLinkMetadata = (metadata: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
  }) => {
    console.log("RCMD Modal received metadata:", metadata); // Debug log
    try {
      setIsLoadingMetadata(true);
      setMetadataError(null);

      // Check if the received metadata contains actual website data
      // or just fallbacks based on domain name
      const urlString = metadata.url || "";
      const domain = urlString.split("//")[1]?.split("/")[0] || "";

      // Enhanced check for fallback metadata
      const isLikelyFallback =
        // Check if title is just the domain
        (metadata.title === domain || metadata.title?.includes(domain)) &&
        // Check if description is the generic content message
        metadata.description === `Content from ${domain}` &&
        // Check if the domain looks incomplete (no real TLD or very short)
        (domain.length < 6 || // Very short domain names are suspicious
          !/\.(com|org|net|edu|gov|io|co|world|app|dev|me|info|biz)$/i.test(
            domain
          ) || // No common TLD
          /\.w{1,2}$/i.test(domain)); // Incomplete TLD like .w or .wo

      if (isLikelyFallback) {
        console.warn(
          "Received what appears to be fallback metadata or incomplete URL:",
          metadata
        );
        setMetadataError(
          "Could not retrieve website information. Please enter a complete URL."
        );
        return; // Don't proceed with setting metadata from fallbacks
      } else {
        console.log("Received valid metadata from website:", metadata);

        // Only set title and description if they're not already set by user
        // or if we're not in edit mode
        if (!isRCMDEditMode) {
          if ((!title || title.trim() === "") && metadata.title) {
            console.log(`Setting title to: "${metadata.title}"`);
            setTitle(metadata.title);
          }

          if (
            (!description || description.trim() === "") &&
            metadata.description
          ) {
            console.log(
              `Setting description to: "${metadata.description?.substring(0, 30)}..."`
            );
            setDescription(metadata.description);
          }

          // Detect content type if possible
          if (metadata.type) {
            const detectedType = metadata.type.toLowerCase();
            if (
              ["article", "video", "podcast", "product"].includes(detectedType)
            ) {
              setType(detectedType);
            }
          }
        }
      }

      // Only stage a new image if:
      // 1. The URL has changed (not just a metadata refresh)
      // 2. We have a valid image URL
      // 3. We're not in edit mode OR no image is currently set
      if (
        metadata.image &&
        metadata.image.startsWith("http") &&
        metadata.url !== rcmdToEdit?.url &&
        (!isRCMDEditMode || (!file && !metadataImageUrl))
      ) {
        console.log("Found new image URL in metadata:", metadata.image);
        setMetadataImageUrl(metadata.image);
      }

      // Log why we're not using an image
      if (!metadata.image)
        console.log("Not using metadata image: No image URL in metadata");
      if (metadata.image && !metadata.image.startsWith("http"))
        console.log(
          "Not using metadata image: Invalid image URL format:",
          metadata.image
        );
    } catch (error) {
      console.error("Error processing metadata:", error);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setUploadError("Please select an image file");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setUploadError("Image must be less than 5MB");
        return;
      }
      try {
        setFile(selectedFile);
        // Clear metadata image URL if it was previously set
        setMetadataImageUrl(null);
        setUploadError(null);
      } catch {
        setUploadError("Failed to load image");
      }
    }
  };

  // Add handler to clear image
  const handleImageClear = () => {
    setFile(null);
    setMetadataImageUrl(null);
    setUploadError(null);
  };

  // Form validation
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
  }>({});

  // Add URL validation and normalization function
  const normalizeUrl = (url: string): string => {
    if (!url) return "";

    // Trim whitespace
    let normalizedUrl = url.trim();

    // Add https:// if missing
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Try to create a URL object to validate it
    try {
      const urlObj = new URL(normalizedUrl);
      return urlObj.toString();
    } catch (error) {
      console.error("Invalid URL format:", error);
      return normalizedUrl; // Return the normalized URL even if invalid
    }
  };

  // Update handleSubmit to use validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Normalize URL if present
      const normalizedUrl = url ? normalizeUrl(url) : undefined;

      // Handle image upload or metadata image
      let featuredImage: string | undefined = undefined;
      if (file) {
        // If we have a file upload, use that
        featuredImage = await uploadContentImage(file, "rcmds");
      } else if (metadataImageUrl) {
        // If we have a metadata image URL, use that directly
        featuredImage = metadataImageUrl;
      } else if (isRCMDEditMode && rcmdToEdit?.featured_image) {
        // Keep existing image in edit mode
        featuredImage = rcmdToEdit.featured_image;
      }

      // Prepare the RCMD data
      const rcmdData = {
        title,
        description,
        type: type as RCMDType,
        visibility: visibility as RCMDVisibility,
        featured_image: featuredImage,
        url: normalizedUrl,
        location: location
          ? {
              placeId: location.place_id,
              address: location.description,
              coordinates: {
                lat: location.lat,
                lng: location.lng,
              },
            }
          : undefined,
        tags,
      };

      if (isRCMDEditMode && rcmdToEdit) {
        // Update existing RCMD
        await updateRCMD(rcmdToEdit.id, rcmdData);
        toast.success("RCMD updated successfully!");
      } else {
        // Create new RCMD
        const result = await insertRCMD(
          title,
          description,
          type,
          visibility,
          featuredImage,
          tags,
          normalizedUrl,
          location
            ? {
                placeId: location.place_id,
                address: location.description,
                coordinates: {
                  lat: location.lat,
                  lng: location.lng,
                },
              }
            : undefined
        );
        if (result) {
          toast.success("RCMD created successfully!");
        }
      }

      // Reset form and close modal
      resetForm();
      setIsRCMDModalOpen(false);
      if (onModalSuccess) onModalSuccess();
    } catch (error) {
      console.error("Error submitting RCMD:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while saving the RCMD";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Add a function to handle URL clearing
  const handleUrlClear = () => {
    console.log("RCMD Modal: URL clear requested");
    // First set URL to empty to prevent further fetch attempts
    setUrl("");
    setMetadataError(null);

    // Always clear file and metadata image URL when URL is cleared
    setFile(null);
    setMetadataImageUrl(null);

    // Only clear these if they were likely set from metadata
    // and if we don't have any user-entered content
    if (title && description && !tags.length) {
      setTitle("");
      setDescription("");
    }

    console.log("RCMD Modal: URL clear completed");
  };

  // Load Google Maps API script with better error handling
  const handleGoogleMapsLoad = () => {
    try {
      if (!window.google?.maps?.places) {
        throw new Error("Google Maps Places API not loaded correctly");
      }
      console.log("Google Maps API loaded successfully");
      setMapsLoaded(true);
    } catch (error) {
      console.error("Error loading Google Maps API:", error);
      // Show error state to user
      setMapsLoaded(false);
    }
  };

  // Simplified location input change handler with better error handling
  const handleLocationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setLocationInput(value);

    // Only clear location data if input is cleared
    if (!value.trim()) {
      setLocation(null);
    }
  };

  // Clear location data and input
  const handleLocationClear = () => {
    setLocationInput("");
    setLocation(null);
    if (locationInputRef.current) {
      locationInputRef.current.focus();
    }
  };

  // Handle click outside location suggestions
  useEffect(() => {
    const handleClickOutside = () => {
      // setShowLocationSuggestions(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Add keyboard event handling for the modal
  useEffect(() => {
    if (!isRCMDModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on ESC key
      if (e.key === "Escape") {
        handleClose();
      }
    };

    // Focus the URL input when modal opens
    if (urlInputRef.current) {
      // Use requestAnimationFrame to sync with browser rendering
      const focusInput = () => {
        requestAnimationFrame(() => {
          urlInputRef.current?.focus();
        });
      };

      // Wait for modal to be fully rendered
      setTimeout(focusInput, 150);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRCMDModalOpen, handleClose]);

  if (!isRCMDModalOpen) return null;

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&libraries=places&v=quarterly`}
        onLoad={handleGoogleMapsLoad}
        onError={(e) => {
          console.error("Error loading Google Maps API:", e);
          setMapsLoaded(false);
        }}
        strategy="lazyOnload"
      />
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-heading"
        onClick={handleClose}
      >
        <div
          ref={modalRef}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            id="modal-heading"
            className="text-lg font-semibold p-6 pb-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] z-10"
          >
            {isRCMDEditMode ? "Edit RCMD" : "New RCMD"}
          </h2>

          <form
            onSubmit={handleFormSubmit}
            aria-label="Create new recommendation"
            noValidate
            className="flex flex-col h-full"
          >
            <div
              className="overflow-y-auto px-6 flex-grow"
              style={{ maxHeight: "calc(90vh - 150px)" }}
              role="group"
              aria-labelledby="rcmd-form-heading"
            >
              <h3 id="rcmd-form-heading" className="sr-only">
                Recommendation details
              </h3>

              <div className="space-y-4 pb-6 pt-2">
                <div>
                  <label
                    htmlFor="rcmd-url"
                    className="block text-sm font-medium mb-1"
                  >
                    URL
                  </label>
                  <div id="rcmd-url">
                    <LinkInput
                      value={url}
                      onChange={setUrl}
                      onMetadataFetch={handleLinkMetadata}
                      onClear={handleUrlClear}
                      disabled={isSaving}
                      ref={urlInputRef}
                    />
                  </div>
                  {isLoadingMetadata && (
                    <div className="mt-1 text-sm text-blue-500 flex items-center">
                      <Spinner className="h-3 w-3 mr-2" />
                      Loading metadata...
                    </div>
                  )}
                  {metadataError && (
                    <div className="mt-1 text-sm text-red-500">
                      {metadataError}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="rcmd-title"
                    className="block text-sm font-medium mb-1"
                  >
                    Title
                    {formErrors.title && (
                      <span className="text-red-500 ml-1" aria-hidden="true">
                        *
                      </span>
                    )}
                  </label>
                  <input
                    id="rcmd-title"
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (e.target.value.trim()) {
                        setFormErrors((prev) => ({
                          ...prev,
                          title: undefined,
                        }));
                      }
                    }}
                    className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                      formErrors.title ? "border-red-500" : ""
                    }`}
                    required
                    aria-required="true"
                    aria-invalid={!!formErrors.title}
                    aria-describedby={
                      formErrors.title ? "title-error" : undefined
                    }
                    ref={initialFocusRef}
                  />
                  {formErrors.title && (
                    <div id="title-error" className="text-red-500 text-sm mt-1">
                      {formErrors.title}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="rcmd-description"
                    className="block text-sm font-medium mb-1"
                  >
                    Description
                    {formErrors.description && (
                      <span className="text-red-500 ml-1" aria-hidden="true">
                        *
                      </span>
                    )}
                  </label>
                  <textarea
                    id="rcmd-description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (e.target.value.trim()) {
                        setFormErrors((prev) => ({
                          ...prev,
                          description: undefined,
                        }));
                      }
                    }}
                    className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                      formErrors.description ? "border-red-500" : ""
                    }`}
                    rows={4}
                    required
                    aria-required="true"
                    aria-invalid={!!formErrors.description}
                    aria-describedby={
                      formErrors.description ? "description-error" : undefined
                    }
                  />
                  {formErrors.description && (
                    <div
                      id="description-error"
                      className="text-red-500 text-sm mt-1"
                    >
                      {formErrors.description}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="rcmd-type"
                    className="block text-sm font-medium mb-1"
                  >
                    Type
                  </label>
                  <select
                    id="rcmd-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    aria-required="true"
                  >
                    <option value="other">Other</option>
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                    <option value="place">Place</option>
                    <option value="experience">Experience</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="rcmd-visibility"
                    className="block text-sm font-medium mb-1"
                  >
                    Visibility
                  </label>
                  <select
                    id="rcmd-visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    aria-required="true"
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tags</label>
                  <TagInput
                    tags={tags}
                    onChange={setTags}
                    placeholder="Type a tag and press Enter"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Press Enter or comma to add a tag
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={handleLocationInputChange}
                      placeholder="Search for a location..."
                      className={`w-full p-2 pl-10 border rounded-md dark:bg-gray-700 dark:border-gray-600 ${
                        !mapsLoaded ? "bg-gray-100 dark:bg-gray-600" : ""
                      }`}
                      ref={locationInputRef}
                      aria-label="Location search"
                      autoComplete="off"
                      disabled={!mapsLoaded}
                    />
                    {!mapsLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-600/50 rounded-md">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Loading location search...
                        </span>
                      </div>
                    )}

                    {/* Location Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>

                    {/* Clear Button */}
                    {locationInput && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLocationClear();
                        }}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Clear location"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="h-4 w-4"
                          aria-hidden="true"
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

                  {/* Selected Location Preview */}
                  {location && (
                    <div className="mt-2 text-sm text-gray-500">
                      Selected: {location.description}
                      {location.lat && location.lng && (
                        <div className="text-xs text-gray-400">
                          Coordinates: {location.lat.toFixed(5)},{" "}
                          {location.lng.toFixed(5)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Featured Image
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="featured-image-input"
                    />
                    <label
                      htmlFor="featured-image-input"
                      className="cursor-pointer py-2 px-4 text-sm font-semibold rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-gray-700 dark:text-gray-200"
                    >
                      {file || metadataImageUrl ? "Replace" : "Choose file"}
                    </label>
                    {(file && file instanceof Blob) ||
                      metadataImageUrl ||
                      (rcmdToEdit?.featured_image && (
                        <button
                          type="button"
                          onClick={handleImageClear}
                          className="py-2 px-4 text-sm font-semibold rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          Remove
                        </button>
                      ))}
                    {file && !metadataImageUrl && (
                      <span className="text-sm text-gray-500">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                    {metadataImageUrl && (
                      <span className="text-sm text-blue-500">
                        Image from website metadata
                      </span>
                    )}
                    {isLoadingMetadata && (
                      <span className="text-sm text-blue-500 flex items-center">
                        <Spinner className="h-4 w-4 mr-2" />
                        Loading metadata...
                      </span>
                    )}
                  </div>
                  {((file && file instanceof Blob) ||
                    metadataImageUrl ||
                    rcmdToEdit?.featured_image) && (
                    <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
                      <Image
                        src={
                          file instanceof Blob
                            ? URL.createObjectURL(file)
                            : metadataImageUrl ||
                              rcmdToEdit?.featured_image ||
                              ""
                        }
                        alt="Preview"
                        fill
                        className="object-cover"
                        loader={imageLoader}
                        unoptimized={Boolean(
                          metadataImageUrl || rcmdToEdit?.featured_image
                        )}
                      />
                    </div>
                  )}
                  {uploadError && (
                    <div className="text-red-500 text-sm mt-1">
                      {uploadError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto bg-white dark:bg-gray-800 sticky bottom-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-10">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-blue-500 hover:text-blue-700 border border-blue-300 rounded"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isSavingRCMD}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-busy={isSaving || isSavingRCMD}
                >
                  {isSaving || isSavingRCMD ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {/* General form error message area - visible on API errors */}
            {uploadError && !formErrors.title && !formErrors.description && (
              <div
                className="text-red-500 text-sm mx-6 mb-4 p-2 bg-red-50 rounded"
                role="alert"
                aria-live="assertive"
              >
                {uploadError}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
