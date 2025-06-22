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

## 📋 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd ncbx-website-builder
npm install
```

### 2. Environment Setup
Create a `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
- Copy the migration from `supabase/migrations/` folder
- Run it in your Supabase SQL Editor

### 4. Run Development Server
```bash
npm run dev
```

## 🎯 User Journey

### For End Users:
1. **Sign Up/Login** → Create account or sign in
2. **Choose Template** → Browse and select from professional templates
3. **Customize** → Use drag-and-drop editor to build your website
4. **Preview** → Test on desktop, tablet, and mobile
5. **Publish** → Deploy your website with custom domain

### For Administrators:
1. **User Management** → Monitor user accounts and plans
2. **Template Management** → Add/update website templates
3. **Analytics** → Track usage and performance metrics
4. **Support** → Help users with technical issues

## 📊 Database Schema

### Tables:
- **profiles**: User information, plans, preferences
- **websites**: Website data, status, templates
- **auth.users**: Supabase authentication (built-in)

### Security:
- Row Level Security (RLS) enabled
- Users can only access their own data
- JWT-based authentication

## 🔧 Development

```bash
# Development
npm run dev

# Build
npm run build

# Preview
npm run preview

# Lint
npm run lint
```

## 🚀 Deployment

Ready for deployment to:
- Netlify
- Vercel
- Any static hosting provider

## 📝 License

MIT License - see LICENSE file for details.