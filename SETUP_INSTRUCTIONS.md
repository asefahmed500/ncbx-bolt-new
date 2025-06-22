# 🔧 Supabase Setup Instructions

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project: https://cwmbltxelhnavxafkgld.supabase.co
2. Go to **Settings** → **API**
3. Copy your **Project URL** and **anon public key**

## Step 2: Update Environment Variables

Update your `.env` file with your actual Supabase anon key:

```env
VITE_SUPABASE_URL=https://cwmbltxelhnavxafkgld.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

## Step 3: Run Database Migration

1. Go to your Supabase dashboard
2. Click on **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250622184326_cold_sun.sql`
4. Click **Run** to create the database schema

## Step 4: Configure Google OAuth

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Find **Google** and click **Enable**
3. Add these redirect URLs:
   - `https://cwmbltxelhnavxafkgld.supabase.co/auth/v1/callback`
   - `http://localhost:5173` (for development)

### Google Cloud Console Setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set **Application type** to **Web application**
6. Add **Authorized redirect URIs**:
   - `https://cwmbltxelhnavxafkgld.supabase.co/auth/v1/callback`
7. Copy **Client ID** and **Client Secret**
8. Paste them in your Supabase Google provider settings

## Step 5: Test Authentication

1. Restart your development server: `npm run dev`
2. Try signing up with email/password
3. Try signing in with Google

## Troubleshooting

### "refused to connect" Error
- Make sure your `.env` file has the correct Supabase URL
- Restart your development server after updating `.env`
- Check that your Supabase project is active

### Google OAuth Not Working
- Verify redirect URLs match exactly
- Make sure Google OAuth is enabled in Supabase
- Check browser console for specific error messages

### Database Errors
- Run the migration script in Supabase SQL Editor
- Check that RLS policies are properly set up
- Verify your anon key has the correct permissions

## Need Help?

Check the browser console for specific error messages and verify:
1. Environment variables are correct
2. Database migration has been run
3. Google OAuth is properly configured
4. Supabase project is active and accessible