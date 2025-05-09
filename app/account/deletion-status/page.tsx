import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";

interface DeletionStatusProps {
  searchParams: { code?: string };
}

export default function DeletionStatus({ searchParams }: DeletionStatusProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Data Deletion Status</h1>

        <Suspense fallback={<p>Loading status...</p>}>
          <DeletionStatusContent confirmationCode={searchParams.code} />
        </Suspense>
      </div>
    </div>
  );
}

async function DeletionStatusContent({
  confirmationCode,
}: {
  confirmationCode?: string;
}) {
  if (!confirmationCode) {
    return (
      <div>
        <p className="text-red-500 mb-4">No confirmation code provided.</p>
        <p>
          Please use the URL provided when you requested your data deletion. If
          you're having trouble, please contact our support team.
        </p>
      </div>
    );
  }

  try {
    // Check deletion status in database
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("meta_deletion_logs")
      .select("status, requested_at, completed_at")
      .eq("confirmation_code", confirmationCode)
      .single();

    if (error || !data) {
      return (
        <div>
          <p className="text-red-500 mb-4">
            Deletion request not found for the provided confirmation code.
          </p>
          <p>
            If you believe this is an error, please contact our support team.
          </p>
        </div>
      );
    }

    // Display status based on database record
    return (
      <div>
        <div className="mb-4">
          <p className="font-semibold">Confirmation Code:</p>
          <p className="font-mono bg-gray-100 p-2 rounded">
            {confirmationCode}
          </p>
        </div>

        <div className="mb-4">
          <p className="font-semibold">Status:</p>
          <p className={`font-medium ${getStatusColor(data.status)}`}>
            {getStatusMessage(data.status)}
          </p>
        </div>

        <div className="mb-4">
          <p className="font-semibold">Requested:</p>
          <p>{new Date(data.requested_at).toLocaleString()}</p>
        </div>

        {data.completed_at && (
          <div className="mb-4">
            <p className="font-semibold">Completed:</p>
            <p>{new Date(data.completed_at).toLocaleString()}</p>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-4">
          If you have any questions about your data deletion request, please
          contact our support team.
        </p>
      </div>
    );
  } catch (error) {
    console.error("Error fetching deletion status:", error);
    return (
      <div>
        <p className="text-red-500 mb-4">
          An error occurred while checking your deletion status.
        </p>
        <p>
          Please try again later or contact our support team for assistance.
        </p>
      </div>
    );
  }
}

// Helper functions
function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "text-green-600";
    case "processing":
      return "text-blue-600";
    case "error":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case "completed":
      return "Your data has been successfully deleted.";
    case "processing":
      return "Your deletion request is being processed.";
    case "error":
      return "There was an error processing your deletion request.";
    case "no_user_found":
      return "No user data found to delete.";
    case "no_profile_found":
      return "No profile data found to delete.";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
