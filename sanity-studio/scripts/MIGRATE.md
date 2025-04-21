# Step-by-Step Content Migration to Sanity

This guide walks you through migrating your hard-coded pages to Sanity CMS.

## Prerequisites

1. Make sure you have a Sanity account and access to the project
2. Verify that the schema has been deployed (the `marketingPage` schema type exists)

## Step 1: Get an API Token

1. Go to https://manage.sanity.io/ and select your project (ce6vefd3)
2. Navigate to API > Tokens
3. Click "Add API token"
4. Name it something like "Content Migration"
5. Set permissions to "Editor" (allows read/write but not delete)
6. Copy the token

## Step 2: Set the Environment Variable

Set the token as an environment variable:

```bash
export SANITY_API_TOKEN=your_token_here
```

## Step 3: Verify Your Token

Run the check-token script to verify your token has the proper permissions:

```bash
npm run check-token
```

You should see confirmation that you have write access.

## Step 4: Run the Migration

Now you can run the migration script:

```bash
npm run migrate:for-individuals
```

This will:

1. Check if the "for-individuals" page already exists in Sanity
2. If it doesn't exist, create it
3. If it does exist, update it with the current content

## Step 5: Verify in Sanity Studio

1. Go to Sanity Studio (https://rcmd.sanity.studio)
2. Look for the "Marketing Page" document type
3. You should see your "RCMD for Individuals" page

## Troubleshooting

- **Authentication errors**: Verify your token has the correct permissions
- **Schema errors**: Make sure the schema types exist before running the migration
- **Missing dependencies**: Run `npm install` in the sanity-studio directory

## Creating Future Migrations

To migrate additional pages:

1. Copy `migrate-for-individuals.js` to a new file (e.g., `migrate-for-businesses.js`)
2. Update the content object with the specific page content
3. Update the query to check for your specific page slug
4. Add the script to package.json for easy execution
