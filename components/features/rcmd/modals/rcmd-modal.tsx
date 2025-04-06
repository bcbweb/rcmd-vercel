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
  const { isRCMDModalOpen, setIsRCMDModalOpen, onModalSuccess } =
    useModalStore();

  const {
    insertRCMD,
    isLoading: isSavingRCMD,
    error: rcmdError,
  } = useRCMDStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("other");
  const [visibility, setVisibility] = useState("private");
  const [isSaving, setIsSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataImageUrl, setMetadataImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    placeId: string;
    address: string;
    lat?: number;
    lng?: number;
  } | null>(null);
  const [locationInput, setLocationInput] = useState("");
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Add modal focus trap reference
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);

  // Define resetForm function
  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setType("other");
    setVisibility("private");
    setFile(null);
    setUploadError(null);
    setImageDimensions(null);
    setTags([]);
    setUrl("");
    setLocation(null);
    setLocationInput("");
    setMetadataImageUrl(null);
  }, []);

  // Define handleClose function
  const handleClose = useCallback(() => {
    resetForm();
    setIsRCMDModalOpen(false);
  }, [resetForm, setIsRCMDModalOpen]);

  // Add keyboard event handling for the modal
  useEffect(() => {
    if (!isRCMDModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on ESC key
      if (e.key === "Escape") {
        handleClose();
      }
    };

    // Focus the first input when modal opens
    if (initialFocusRef.current) {
      initialFocusRef.current.focus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRCMDModalOpen, handleClose]);

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
      // Create the autocomplete object
      const autocomplete = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          types: ["establishment", "geocode"],
          fields: ["place_id", "formatted_address", "geometry", "name"],
        }
      );

      autocompleteInstance = autocomplete;

      // Store the autocomplete instance
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

          if (place.place_id) {
            // More robust handling of optional fields
            const lat = place.geometry?.location?.lat?.();
            const lng = place.geometry?.location?.lng?.();

            // Set the location state with the selected place details
            setLocation({
              placeId: place.place_id,
              address: place.formatted_address || place.name || locationInput,
              ...(lat !== undefined && { lat }),
              ...(lng !== undefined && { lng }),
            });

            // Update the input value to show the formatted address
            setLocationInput(
              place.formatted_address || place.name || locationInput
            );
          }
        } catch (error) {
          console.error("Error handling place change:", error);
        }
      };

      autocomplete.addListener("place_changed", placeChangedListener);

      // Clean up on unmount with better error handling
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
    }
  }, [isRCMDModalOpen, mapsLoaded, locationInput]);

  const handleLinkMetadata = (metadata: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
  }) => {
    console.log("Received metadata:", metadata); // Debug log
    try {
      setIsLoadingMetadata(true);
      // Set title and description if they're not already set
      if (!title && metadata.title) setTitle(metadata.title);
      if (!description && metadata.description)
        setDescription(metadata.description);

      // Store image URL directly rather than trying to fetch it
      if (!file && metadata.image && metadata.image.startsWith("http")) {
        console.log("Found image URL in metadata:", metadata.image);

        // Set a flag to indicate we're using an external image
        setMetadataImageUrl(metadata.image);

        // Create a dummy File object for UI purposes
        setFile({
          name: "og-image.jpg",
          size: 0,
          type: "image/jpeg",
          lastModified: Date.now(),
          // These properties are needed to satisfy TypeScript
          slice: () => new Blob(),
          stream: () => new ReadableStream(),
          text: () => Promise.resolve(""),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          webkitRelativePath: "",
        } as File);

        // Set placeholder dimensions
        setImageDimensions({
          width: 1200,
          height: 630,
        });
      }

      // Log why we're not using an image
      if (file) console.log("Not using metadata image: File already exists");
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

  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        reject(new Error("Failed to load image dimensions"));
        URL.revokeObjectURL(img.src);
      };
    });
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
        const dimensions = await getImageDimensions(selectedFile);
        setImageDimensions(dimensions);
        setFile(selectedFile);
        // Clear metadata image URL if it was previously set
        setMetadataImageUrl(null);
        setUploadError(null);
      } catch {
        setUploadError("Failed to load image dimensions");
      }
    }
  };

  // Add handler to clear image
  const handleImageClear = () => {
    setFile(null);
    setMetadataImageUrl(null);
    setImageDimensions(null);
    setUploadError(null);
  };

  // Form validation
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
  }>({});

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: {
      title?: string;
      description?: string;
    } = {};

    if (!title.trim()) {
      errors.title = "Title is required";
    }

    if (!description.trim()) {
      errors.description = "Description is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update handleSubmit to use validation
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving || isSavingRCMD) return;

    // Validate form first
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      let imageUrl: string | undefined;

      // If we have a metadata image URL, fetch and upload it
      if (metadataImageUrl) {
        const uploadedUrl = await fetchAndUploadExternalImage(metadataImageUrl);
        imageUrl = uploadedUrl || undefined;
      }
      // Otherwise if we have a local file, upload it
      else if (file && !metadataImageUrl) {
        try {
          imageUrl = await uploadContentImage(file, "rcmds");
        } catch (error) {
          console.error("Error uploading file:", error);
          setUploadError("Failed to upload image. Please try again.");
          setIsSaving(false);
          return;
        }
      }

      // Format location data for submission
      const locationData = location
        ? {
            placeId: location.placeId,
            address: location.address,
            coordinates: {
              lat: location.lat,
              lng: location.lng,
            },
          }
        : undefined;

      const newRCMD = await insertRCMD(
        title,
        description,
        type,
        visibility,
        imageUrl,
        tags,
        url,
        locationData
      );

      if (newRCMD) {
        handleClose();
        onModalSuccess?.();
      } else {
        throw new Error(rcmdError || "Failed to create new RCMD");
      }
    } catch (error) {
      console.error("Error saving RCMD:", error);
      setUploadError(
        error instanceof Error ? error.message : "Error saving RCMD"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Add a function to handle URL clearing
  const handleUrlClear = () => {
    // First set URL to empty to prevent further fetch attempts
    setUrl("");

    // Only clear these if they were likely set from metadata
    // and if we don't have any user-entered content
    if (title && description && !tags.length) {
      setTitle("");
      setDescription("");
    }

    // Clear file and metadata image URL separately
    if (file) {
      setFile(null);
      setImageDimensions(null);
    }
    if (metadataImageUrl) {
      setMetadataImageUrl(null);
    }
  };

  // Load Google Maps API script
  const handleGoogleMapsLoad = () => {
    try {
      console.log("Google Maps API loaded");
      setMapsLoaded(true);
    } catch (error) {
      console.error("Error loading Google Maps API:", error);
    }
  };

  // Simplified location input change handler
  const handleLocationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setLocationInput(value);

    // Clear the location data if the input is cleared
    if (!value) {
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

  // Improved image preview function with memoization pattern
  const getImagePreviewUrl = (file: File | null): string => {
    if (!file) return "";

    // Skip the try/catch for the type check, which is unnecessary
    if (!(file instanceof Blob)) return "";

    try {
      return URL.createObjectURL(file);
    } catch (error) {
      console.error("Error creating object URL:", error);
      return "";
    }
  };

  // Add this new helper function to fetch and upload the external image
  const fetchAndUploadExternalImage = async (
    imageUrl: string
  ): Promise<string | null> => {
    try {
      console.log("Fetching external image:", imageUrl);
      // Use the fetch API to get the image
      const response = await fetch("/api/proxy-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error(`Failed to proxy image: ${response.statusText}`);
      }

      // Get the image as a blob
      const blob = await response.blob();

      // Create a File object from the blob
      const file = new File([blob], "og-image.jpg", {
        type: blob.type || "image/jpeg",
      });

      // Upload the file to Supabase storage
      const uploadedUrl = await uploadContentImage(file, "rcmds");
      console.log("Image uploaded successfully:", uploadedUrl);

      return uploadedUrl;
    } catch (error) {
      console.error("Error fetching/uploading external image:", error);
      return null;
    }
  };

  if (!isRCMDModalOpen) return null;

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&libraries=places&v=quarterly`}
        onLoad={handleGoogleMapsLoad}
        onError={(e) => console.error("Error loading Google Maps API:", e)}
        strategy="lazyOnload"
      />
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-heading"
      >
        <div
          ref={modalRef}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-auto"
          tabIndex={-1} // For focus capturing
        >
          <h2 id="modal-heading" className="text-lg font-semibold mb-4">
            New RCMD
          </h2>

          <form
            onSubmit={handleSubmit}
            aria-label="Create new recommendation"
            noValidate
          >
            <div
              className="space-y-4"
              role="group"
              aria-labelledby="rcmd-form-heading"
            >
              <h3 id="rcmd-form-heading" className="sr-only">
                Recommendation details
              </h3>

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
                  />
                </div>
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
                      setFormErrors((prev) => ({ ...prev, title: undefined }));
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
                    className="w-full p-2 pl-10 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    ref={locationInputRef}
                    aria-label="Location search"
                    autoComplete="off"
                  />

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
                    Selected: {location.address}
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
                  {(file || metadataImageUrl) && (
                    <button
                      type="button"
                      onClick={handleImageClear}
                      className="py-2 px-4 text-sm font-semibold rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Remove
                    </button>
                  )}
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
                {(file || metadataImageUrl) && (
                  <div className="mt-2">
                    {metadataImageUrl ? (
                      // For remote image from metadata
                      <div className="relative w-full h-40">
                        <Image
                          src={metadataImageUrl}
                          alt="Preview from website"
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 400px"
                          priority
                          onError={() => {
                            console.error("Error loading metadata image");
                            setUploadError("Failed to load image preview");
                            setMetadataImageUrl(null); // Clear the invalid URL
                          }}
                        />
                      </div>
                    ) : (
                      // For local user uploaded file
                      file && (
                        <div className="image-preview-container">
                          {getImagePreviewUrl(file) ? (
                            <Image
                              src={getImagePreviewUrl(file)}
                              alt="Image preview"
                              width={200}
                              height={200}
                              className="max-h-40 object-contain"
                              onError={() => {
                                setUploadError(
                                  "Error displaying image preview"
                                );
                                setFile(null); // Clear the problematic file
                              }}
                            />
                          ) : (
                            <div className="p-4 border border-gray-200 rounded text-gray-500 text-sm">
                              Preview not available
                            </div>
                          )}
                        </div>
                      )
                    )}

                    {/* Image details information */}
                    <div className="text-sm text-gray-500 mt-1">
                      {!metadataImageUrl && file && (
                        <div>
                          <span className="sr-only">File size:</span>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      )}
                      {imageDimensions && (
                        <div>
                          <span className="sr-only">Image dimensions:</span>
                          {metadataImageUrl ? "Estimated " : ""}
                          {imageDimensions.width}x{imageDimensions.height}px
                        </div>
                      )}
                      {metadataImageUrl && (
                        <div className="text-blue-500" aria-live="polite">
                          Using image from website metadata
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {uploadError && (
                  <div className="text-red-500 text-sm mt-1">{uploadError}</div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
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

              {/* General form error message area - visible on API errors */}
              {uploadError && !formErrors.title && !formErrors.description && (
                <div
                  className="text-red-500 text-sm mt-3 p-2 bg-red-50 rounded"
                  role="alert"
                  aria-live="assertive"
                >
                  {uploadError}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
