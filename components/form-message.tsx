export type Message =
	| { success: string; }
	| { error: string; }
	| { message: string; }
	| { type: "success" | "error", message: string; };

export function FormMessage({ message }: { message: Message; }) {
	// Handle the encodedRedirect format
	if ("type" in message && "message" in message) {
		if (message.type === "success") {
			return (
				<div className="flex flex-col gap-2 w-full max-w-md text-sm">
					<div className="text-foreground border-l-2 border-foreground px-4">
						{message.message}
					</div>
				</div>
			);
		}
		if (message.type === "error") {
			return (
				<div className="flex flex-col gap-2 w-full max-w-md text-sm">
					<div className="text-destructive-foreground border-l-2 border-destructive-foreground px-4">
						{message.message}
					</div>
				</div>
			);
		}
	}

	// Handle the direct message format
	return (
		<div className="flex flex-col gap-2 w-full max-w-md text-sm">
			{"success" in message && (
				<div className="text-foreground border-l-2 border-foreground px-4">
					{message.success}
				</div>
			)}
			{"error" in message && (
				<div className="text-destructive-foreground border-l-2 border-destructive-foreground px-4">
					{message.error}
				</div>
			)}
			{"message" in message && (
				<div className="text-foreground border-l-2 px-4">{message.message}</div>
			)}
		</div>
	);
}