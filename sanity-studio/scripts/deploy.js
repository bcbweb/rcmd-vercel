#!/usr/bin/env node

import { createClient } from "@sanity/client";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

// Create the Sanity client with explicit configuration
const projectId = "ce6vefd3";
const dataset = "production";

// Write a temporary CommonJS file for the CLI
const tempCliFile = path.join(process.cwd(), "temp-sanity.cli.cjs");
fs.writeFileSync(
  tempCliFile,
  `
module.exports = {
  api: {
    projectId: "${projectId}",
    dataset: "${dataset}"
  }
};
`
);

console.log(`Deploying Sanity Studio to project: ${projectId}`);

async function deploy() {
  try {
    // Run the deploy command with the temp file
    const { stdout, stderr } = await execAsync(
      `NODE_OPTIONS=--require=${tempCliFile} npx sanity deploy`
    );

    console.log(stdout);
    if (stderr) console.error(stderr);

    console.log("Deployment complete!");
  } catch (error) {
    console.error("Deployment failed:", error.message);
    if (error.stderr) console.error(error.stderr);
  } finally {
    // Clean up the temp file
    fs.unlinkSync(tempCliFile);
  }
}

deploy();
