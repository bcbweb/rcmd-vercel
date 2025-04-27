import { getShortIdFromUUID, getUUIDFromShortId } from "./short-id";

// Test UUIDs from your database
const testUuids = [
  "618fc3e3-bd92-4a19-89df-317d89f2920d",
  "14e4ae39-a725-4992-bee4-827426eb42fe",
  "1e942ff6-9f9d-4a73-8471-a99385bfd3e9",
  "328b236d-edc8-4504-aab1-f265371ca7c6",
];

// Function to test the encoding and decoding
function testEncodeDecode() {
  console.log("Testing UUID ↔ Short ID conversion\n");
  console.log(
    "UUID                                    | Short ID      | Decoded UUID"
  );
  console.log(
    "----------------------------------------|---------------|----------------------------------------"
  );

  for (const uuid of testUuids) {
    // Encode the UUID
    const shortId = getShortIdFromUUID(uuid);

    // Decode back
    const decodedUuid = getUUIDFromShortId(shortId);

    // Check if it matches
    const isValid = uuid === decodedUuid;

    console.log(
      `${uuid} | ${shortId.padEnd(15)} | ${decodedUuid} ${isValid ? "✓" : "❌"}`
    );
  }
}

// Run the tests
testEncodeDecode();
