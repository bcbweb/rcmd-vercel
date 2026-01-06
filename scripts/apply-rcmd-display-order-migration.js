#!/usr/bin/env node

/**
 * Script to apply the display_order migration for RCMDs
 * This can be run manually or via the Supabase dashboard SQL editor
 */

const fs = require("fs");
const path = require("path");

const migrationFile = path.join(
  __dirname,
  "../supabase/migrations/20250115_add_display_order_to_rcmds.sql"
);

console.log("Migration SQL to apply:");
console.log("=".repeat(80));
console.log(fs.readFileSync(migrationFile, "utf8"));
console.log("=".repeat(80));
console.log("\nTo apply this migration:");
console.log(
  "1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/dmhigtssxgoupibxazoe/sql/new"
);
console.log("2. Copy and paste the SQL above");
console.log('3. Click "Run" to execute');
console.log("\nOr use Supabase CLI:");
console.log("  supabase db push --linked");
console.log("  (You will need to enter your database password)");

