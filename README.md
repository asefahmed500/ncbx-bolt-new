# NCBX Website Builder

A modern, production-ready website builder with real Supabase authentication, drag-and-drop editing, and beautiful UI.

## 🚀 Features

- **Real Authentication**: Supabase auth with email/password and Google OAuth
- **Drag & Drop Editor**: Intuitive website building interface
- **Template Gallery**: Professional templates for different industries
- **Responsive Design**: Mobile-first approach with device previews
- **Real-time Collaboration**: Built for team editing (UI ready)
- **Database Integration**: PostgreSQL with Row Level Security

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (Database, Auth, Real-time)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Icons**: Lucide React

## 📋 Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Go to Authentication > Providers and enable:
   - Email (enabled by default)
   - Google OAuth (optional but recommended)

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the migration file in your Supabase SQL editor:
- Copy the contents of `supabase/migrations/001_initial_schema.sql`
- Paste and run in Supabase > SQL Editor

### 4. Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret to Supabase > Authentication > Providers > Google

### 5. Install and Run

```bash
npm install
npm run dev
```

## 🎯 User Flows

### Authentication Flow
1. **Sign Up**: Email/password or Google OAuth
2. **Email Verification**: Automatic profile creation
3. **Sign In**: Persistent sessions with auto-refresh
4. **Password Reset**: Email-based password recovery

### Website Building Flow
1. **Dashboard**: View all websites with stats
2. **Template Selection**: Choose from categorized templates
3. **Drag & Drop Editor**: Visual website building
4. **Device Preview**: Desktop, tablet, mobile views
5. **Publishing**: Deploy to custom domains

### Collaboration Flow (UI Ready)
- Real-time editing with live cursors
- Team member management
- Permission-based access control
- Version history and rollback

## 🔐 Security Features

- **Row Level Security**: Database-level access control
- **JWT Authentication**: Secure token-based auth
- **OAuth Integration**: Trusted third-party authentication
- **Input Validation**: Client and server-side validation
- **HTTPS Only**: Secure data transmission

## 📊 Database Schema

### Profiles Table
- User information and preferences
- Plan management (free, pro, business)
- Avatar and profile data

### Websites Table
- Website metadata and settings
- Status tracking (draft, published)
- Template and thumbnail references

## 🎨 Design System

- **Colors**: Blue primary, purple accent, semantic colors
- **Typography**: Inter font family with proper hierarchy
- **Spacing**: 8px grid system
- **Components**: Reusable, accessible components
- **Animations**: Smooth transitions and micro-interactions

## 🚀 Deployment

The app is ready for deployment to:
- **Netlify**: Static hosting with serverless functions
- **Vercel**: Edge functions and global CDN
- **Supabase**: Database and authentication hosting

## 📈 Performance

- **Code Splitting**: Lazy loading for optimal performance
- **Image Optimization**: Responsive images with proper sizing
- **Bundle Analysis**: Optimized build output
- **Caching**: Efficient data fetching and caching strategies

## 🔧 Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📝 Environment Variables

Required environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.