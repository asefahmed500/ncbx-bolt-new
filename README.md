# NCBX Website Builder

A modern, production-ready website builder with real Supabase authentication, drag-and-drop editing, and beautiful UI.

## 🚀 Features

- **Real Authentication**: Supabase auth with email/password and Google OAuth
- **Drag & Drop Editor**: Intuitive website building interface
- **Template Gallery**: Professional templates for different industries
- **Responsive Design**: Mobile-first approach with device previews
- **Real-time Collaboration**: Built for team editing
- **Database Integration**: PostgreSQL with Row Level Security
- **Stripe Integration**: Subscription plans and premium templates
- **Custom Domains**: Connect your own domain to your website
- **Version History**: Track changes and restore previous versions
- **Analytics**: Track website performance and visitor data

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn UI + Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **State Management**: Zustand
- **Payments**: Stripe
- **Animations**: Framer Motion
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
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_APP_URL=http://localhost:5173
VITE_DEFAULT_DOMAIN=ncbx.app
```

### 3. Database Setup
- Copy the migrations from `supabase/migrations/` folder
- Run them in your Supabase SQL Editor

### 4. Stripe Setup
Follow the instructions in `README_STRIPE_SETUP.md` to configure Stripe products and webhooks.

### 5. Run Development Server
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

### Main Tables:
- **profiles**: User information, plans, preferences
- **websites**: Website data, status, templates
- **website_versions**: Version control for website content
- **website_collaborators**: Collaboration permissions
- **subscriptions**: User subscription data
- **premium_templates**: Premium template information
- **template_purchases**: Template purchase records
- **website_analytics**: Website performance data

### Security:
- Row Level Security (RLS) enabled on all tables
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

The application is ready for deployment to:
- Netlify
- Vercel
- Any static hosting provider

## 🔒 Authentication

The application uses Supabase Authentication with:
- Email/Password signup with optional verification
- Google OAuth integration
- JWT token management
- Secure password reset flow

## 💳 Subscription Plans

| Plan | Monthly | Yearly | Features |
|------|---------|--------|----------|
| Free | $0 | $0 | 1 website, basic templates, subdomain hosting |
| Pro | $12/month | $120/year | Unlimited websites, premium templates, custom domains |
| Business | $39/month | $390/year | Everything in Pro + white-label, API access, 24/7 support |

## 🧩 Premium Templates

Premium templates are available for purchase individually or included with Pro/Business plans.

## 🌐 Custom Domains

Users can connect custom domains to their websites:
1. Enter domain in the domain settings
2. Configure DNS records (A and CNAME)
3. Wait for DNS propagation
4. SSL certificate is automatically provisioned

## 📝 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgements

- [Supabase](https://supabase.com) for backend services
- [Shadcn UI](https://ui.shadcn.com) for UI components
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Lucide Icons](https://lucide.dev) for beautiful icons
- [Stripe](https://stripe.com) for payment processing