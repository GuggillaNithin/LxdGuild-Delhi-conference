# Social Media Direct Posting Setup Guide

This application supports direct posting to social media platforms when users connect their accounts. Here's how to set up each platform:

## Prerequisites

You need to add the following secrets to your Lovable Cloud backend:

<lov-actions>
  <lov-open-backend>View Backend</lov-open-backend>
</lov-actions>

## LinkedIn Setup (Priority Platform)

### 1. Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click "Create App"
3. Fill in app details:
   - App name: Your App Name
   - LinkedIn Page: Select your company page
   - Privacy Policy URL: Your privacy policy
   - App logo: Upload your logo

### 2. Configure OAuth

1. In your app settings, go to "Auth" tab
2. Add redirect URL: `https://your-domain.com/api/linkedin-oauth`
3. Request these scopes:
   - `openid`
   - `profile`
   - `email`
   - `w_member_social` (to post on behalf of user)

### 3. Add Secrets

Add these secrets in your backend:
- `LINKEDIN_CLIENT_ID`: Your app's Client ID
- `LINKEDIN_CLIENT_SECRET`: Your app's Client Secret
- `LINKEDIN_REDIRECT_URI`: Your redirect URL

### 4. How It Works

When users click "Connect LinkedIn":
1. They're redirected to LinkedIn OAuth consent screen
2. After approval, LinkedIn redirects back with an auth code
3. Backend exchanges code for access token
4. Token is stored securely in `social_connections` table
5. When sharing, backend uses token to:
   - Upload image to LinkedIn Assets API
   - Create UGC post with image and caption

## Twitter/X Setup

### 1. Create X Developer Account

1. Go to [X Developer Portal](https://developer.twitter.com/)
2. Apply for elevated access if needed
3. Create a new app

### 2. Configure OAuth 2.0

1. Enable OAuth 2.0 in app settings
2. Add callback URL: `https://your-domain.com/api/twitter-oauth`
3. Request scopes:
   - `tweet.read`
   - `tweet.write`
   - `users.read`

### 3. Add Secrets

- `TWITTER_CLIENT_ID`: Your app's Client ID
- `TWITTER_CLIENT_SECRET`: Your Client Secret
- `TWITTER_REDIRECT_URI`: Your redirect URL

## Facebook Setup

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (Business type)
3. Add "Facebook Login" product

### 2. Configure OAuth

1. Add redirect URI in Facebook Login settings
2. Request these permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`

### 3. Add Secrets

- `FACEBOOK_APP_ID`: Your app ID
- `FACEBOOK_APP_SECRET`: Your app secret
- `FACEBOOK_REDIRECT_URI`: Your redirect URL

## WhatsApp Business Setup (Optional)

For programmatic WhatsApp posting (business accounts only):

### 1. WhatsApp Business API

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Set up WhatsApp Business API
3. Get your phone number verified

### 2. Add Secrets

- `WHATSAPP_BUSINESS_ID`: Your business account ID
- `WHATSAPP_ACCESS_TOKEN`: Access token
- `WHATSAPP_PHONE_ID`: Your phone number ID

**Note**: Personal WhatsApp accounts cannot post programmatically. The app falls back to Web Share API on mobile for personal accounts.

## Platform-Specific Limitations

### LinkedIn
- ✅ Direct image + text posting
- ✅ Access tokens last 60 days (refresh tokens extend this)
- ✅ Best platform for professional content

### Twitter/X
- ✅ Direct image + text posting
- ⚠️ Rate limits apply (based on account tier)
- ⚠️ Free tier has limited functionality

### Facebook
- ✅ Direct image + text posting
- ⚠️ Requires page management permissions
- ⚠️ Posts to pages, not personal profiles (API restriction)

### WhatsApp Business
- ✅ Can send media messages
- ❌ Only for business accounts
- ❌ Personal accounts use Web Share fallback

### Instagram
- ⚠️ Instagram Graph API has strict limitations
- ⚠️ Requires business/creator accounts
- ⚠️ Cannot directly post from third-party apps (API restriction)

## Fallback Behavior

When users haven't connected accounts:

1. **Mobile devices**: Uses Web Share API with actual File object
   - Shares poster image + caption directly to native apps
   
2. **Desktop**: 
   - Auto-downloads poster image
   - Copies caption to clipboard
   - Opens platform's share dialog with link to public share page
   - Share page has proper OG tags for image preview

## Testing OAuth Flows

1. Add test secrets to your backend
2. Click "Connect [Platform]" in the app
3. Complete OAuth consent on the platform
4. Verify connection shows as "Connected" with green badge
5. Try posting a test poster
6. Check if post appears on the platform

## Security Notes

- All OAuth tokens are stored encrypted in Supabase
- Tokens have Row-Level Security (RLS) policies
- Users can only access their own tokens
- Refresh tokens are used to extend access when possible
- Never expose Client Secrets in frontend code

## Troubleshooting

### "Not connected" error
- Check if user completed OAuth flow
- Verify secrets are set correctly in backend
- Check token hasn't expired

### "Failed to upload image"
- Verify platform API credentials
- Check image size limits (LinkedIn: 10MB, Twitter: 5MB)
- Ensure image format is supported (PNG, JPG)

### OAuth redirect errors
- Verify redirect URLs match exactly in platform settings
- Check if app is in production mode (not sandbox)
- Ensure all required scopes are requested
