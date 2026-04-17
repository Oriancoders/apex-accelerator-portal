# Salesforce Connected App Setup

Use this guide to configure the Netinshell Salesforce OAuth integration.

## 1. Open App Manager
1. Log in to your Salesforce developer org.
2. Open Setup.
3. Search for App Manager in Quick Find.
4. Open App Manager and click New Connected App.

## 2. Create Connected App
1. App Name: Netinshell
2. Contact Email: your team email
3. Enable OAuth Settings: checked
4. Callback URL(s):
   - http://localhost:5173/oauth/callback
   - your production callback URL when available
5. Selected OAuth Scopes:
   - api
   - refresh_token
   - offline_access
6. Require Secret for Web Server Flow: enabled
7. Save the app.

## 3. Wait for Propagation
After saving, Salesforce can take 2 to 10 minutes before the app is ready for OAuth.

## 4. Collect Credentials
1. Open the connected app details.
2. Copy Consumer Key to:
   - VITE_SF_CLIENT_ID (frontend)
   - SF_CLIENT_ID (backend)
3. Copy Consumer Secret to:
   - SF_CLIENT_SECRET (backend only)

## 5. Configure Environment Variables
Ensure these are set:

- Frontend:
  - VITE_SF_CLIENT_ID
  - VITE_SF_REDIRECT_URI
- Backend:
  - SF_CLIENT_ID
  - SF_CLIENT_SECRET
  - SF_REDIRECT_URI
  - SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY

## 6. Important Notes
- Callback URL must exactly match VITE_SF_REDIRECT_URI.
- Do not place SF_CLIENT_SECRET in any frontend file.
- Use test.salesforce.com for sandbox OAuth.
- Production org URLs (login.salesforce.com) must remain blocked.
