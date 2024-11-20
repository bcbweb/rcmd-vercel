export type Message =
	| { success: string; }
	| { error: string; }
	| { message: string; }
	| { type: "success" | "error", message: string; };

export function FormMessage({ message }: { message: Message; }) {
	if (!message) return;

	// Handle the encodedRedirect format
	if ("type" in message && "message" in message) {
		return (
			<div className="bg-muted/50 px-5 py-3 border rounded-md">
				{message.type === "success" && (
					<div className="text-sm text-secondary-foreground">
						{message.message}
					</div>
				)}
				{message.type === "error" && (
					<div className="text-sm text-destructive">
						{message.message}
					</div>
				)}
			</div>
		);
	}

	// Handle the direct message format
	return (
		<div className="bg-muted/50 px-5 py-3 border rounded-md">
			{"success" in message && (
				<div className="text-sm text-secondary-foreground">
					{message.success}
				</div>
			)}
			{"error" in message && (
				<div className="text-sm text-destructive">
					{message.error}
				</div>
			)}
			{"message" in message && message.message && (
				<div className="text-sm text-secondary-foreground">
					{message.message}
				</div>
			)}
		</div>
	);
}