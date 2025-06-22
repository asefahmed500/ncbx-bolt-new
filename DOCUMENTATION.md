# NCBX Website Builder - Complete Documentation

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [User Guide](#user-guide)
4. [Admin Guide](#admin-guide)
5. [Technical Implementation](#technical-implementation)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

NCBX Website Builder is a modern, full-stack web application that allows users to create professional websites using a drag-and-drop interface. Built with React, TypeScript, and Supabase, it provides a complete solution for website creation, management, and deployment.

### Key Features:
- **Authentication System**: Email/password and Google OAuth
- **Visual Editor**: Drag-and-drop website building
- **Template Library**: Pre-designed professional templates
- **Responsive Design**: Mobile-first approach
- **Real Database**: PostgreSQL with Supabase
- **Security**: Row Level Security (RLS)
- **Performance**: Optimized for production use

---

## 🏗️ Architecture

### Frontend Architecture:
```
src/
├── components/          # React components
│   ├── Auth/           # Authentication pages
│   ├── Dashboard/      # User dashboard
│   ├── Editor/         # Website editor
│   ├── Landing/        # Landing page
│   ├── Layout/         # Layout components
│   └── Templates/      # Template gallery
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication logic
│   └── useWebsites.ts  # Website CRUD operations
├── lib/                # Utilities and configurations
│   └── supabase.ts     # Supabase client setup
└── store/              # State management
    └── useAppStore.ts  # Global app state
```

### Backend Architecture:
```
Supabase Services:
├── Database (PostgreSQL)
│   ├── profiles table
│   ├── websites table
│   └── RLS policies
├── Authentication
│   ├── Email/Password
│   ├── Google OAuth
│   └── JWT tokens
└── Real-time (WebSockets)
    └── Live collaboration
```

---

## 👤 User Guide

### Getting Started

#### 1. Account Creation
- Visit the website and click "Get Started"
- Choose between email/password or Google OAuth
- Verify your email (if using email signup)
- Complete your profile setup

#### 2. Dashboard Overview
After logging in, you'll see your dashboard with:
- **Website Statistics**: Total websites, published, drafts
- **Website Grid**: All your created websites
- **Search & Filter**: Find specific websites
- **Quick Actions**: Create new website, browse templates

#### 3. Creating Your First Website

**Step 1: Choose a Template**
- Click "Create Website" or "Browse Templates"
- Filter by category (Business, Portfolio, E-commerce, etc.)
- Preview templates and read descriptions
- Click "Use This Template"

**Step 2: Customize Your Website**
- **Canvas**: Main editing area where you build
- **Component Library**: Drag elements (text, images, buttons)
- **Properties Panel**: Customize selected elements
- **Device Preview**: Switch between desktop, tablet, mobile

**Step 3: Edit Content**
- Click any element to select it
- Use the Properties Panel to modify:
  - **Content Tab**: Edit text, links, images
  - **Style Tab**: Colors, fonts, spacing
  - **Layout Tab**: Position, size, alignment
  - **Advanced Tab**: Custom CSS, visibility

**Step 4: Preview and Publish**
- Click "Preview" to test your website
- Check all device sizes (desktop, tablet, mobile)
- Click "Publish" when ready to go live
- Set up custom domain (optional)

### Managing Websites

#### Website Actions:
- **Edit**: Open in the visual editor
- **Duplicate**: Create a copy of existing website
- **Delete**: Permanently remove website
- **View**: Open published website in new tab

#### Website Status:
- **Draft**: Work in progress, not public
- **Published**: Live and accessible to visitors

### Account Management

#### Profile Settings:
- Update name and email
- Change profile picture
- Manage account preferences

#### Plan Management:
- **Free Plan**: 1 website, basic templates
- **Pro Plan**: Unlimited websites, premium templates
- **Business Plan**: Advanced features, white-label

---

## 👨‍💼 Admin Guide

### User Management

#### Monitoring Users:
```sql
-- View all users and their plans
SELECT 
  p.email,
  p.full_name,
  p.plan,
  p.created_at,
  COUNT(w.id) as website_count
FROM profiles p
LEFT JOIN websites w ON p.id = w.user_id
GROUP BY p.id, p.email, p.full_name, p.plan, p.created_at
ORDER BY p.created_at DESC;
```

#### User Statistics:
- Total registered users
- Active users (last 30 days)
- Plan distribution (free vs paid)
- Website creation trends

### Content Management

#### Template Management:
- Add new templates to the gallery
- Update existing template previews
- Categorize templates properly
- Monitor template usage statistics

#### Website Monitoring:
```sql
-- View website statistics
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM websites
GROUP BY status;
```

### System Administration

#### Database Maintenance:
- Monitor database performance
- Backup user data regularly
- Clean up unused assets
- Optimize query performance

#### Security Monitoring:
- Review authentication logs
- Monitor failed login attempts
- Check for suspicious activity
- Update security policies

### Support Operations

#### Common User Issues:
1. **Login Problems**: Check email verification, password reset
2. **Template Issues**: Verify template data integrity
3. **Publishing Errors**: Check domain configuration
4. **Performance Issues**: Monitor server resources

#### Support Tools:
- User activity logs
- Error tracking and monitoring
- Performance metrics dashboard
- Customer support ticketing system

---

## 🔧 Technical Implementation

### Authentication Flow

```typescript
// Authentication hook usage
const { signUp, signIn, signOut, user, loading } = useAuth();

// Sign up new user
const result = await signUp(email, password, fullName);
if (result.success) {
  // User created successfully
}

// Sign in existing user
const result = await signIn(email, password);
if (result.success) {
  // User authenticated
}
```

### Database Operations

```typescript
// Website CRUD operations
const { websites, createWebsite, updateWebsite, deleteWebsite } = useWebsites();

// Create new website
const newWebsite = await createWebsite({
  name: "My Website",
  description: "A great website",
  template: "Modern Business"
});

// Update website
await updateWebsite(websiteId, {
  name: "Updated Name",
  status: "published"
});
```

### State Management

```typescript
// Global app state
const { 
  user, 
  currentView, 
  setCurrentView,
  currentWebsite,
  setCurrentWebsite 
} = useAppStore();

// Navigation
setCurrentView('dashboard'); // Navigate to dashboard
setCurrentView('editor');    // Navigate to editor
```

### Component Architecture

```typescript
// Component structure
const Dashboard: React.FC = () => {
  const { websites, loading, error } = useWebsites();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <StatsCards websites={websites} />
      <WebsiteGrid websites={websites} />
    </div>
  );
};
```

---

## 📡 API Reference

### Supabase Tables

#### Profiles Table
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  plan user_plan DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Websites Table
```sql
CREATE TABLE websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  domain text UNIQUE,
  status website_status DEFAULT 'draft',
  template text NOT NULL,
  thumbnail text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Row Level Security Policies

```sql
-- Users can only access their own data
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read own websites"
  ON websites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### Environment Variables

```env
# Required
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional (for Google OAuth)
# Configured in Supabase dashboard
```

---

## 🔍 Troubleshooting

### Common Issues

#### Authentication Problems

**Issue**: "User not authenticated"
**Solution**: 
- Check if user session is valid
- Verify JWT token hasn't expired
- Ensure RLS policies are correct

**Issue**: Google OAuth not working
**Solution**:
- Verify redirect URLs in Google Console
- Check Supabase OAuth configuration
- Ensure HTTPS in production

#### Database Issues

**Issue**: "Permission denied for table"
**Solution**:
- Check RLS policies are enabled
- Verify user has correct permissions
- Review policy conditions

**Issue**: "Duplicate key violation"
**Solution**:
- Handle race conditions in profile creation
- Use proper error handling
- Implement retry logic

#### Performance Issues

**Issue**: Slow page loading
**Solution**:
- Optimize database queries
- Implement proper caching
- Use lazy loading for components

**Issue**: Large bundle size
**Solution**:
- Implement code splitting
- Remove unused dependencies
- Optimize images and assets

### Debugging Tools

#### Browser Console
```javascript
// Check authentication state
console.log('User:', supabase.auth.getUser());

// Check database connection
console.log('Supabase client:', supabase);

// Monitor network requests
// Open Network tab in DevTools
```

#### Database Debugging
```sql
-- Check user permissions
SELECT * FROM auth.users WHERE email = 'user@example.com';

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'websites';

-- Monitor query performance
EXPLAIN ANALYZE SELECT * FROM websites WHERE user_id = 'user-id';
```

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| PGRST116 | No rows returned | Use `maybeSingle()` instead of `single()` |
| 23505 | Duplicate key violation | Handle race conditions properly |
| 42501 | Permission denied | Check RLS policies |
| 401 | Unauthorized | Verify authentication token |

---

## 📞 Support

### For Users:
- **Help Center**: In-app help documentation
- **Email Support**: support@ncbx.com
- **Community Forum**: community.ncbx.com

### For Developers:
- **Technical Documentation**: docs.ncbx.com
- **API Reference**: api.ncbx.com
- **GitHub Issues**: github.com/ncbx/website-builder

### For Administrators:
- **Admin Dashboard**: admin.ncbx.com
- **System Status**: status.ncbx.com
- **Emergency Contact**: emergency@ncbx.com

---

*Last updated: December 2024*