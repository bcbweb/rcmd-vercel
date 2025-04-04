export type Message =
  | { success: string }
  | { error: string }
  | { message: string }
  | { type: "success" | "error"; message: string };

export function FormMessage({ message }: { message: Message }) {
  if (!message) return null;

  // Handle the encodedRedirect format
  if ("type" in message && "message" in message) {
    if (!message.message) return null;

    return (
      <div className="bg-muted/50 px-5 py-3 border rounded-md">
        {message.type === "success" && (
          <div className="text-sm text-secondary-foreground">
            {message.message}
          </div>
        )}
        {message.type === "error" && (
          <div className="text-sm text-destructive">{message.message}</div>
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

  // Handle the direct message format
  return (
    <div className="bg-muted/50 px-5 py-3 border rounded-md">
      {"success" in message && message.success && (
        <div className="text-sm text-secondary-foreground">
          {message.success}
        </div>
      )}
      {"error" in message && message.error && (
        <div className="text-sm text-destructive">{message.error}</div>
      )}
      {"message" in message && message.message && (
        <div className="text-sm text-secondary-foreground">
          {message.message}
        </div>
      )}
    </div>
  );
}
