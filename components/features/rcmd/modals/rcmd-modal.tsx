"use client";

import { useState, useEffect, useRef } from "react";
import { uploadContentImage } from "@/utils/storage";
import Image from "next/image";
import { useModalStore } from "@/stores/modal-store";
import { useRCMDStore } from "@/stores/rcmd-store";
import { MagicFill } from "@/components/common";
import { TagInput } from "@/components/common/forms";
import LinkInput from "@/components/ui/link-input";
import { Spinner } from "@/components/ui/spinner";
import Script from "next/script";

// Update TypeScript declarations for Google Maps
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
          ) => {
            addListener: (event: string, callback: () => void) => void;
            getPlace: () => {
              place_id?: string;
              name?: string;
              formatted_address?: string;
              geometry?: {
                location: {
                  lat: () => number;
                  lng: () => number;
                };
              };
              address_components?: Array<{
                long_name: string;
                short_name: string;
                types: string[];
              }>;
            };
          };
        };
        event: {
          clearInstanceListeners: (instance: any) => void;
        };
      };
    };
  }
}

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
  const [isFetchingMetadataImage, setIsFetchingMetadataImage] = useState(false);
  const [metadataImageUrl, setMetadataImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    placeId: string;
    address: string;
    lat?: number;
    lng?: number;
  } | null>(null);
  const [locationInput, setLocationInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<
    Array<{
      placeId: string;
      description: string;
    }>
  >([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

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

  // Initialize Google Maps Autocomplete
  useEffect(() => {
    if (
      !isRCMDModalOpen ||
      !locationInputRef.current ||
      !window.google?.maps?.places ||
      !mapsLoaded
    ) {
      return;
    }

    try {
      // Create the autocomplete object
      const autocomplete = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          types: ["establishment", "geocode"],
          fields: ["place_id", "formatted_address", "geometry", "name"],
        }
      );

      // Store the autocomplete instance
      autocompleteRef.current = autocomplete;

      // Add place_changed event listener
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.place_id) {
          // Set the location state with the selected place details
          setLocation({
            placeId: place.place_id,
            address: place.formatted_address || place.name || locationInput,
            lat: place.geometry?.location.lat(),
            lng: place.geometry?.location.lng(),
          });

          // Update the input value to show the formatted address
          setLocationInput(
            place.formatted_address || place.name || locationInput
          );

          // Hide suggestions since we've selected a place
          setShowLocationSuggestions(false);
        }
      });

      // Clean up on unmount
      return () => {
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(
            autocompleteRef.current
          );
        }
      };
    } catch (error) {
      console.error("Error initializing Google Maps Autocomplete:", error);
    }
  }, [isRCMDModalOpen, mapsLoaded]);

  const handleMetadataFound = (metadata: {
    title?: string;
    description?: string;
    image?: File;
    type?: string;
    imageDimensions?: { width: number; height: number };
    embedHtml?: string;
  }) => {
    if (metadata.title) setTitle(metadata.title);
    if (metadata.description) setDescription(metadata.description);
    if (metadata.type) {
      // Map Instagram type to your existing types if needed
      setType(metadata.type === "instagram" ? "social" : metadata.type);
    }
    if (metadata.image) setFile(metadata.image);
    if (metadata.imageDimensions) setImageDimensions(metadata.imageDimensions);

    // Optionally store the embed HTML if you want to use it later
    if (metadata.embedHtml) {
      // You might want to add a new state for this
      // setEmbedHtml(metadata.embedHtml);
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

  const handleLinkMetadata = (metadata: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
  }) => {
    console.log("Received metadata:", metadata); // Debug log
    try {
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

  const resetForm = () => {
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
  };

  const handleClose = () => {
    resetForm();
    setIsRCMDModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isSavingRCMD) return;

    try {
      setIsSaving(true);
      let imageUrl: string | undefined;

      // If we have a metadata image URL, fetch and upload it
      if (metadataImageUrl) {
        const uploadedUrl = await fetchAndUploadExternalImage(metadataImageUrl);
        imageUrl = uploadedUrl || undefined;
      }
      // Otherwise if we have a local file, upload it
      else if (file) {
        imageUrl = await uploadContentImage(file, "rcmds");
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
    console.log("Google Maps API loaded");
    setMapsLoaded(true);
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
      setShowLocationSuggestions(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  if (!isRCMDModalOpen) return null;

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=quarterly`}
        onLoad={handleGoogleMapsLoad}
        strategy="lazyOnload"
        async
      />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-hidden">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-auto">
          <h2 className="text-lg font-semibold mb-4">New RCMD</h2>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Will implement once we get full Facebook access
              <MagicFill onMetadataFound={handleMetadataFound} /> */}

              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <LinkInput
                  value={url}
                  onChange={setUrl}
                  onMetadataFetch={handleLinkMetadata}
                  onClear={handleUrlClear}
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="other">Other</option>
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                  <option value="place">Place</option>
                  <option value="experience">Experience</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
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
                  />

                  {/* Location Icon */}
                  <svg
                    className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
                  {isFetchingMetadataImage && (
                    <span className="text-sm text-blue-500 flex items-center">
                      <Spinner className="h-4 w-4 mr-2" />
                      Loading image...
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
                          unoptimized={true}
                        />
                      </div>
                    ) : (
                      // For local user uploaded file
                      <Image
                        src={URL.createObjectURL(file as Blob)}
                        alt="Preview"
                        width={200}
                        height={200}
                        className="max-h-40 object-contain"
                      />
                    )}
                    <div className="text-sm text-gray-500 mt-1">
                      {!metadataImageUrl && file && (
                        <div>
                          Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      )}
                      {imageDimensions && (
                        <div>
                          {metadataImageUrl ? "Estimated " : ""}Dimensions:{" "}
                          {imageDimensions.width}x{imageDimensions.height}px
                        </div>
                      )}
                      {metadataImageUrl && (
                        <div className="text-blue-500">
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
                >
                  {isSaving || isSavingRCMD ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
