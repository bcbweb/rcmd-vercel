/**
 * Minimal configuration for the hosted Sanity Studio
 */
import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";

// Sanity v3 deployed studio configuration
export default defineConfig({
  projectId: "ce6vefd3",
  dataset: "production",
  title: "RCMD Content Studio",
  basePath: "",
  plugins: [deskTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
