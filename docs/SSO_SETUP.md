# SSO (Single Sign-On) Setup Guide

This guide will help you set up SSO authentication for RCMD using Supabase's built-in OAuth providers.

## Supported Providers

- **Google** - Most common, recommended for all users
- **Apple** - Required for iOS apps, privacy-focused
- **GitHub** - Great for developers and tech-savvy users
- **Facebook** - Social platform integration
- **Twitter/X** - Social platform integration

## Prerequisites

1. A Supabase project (already set up)
2. Admin access to your Supabase dashboard
3. Developer accounts for each provider you want to enable

---

## 1. Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in app name, user support email, and developer contact
   - Add scopes: `email`, `profile`
   - Add test users if in testing mode
6. Create OAuth client:
   - Application type: **Web application**
   - Name: `RCMD Web Client`
   - Authorized redirect URIs:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
     Replace `<your-project-ref>` with your Supabase project reference (found in your Supabase dashboard URL)
7. Copy the **Client ID** and **Client Secret**

### Step 2: Configure in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click to enable
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

---

## 2. Apple OAuth Setup

### Step 1: Create Apple App ID and Service ID

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create an **App ID**:
   - Description: `RCMD`
   - Bundle ID: `com.yourcompany.rcmd` (use reverse domain notation)
   - Enable **Sign in with Apple**
4. Create a **Services ID**:
   - Description: `RCMD Web Service`
   - Identifier: `com.yourcompany.rcmd.web`
   - Enable **Sign in with Apple**
   - Configure domains:
     - Domains: `yourdomain.com`, `supabase.co`
     - Return URLs:
       ```
       https://<your-project-ref>.supabase.co/auth/v1/callback
       ```
5. Create a **Key** for Sign in with Apple:
   - Key Name: `RCMD Sign In Key`
   - Enable **Sign in with Apple**
   - Download the `.p8` key file (you can only download once!)
   - Note the **Key ID**

### Step 2: Configure in Supabase

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find **Apple** and click to enable
3. Enter:
   - **Services ID**: The Services ID you created (e.g., `com.yourcompany.rcmd.web`)
   - **Secret Key**: The contents of your `.p8` file
   - **Key ID**: The Key ID from Apple Developer Portal
   - **Team ID**: Found in your Apple Developer account (top right corner)
4. Click **Save**

**Note**: Apple requires your app to be in production or have a verified domain for Sign in with Apple to work for all users.

---

## 3. GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**
3. Fill in:
   - **Application name**: `RCMD`
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it

### Step 2: Configure in Supabase

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find **GitHub** and click to enable
3. Paste your **Client ID** and **Client Secret**
4. Click **Save**

---

## 4. Facebook OAuth Setup

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** > **Create App**
3. Choose **Consumer** as the app type
4. Fill in app details:
   - **App Name**: `RCMD`
   - **App Contact Email**: Your email
5. Add **Facebook Login** product:
   - Go to **Products** > **Facebook Login** > **Set Up**
   - Choose **Web**
6. Configure Facebook Login:
   - **Valid OAuth Redirect URIs**:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
7. Go to **Settings** > **Basic**:
   - Copy **App ID** and **App Secret**
   - Add your domain to **App Domains**

### Step 2: Configure in Supabase

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find **Facebook** and click to enable
3. Paste your **App ID** and **App Secret**
4. Click **Save**

**Note**: Facebook requires app review for production use. You can add test users in the Facebook App Dashboard for development.

---

## 5. Twitter/X OAuth Setup

### Step 1: Create Twitter Developer App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new **Project** and **App**
3. In your app settings:
   - **App name**: `RCMD`
   - **Type of App**: Web App
   - **Callback URI / Redirect URL**:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
   - **App permissions**: Read (for basic profile access)
4. Go to **Keys and tokens**:
   - Copy **API Key** (this is your Client ID)
   - Copy **API Key Secret** (this is your Client Secret)
   - Generate **Access Token and Secret** if needed

### Step 2: Configure in Supabase

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find **Twitter** and click to enable
3. Paste your **API Key** (Client ID) and **API Key Secret** (Client Secret)
4. Click **Save**

**Note**: Twitter/X requires elevated access for production use. Apply for elevated access in the Twitter Developer Portal.

---

## Environment Variables

No additional environment variables are needed! Supabase handles all OAuth configuration server-side. The redirect URIs are automatically configured when you set up providers in the Supabase dashboard.

---

## Testing SSO

1. **Enable providers** in Supabase Dashboard (one at a time for testing)
2. **Test each provider**:
   - Go to `/sign-in` or `/sign-up`
   - Click the provider button (e.g., "Continue with Google")
   - Complete the OAuth flow
   - Verify you're redirected back and logged in
3. **Check user creation**:
   - Verify a profile is created automatically
   - Check that user data (email, name) is populated from the provider

---

## Troubleshooting

### Common Issues

1. **"Redirect URI mismatch"**

   - Verify the redirect URI in your provider matches exactly: `https://<project-ref>.supabase.co/auth/v1/callback`
   - Check for trailing slashes or protocol mismatches

2. **"Invalid client credentials"**

   - Double-check Client ID and Client Secret are correct
   - Ensure no extra spaces when copying

3. **Apple Sign In not working**

   - Verify your domain is verified in Apple Developer Portal
   - Check that the Services ID return URLs include your Supabase callback URL
   - Ensure the `.p8` key file is correctly formatted (no extra line breaks)

4. **Facebook "App not setup"**

   - Complete the Facebook Login setup wizard
   - Add test users if your app is in development mode
   - Verify App Domains are configured

5. **Twitter "Forbidden"**
   - Check that your app has the correct permissions
   - Verify callback URI is set correctly
   - Ensure you've applied for elevated access if needed

### Getting Your Supabase Project Reference

Your project reference is in your Supabase dashboard URL:

- URL format: `https://supabase.com/dashboard/project/<project-ref>`
- The `<project-ref>` is what you need for redirect URIs

---

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment-specific apps** (development vs production)
3. **Regularly rotate** OAuth credentials
4. **Monitor OAuth usage** in provider dashboards
5. **Set up rate limiting** if needed
6. **Review OAuth scopes** - only request what you need

---

## Next Steps

After setting up SSO:

1. Test all enabled providers
2. Update your privacy policy to mention OAuth providers
3. Consider adding provider-specific profile picture imports
4. Monitor authentication logs in Supabase Dashboard
5. Set up email notifications for new sign-ups (optional)

---

## Support

For issues specific to:

- **Supabase OAuth**: Check [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- **Provider-specific issues**: Check each provider's developer documentation
- **App issues**: Check the app logs and Supabase Dashboard > Authentication > Logs
