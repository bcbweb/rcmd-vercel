# Setting Up Instagram Integration via Facebook

## Overview

Meta (Facebook) now requires using the Facebook Login system to access Instagram data. The Instagram Basic Display API is accessed through Facebook's developer platform.

## Step 1: Create a Facebook Developer App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Log in with your Facebook account
3. Click "My Apps" in the top menu
4. Click "Create App"
5. Select "Consumer" as the app type
6. Fill in your app name and contact email
7. Complete the security check if prompted

## Step 2: Configure Facebook Login

1. Once your app is created, click "Add Product" in the left sidebar
2. Find "Facebook Login" and click "Set Up"
3. In the settings for Facebook Login:
   - Add `http://localhost:3000/api/auth/callback/instagram` as a Valid OAuth Redirect URI (for local development)
   - Add your production URL when ready: `https://yourdomain.com/api/auth/callback/instagram`
   - Save changes

## Step 3: Configure Application Settings

1. Go to "App Settings" > "Basic" in the left sidebar
2. Note your App ID and App Secret - these will be used in your .env.local file:
   - App ID → `FACEBOOK_CLIENT_ID` and `NEXT_PUBLIC_FACEBOOK_CLIENT_ID`
   - App Secret → `FACEBOOK_CLIENT_SECRET`
3. Save these credentials in your `.env.local` file

## Step 4: Request Advanced Access

For full functionality, you will need advanced access for public_profile permissions:

1. Go to "App Review" > "Permissions and Features"
2. Find "public_profile" and click "Request"
3. Complete the required information about how your app uses this permission
4. Submit for review

## Step 5: Connect Instagram to Facebook

For testing with your own Instagram account:

1. Go to "Instagram Basic Display" in the left sidebar (under Products)
2. Click "Basic Display"
3. Under "User Token Generator", click "Add or Remove Instagram Testers"
4. Enter your Instagram username and click "Submit"
5. Open Instagram and accept the tester invitation in your settings

## Step 6: Enable Instagram Graph API (Optional)

If you want to access more Instagram features:

1. Create a Facebook Page (if you don't have one already)
2. Link your Instagram Business/Creator account to your Facebook Page
3. Enable "Instagram Graph API" from your app dashboard
4. This will allow access to additional Instagram features beyond basic profile data

## Understanding The Integration

The integration works by:

1. Using Facebook Login to authenticate users
2. Retrieving the user's Facebook profile
3. Checking if the user has any Instagram business accounts connected
4. Storing the integration information in our database

If a user doesn't have an Instagram business account connected to Facebook, we'll fall back to using their Facebook profile information.

## Troubleshooting

- If you see "Facebook Login requires advanced access" - you need to request advanced access in the App Review section
- Check that your redirect URIs match exactly (including https/http)
- For local testing, you might need to use a service like ngrok to provide a publicly accessible URL

## References

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api/)
