# Sanity Content Migration Scripts

This directory contains scripts to migrate content from hard-coded pages into Sanity.

## Authentication

To run these scripts, you'll need a Sanity write token. Here's how to get one:

1. Go to https://manage.sanity.io/ and select your project (ce6vefd3)
2. Navigate to API > Tokens
3. Click "Add API token"
4. Name it something like "Content Migration"
5. Set permissions to "Editor" (allows read/write but not delete)
6. Set the token as an environment variable:

```bash
export SANITY_API_TOKEN=your_token_here
```

## Running the Migration

From the sanity-studio directory, run:

```bash
# Migrate the "for-individuals" page to Sanity
node scripts/migrate-for-individuals.js

# Or use the npm script
npm run migrate:for-individuals
```

## Creating New Migration Scripts

To create migrations for additional pages:

1. Copy the structure from `migrate-for-individuals.js`
2. Update the content object with the specific page content
3. Update the query to check for your specific page slug
4. Add the script to package.json for easy execution

## Troubleshooting

- If you get authentication errors, ensure your token has the correct permissions
- Verify your token is set correctly in the environment
- Make sure the schema type exists before running the migration
