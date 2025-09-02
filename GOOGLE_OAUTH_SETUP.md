# Google OAuth Setup Guide

## 📋 Steps to Set Up Google OAuth

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create a New Project (or Select Existing)
- Click on the project dropdown at the top
- Click "New Project"
- Name it: "Sensay Chatbot App"
- Click "Create"

### 3. Enable Google+ API
- In the left sidebar, go to "APIs & Services" > "Library"
- Search for "Google+ API" or "Google Identity"
- Click on it and press "Enable"

### 4. Create OAuth 2.0 Credentials
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth client ID"
- If prompted, configure the OAuth consent screen first:
  - Choose "External" for user type
  - Fill in the required fields:
    - App name: "Sensay Chatbot"
    - User support email: Your email
    - Developer contact: Your email
  - Add scopes: email, profile, openid
  - Add test users if in development

### 5. Create OAuth Client ID
- Application type: "Web application"
- Name: "Sensay Chatbot Web Client"
- Authorized JavaScript origins:
  ```
  http://localhost:3000
  http://localhost:3001
  ```
- Authorized redirect URIs:
  ```
  http://localhost:3000/api/auth/callback/google
  http://localhost:3001/api/auth/callback/google
  ```
- Click "Create"

### 6. Copy Credentials
You'll receive:
- Client ID: `xxxxxxxxxxxx.apps.googleusercontent.com`
- Client Secret: `GOCSPX-xxxxxxxxxxxx`

### 7. Update .env.local
Replace the placeholders in your `.env.local` file:
```env
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

### 8. Generate NextAuth Secret
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

Update in `.env.local`:
```env
NEXTAUTH_SECRET=generated-secret-here
```

## 🚀 Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000 (or 3001)

3. Click "Sign in with Google"

4. Select your Google account

5. You should be redirected to the chat interface

## 🔒 Production Setup

For production, update:
- Authorized origins: Add your production domain
- Authorized redirect URIs: Add `https://yourdomain.com/api/auth/callback/google`
- Update `NEXTAUTH_URL` in environment variables

## ⚠️ Important Notes

- Keep your Client Secret secure
- Never commit credentials to Git
- Use environment variables for all sensitive data
- Enable 2FA on your Google account for security

## 🐛 Troubleshooting

### "Redirect URI mismatch" error
- Ensure the redirect URI exactly matches what's in Google Console
- Check if you're using http vs https
- Verify the port number (3000 or 3001)

### "Access blocked" error
- Make sure the OAuth consent screen is configured
- Add your email to test users if in development mode

### Session not persisting
- Check that `NEXTAUTH_SECRET` is set correctly
- Verify cookies are enabled in your browser