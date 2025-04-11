// This file explicitly defines tools to avoid looking for admin
import { deskTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";

export const defaultTools = [
  deskTool({
    name: "desk",
    title: "Content",
  }),
  visionTool({
    name: "vision",
    title: "Vision",
  }),
];
