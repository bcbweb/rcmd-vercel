#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("Setting up Sanity content migration...");

// Check if @sanity/client is installed
try {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const dependencies = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };

  const missingDeps = [];

  if (!dependencies["@sanity/client"]) {
    missingDeps.push("@sanity/client");
  }

  if (missingDeps.length > 0) {
    console.log(`Installing missing dependencies: ${missingDeps.join(", ")}`);
    execSync(`bun add ${missingDeps.join(" ")}`, { stdio: "inherit" });
  }

  // Create scripts directory if it doesn't exist
  if (!fs.existsSync("scripts")) {
    fs.mkdirSync("scripts");
  }

  console.log(
    "Setup complete! Now you can deploy your Sanity schema and content."
  );
  console.log("");
  console.log("1. Deploy the schema:");
  console.log("   bun run deploy-sanity");
  console.log("");
  console.log(
    "2. Create a Sanity token at https://manage.sanity.io/ and set it:"
  );
  console.log("   export SANITY_API_TOKEN=your_token_here");
  console.log("");
  console.log("3. Run the content migration script:");
  console.log("   bun run deploy-content");
  console.log("");
} catch (error) {
  console.error("Error setting up Sanity migration:", error);
  process.exit(1);
}
