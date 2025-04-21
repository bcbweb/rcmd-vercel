#!/usr/bin/env node

const { createClient } = require("@sanity/client");

// Create a minimal client to check authentication
const client = createClient({
  projectId: "ce6vefd3",
  dataset: "production",
  apiVersion: "2023-10-10",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_STUDIO_API_TOKEN,
});

console.log("Checking Sanity authentication...");

// Check if token is valid by attempting to fetch a document
async function checkToken() {
  try {
    // Get token status
    if (!client.config().token) {
      console.log("\n❌ No token found in environment variables");
      console.log("Please set a token with:");
      console.log("  export SANITY_API_TOKEN=your_token_here\n");
      console.log("You can create a token at https://manage.sanity.io/\n");
      process.exit(1);
    }

    // Test token permissions by checking if we can read documents
    console.log("Token found! Testing permissions...");
    const dataset = await client.fetch("count(*)");
    console.log(`✅ Successfully connected to dataset 'production'`);
    console.log(`Found ${dataset} document(s) in the dataset`);

    // Try to understand write permissions
    try {
      // Simple draft document to test write permissions
      const draftId = `drafts.test_${Date.now()}`;
      await client.createOrReplace({
        _id: draftId,
        _type: "test",
        title: "Test Document",
      });

      console.log(
        "✅ Write access confirmed! Your token has full permissions."
      );

      // Clean up the test document
      await client.delete(draftId);
    } catch (writeError) {
      if (writeError.message.includes("auth")) {
        console.log(
          "⚠️ Token has read-only access. You need write access to run migration scripts."
        );
      } else {
        console.log(
          "⚠️ Could not verify write access, but may still have permissions."
        );
      }
    }
  } catch (error) {
    console.error("❌ Error checking token:", error.message);
    if (error.message.includes("authorized")) {
      console.log(
        "\nAuthentication error. Please check your token permissions."
      );
    }
    process.exit(1);
  }
}

checkToken();
