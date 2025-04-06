export type Message =
  | { success: string }
  | { error: string }
  | { message: string }
  | { type: "success" | "error" | "info"; message: string };

export function FormMessage({ message }: { message: Message }) {
  if (!message) return null;

  // Handle the encodedRedirect format
  if ("type" in message && "message" in message) {
    if (!message.message) return null;

    return (
      <div
        className={`py-3 rounded-md flex items-start gap-3 ${
          message.type === "success"
            ? "bg-green-50 border border-green-200 text-green-800"
            : message.type === "error"
              ? "bg-red-50 border border-red-200 text-red-800"
              : "bg-blue-50 border border-blue-200 text-blue-800"
        }`}
      >
        {message.type === "success" && (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mt-0.5 text-green-600 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm w-full">{message.message}</div>
          </>
        )}
        {message.type === "error" && (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mt-0.5 text-red-600 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm w-full">{message.message}</div>
          </>
        )}
        {message.type === "info" && (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm w-full">{message.message}</div>
          </>
        )}
      </div>
    );
  }

  // Check if there's any message content to display
  const hasContent =
    ("success" in message && message.success) ||
    ("error" in message && message.error) ||
    ("message" in message && message.message);

  if (!hasContent) return null;

  // Handle the direct message format (assuming this format should also not have outer padding)
  // Note: This part of the component seems to duplicate the styling logic. Consider refactoring.
  return (
    <div className="py-3 rounded-md flex items-start gap-3">
      {"success" in message && message.success && (
        <div
          className={`w-full py-3 rounded-md flex items-start gap-3 bg-green-50 border border-green-200 text-green-800`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mt-0.5 text-green-600 flex-shrink-0 ml-5" // Added ml-5 to mimic outer padding for icon
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm w-full pr-5">{message.success}</div>{" "}
          {/* Added pr-5 */}
        </div>
      )}
      {"error" in message && message.error && (
        <div
          className={`w-full py-3 rounded-md flex items-start gap-3 bg-red-50 border border-red-200 text-red-800`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mt-0.5 text-red-600 flex-shrink-0 ml-5" // Added ml-5 to mimic outer padding for icon
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm w-full pr-5">{message.error}</div>{" "}
          {/* Added pr-5 */}
        </div>
      )}
      {"message" in message && message.message && (
        <div
          className={`w-full py-3 rounded-md flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0 ml-5" // Added ml-5 to mimic outer padding for icon
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm w-full pr-5">{message.message}</div>{" "}
          {/* Added pr-5 */}
        </div>
      )}
    </div>
  );
}
