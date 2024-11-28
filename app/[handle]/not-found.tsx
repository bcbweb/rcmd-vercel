import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-8">
        The page you're looking for doesn't exist or has been removed.
      </p>
      <Link
        href="/"
        className="text-primary hover:underline"
      >
        Return Home
      </Link>
    </div>
  );
}