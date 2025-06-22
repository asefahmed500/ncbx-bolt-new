# 🚀 Complete Setup Guide

This guide will walk you through setting up the NCBX Website Builder from scratch.

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account
- Git installed
- Code editor (VS Code recommended)

## 🔧 Step-by-Step Setup

### 1. Project Setup

```bash
# Clone the repository
git clone <your-repository-url>
cd ncbx-website-builder

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 2. Supabase Configuration

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and enter project details
4. Wait for project to be created (2-3 minutes)

#### Get Project Credentials
1. Go to **Settings** → **API**
2. Copy your **Project URL**
3. Copy your **anon public** key
4. Update your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Setup

#### Run Migration
1. Go to your Supabase dashboard
2. Click **SQL Editor**
3. Copy the contents of `supabase/migrations/20250622192335_withered_mode.sql`
4. Paste into the SQL editor
5. Click **Run** to execute

#### Verify Tables Created
Check that these tables exist:
- `profiles`
- `websites`
- `auth.users` (built-in)

### 4. Authentication Setup

#### Enable Email Authentication
1. Go to **Authentication** → **Settings**
2. Ensure **Enable email confirmations** is OFF (for development)
3. Set **Site URL** to `http://localhost:5173`

#### Setup Google OAuth (Optional)

**Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set application type to **Web application**
6. Add authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
   - `http://localhost:5173` (for development)

**Supabase Configuration:**
1. Go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. Enter your Google **Client ID** and **Client Secret**
4. Save configuration

### 5. Development Server

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### 6. Test Authentication

#### Test Email Signup
1. Click "Get Started"
2. Switch to "Sign up"
3. Enter test email and password
4. Should create account and redirect to dashboard

#### Test Google OAuth
1. Click "Continue with Google"
2. Complete Google authentication
3. Should create profile and redirect to dashboard

### 7. Verify Database Integration

#### Check Profile Creation
1. Go to Supabase dashboard
2. Click **Table Editor** → **profiles**
3. Should see your test user profile

#### Test Website Creation
1. In the app, click "Create Website"
2. Choose a template
3. Should redirect to editor
4. Check **websites** table in Supabase

## 🔍 Troubleshooting

### Common Issues

#### "Supabase request failed"
- Check your `.env` file has correct URL and key
- Restart development server after changing `.env`
- Verify Supabase project is active

#### "Permission denied for table"
- Ensure migration was run successfully
- Check RLS policies are created
- Verify user is authenticated

#### Google OAuth not working
- Check redirect URLs match exactly
- Ensure Google OAuth is enabled in Supabase
- Verify Google Cloud Console configuration

#### Database connection errors
- Check Supabase project status
- Verify network connectivity
- Check browser console for specific errors

### Verification Checklist

- [ ] Environment variables set correctly
- [ ] Database migration completed
- [ ] Tables created with proper structure
- [ ] RLS policies enabled
- [ ] Email authentication working
- [ ] Google OAuth configured (optional)
- [ ] Development server running
- [ ] Can create user account
- [ ] Can create website
- [ ] Dashboard shows user data

## 🚀 Production Deployment

### Environment Setup
```env
# Production environment variables
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

### Build and Deploy
```bash
# Build for production
npm run build

# Deploy to your hosting provider
# (Netlify, Vercel, etc.)
```

### Production Checklist
- [ ] Environment variables updated for production
- [ ] Database migration run on production
- [ ] Google OAuth redirect URLs updated
- [ ] Site URL updated in Supabase
- [ ] SSL certificate configured
- [ ] Domain configured
- [ ] Performance testing completed

## 📞 Need Help?

If you encounter issues:

1. **Check the console** for error messages
2. **Review this guide** step by step
3. **Check Supabase logs** in the dashboard
4. **Verify environment variables** are correct
5. **Test database connection** manually

### Support Resources
- **Documentation**: See `DOCUMENTATION.md`
- **GitHub Issues**: Report bugs and issues
- **Community**: Join our Discord/Slack
- **Email**: technical-support@ncbx.com

---

*Setup complete! You now have a fully functional website builder.* 🎉