const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Maps of old import paths to new import paths
const importPathMap = {
  // Carousel components
  "@/components/generic-carousel": "@/components/common/carousel",
  "@/components/business-card": "@/components/common/carousel",
  "@/components/profile-card": "@/components/common/carousel",
  "@/components/rcmd-card": "@/components/common/carousel",

  // Layout components
  "@/components/footer": "@/components/layout/footer",
  "@/components/header-auth": "@/components/layout/header",
  "@/components/user-menu": "@/components/layout/header",

  // Form components
  "@/components/form-message": "@/components/common/forms",
  "@/components/submit-button": "@/components/common/forms",
  "@/components/tag-input": "@/components/common/forms",
  "@/components/url-handle-input": "@/components/common/forms",
  "@/components/username-input": "@/components/common/forms",

  // Media components
  "@/components/cover-image-upload": "@/components/common/media",
  "@/components/profile-photo-upload": "@/components/common/media",

  // Feature components
  "@/components/root-auth-initializer": "@/components/features/auth",
  "@/components/profile-feed": "@/components/features/profile",
  "@/components/creator-feed": "@/components/features/profile",
  "@/components/rcmd-feed": "@/components/features/rcmd",
  "@/components/rcmds/add-rcmd-button": "@/components/features/rcmd",
  "@/components/rcmds/rcmd-blocks": "@/components/features/rcmd",
  "@/components/rcmds/modals/rcmd-modal": "@/components/features/rcmd/modals",
  "@/components/links/modals/link-modal": "@/components/features/links/modals",
  "@/components/providers/supabase-provider": "@/components/common/providers",

  // Shared components
  "@/components/shared/profile-editor": "@/components/features/profile",
  "@/components/shared/social-media-editor": "@/components/features/profile",
  "@/components/shared/image-editor": "@/components/common/media",
  "@/components/shared/share-modal": "@/components/common/modals",
  "@/components/shared/grid-skeleton": "@/components/common",
  "@/components/shared/grid-layout": "@/components/common",
  "@/components/step-progress": "@/components/common",

  // Additional components for collections, links, and profile
  "@/components/collections/add-collection-button":
    "@/components/features/collections",
  "@/components/collections/collection-blocks":
    "@/components/features/collections",
  "@/components/links/add-link-button": "@/components/features/links",
  "@/components/links/link-blocks": "@/components/features/links",
  "@/components/profile/header/main": "@/components/features/profile/header",
  "@/components/profile/add-block-button": "@/components/features/profile",
  "@/components/profile/profile-blocks": "@/components/features/profile",
  "@/components/profile/modals/rcmd-block-modal":
    "@/components/features/profile/modals",
  "@/components/profile/modals/text-block-modal":
    "@/components/features/profile/modals",
  "@/components/profile/modals/image-block-modal":
    "@/components/features/profile/modals",
  "@/components/profile/modals/link-block-modal":
    "@/components/features/profile/modals",
  "@/components/profile/modals/collection-block-modal":
    "@/components/features/profile/modals",
  "@/components/collections/modals/collection-modal":
    "@/components/features/collections/modals",
  "@/components/shared/block-actions": "@/components/common",
  "@/components/shared/styles": "@/components/common",
  "@/components/shared/block-stats": "@/components/common",
  "@/components/shared/block-skeleton": "@/components/common",
  "@/components/profile/blocks/rcmd-block":
    "@/components/features/profile/blocks",
  "@/components/shared/magic-fill": "@/components/common",
  "@/components/profile/public/profile-blocks":
    "@/components/features/profile/public",
  "@/components/theme-switcher": "@/components/common",
  "@/components/global-modals": "@/components/common/modals",
  "@/components/hero": "@/components/common",
};

// Function to check if a file should be processed
function shouldProcessFile(filePath) {
  const extensions = [".js", ".jsx", ".ts", ".tsx"];
  const ignoredDirs = ["node_modules", ".next", "out", "build", "dist"];

  const ext = path.extname(filePath);
  if (!extensions.includes(ext)) return false;

  return !ignoredDirs.some((dir) => filePath.includes(dir));
}

// Get all TypeScript/JavaScript files except those in excluded directories
function getAllFiles() {
  try {
    const output = execSync(
      'find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v "node_modules\\|.next\\|out\\|build\\|dist"'
    ).toString();
    return output.split("\n").filter(Boolean);
  } catch (error) {
    console.error("Error finding files:", error);
    return [];
  }
}

// Update imports in a file
function updateFileImports(filePath) {
  try {
    if (!shouldProcessFile(filePath)) return;

    const content = fs.readFileSync(filePath, "utf8");
    let updatedContent = content;
    let updated = false;

    for (const [oldPath, newPath] of Object.entries(importPathMap)) {
      // Match import statements with the old path
      const importRegex = new RegExp(
        `(import\\s+(?:{[^}]*}|[^{}]+)\\s+from\\s+['"])${oldPath.replace("/", "\\/")}(['"])`,
        "g"
      );

      if (importRegex.test(updatedContent)) {
        updated = true;
        updatedContent = updatedContent.replace(importRegex, `$1${newPath}$2`);
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, updatedContent, "utf8");
      console.log(`Updated imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

// Main execution
const files = getAllFiles();
console.log(`Found ${files.length} files to process`);

let updatedCount = 0;
for (const filePath of files) {
  updateFileImports(filePath);
  updatedCount++;
  if (updatedCount % 50 === 0) {
    console.log(`Processed ${updatedCount} / ${files.length} files...`);
  }
}

console.log(`Done! Processed ${files.length} files.`);
