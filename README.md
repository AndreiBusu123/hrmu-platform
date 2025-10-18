# HRMU Platform - Labor Management System

A modern, comprehensive labor management platform built for HRMU to replace scaflog.io. Features job management, workforce tracking, invoicing, and mobile clock-in/out capabilities.

## 🚀 Technology Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Firebase (Firestore, Auth, Storage, Realtime DB)
- **Hosting**: Vercel

## 📋 Current Features (Phase 1 - Foundation)

- ✅ Next.js 14 project structure
- ✅ Firebase integration (Firestore, Auth, Storage, Realtime DB)
- ✅ TypeScript type definitions for all data models
- ✅ Authentication system with role-based access
- ✅ Protected routes and permission system
- ✅ shadcn/ui component library
- ✅ Comprehensive database schema

## 🗄️ Data Models

The platform includes complete TypeScript definitions for:
- Users & Authentication (5 role types)
- Clients with multiple contact types
- Jobs (40+ fields matching scaflog.io requirements)
- Activities (5 types: Alterations, Day Labour, Delivery, Dismantle Dayworks, Dismantle Scaffold)
- Invoices with automated reminders
- Timesheets with GPS tracking
- Form submissions
- Location tracking with breadcrumbs

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- Firebase account
- Git

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/AndreiBusu123/hrmu-platform.git
cd hrmu-platform
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Add your Firebase configuration to \`.env.local\`

5. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

\`\`\`
src/
├── app/                  # Next.js app router pages
│   ├── dashboard/        # Dashboard pages
│   └── login/            # Authentication
├── components/           # React components
│   ├── auth/             # Auth components
│   └── ui/               # shadcn/ui components
├── contexts/             # React contexts (AuthContext)
├── lib/
│   └── firebase/         # Firebase configuration
├── types/                # TypeScript definitions
└── hooks/                # Custom hooks
\`\`\`

## 🔐 User Roles

| Role | Access | Permissions |
|------|--------|-------------|
| Owner | All dashboards | Full access |
| Field Manager | Site Manager | Job/activity management |
| Sales | Sales/Marketing | Quotes, clients, invoices |
| Worker | Mobile only | Timesheets, forms |
| Admin | Site Manager | User/settings management |

## 🚀 Roadmap

### Phase 2: Core Features (Weeks 2-9)
- Jobs module with all fields
- Activities management
- Basic invoicing
- Calendar views
- Pipeline kanban board

### Phase 3: Mobile & Tracking (Weeks 10-16)
- Native iOS/Android apps
- Clock-in/out with GPS
- Location breadcrumbs
- Live tracking dashboard

### Phase 4: Advanced (Weeks 17-24)
- Sales/CRM dashboard
- Calendar integrations
- Advanced automation
- Analytics & reporting

## 📖 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 📄 License

Private - HRMU Proprietary

---

**Repository**: https://github.com/AndreiBusu123/hrmu-platform
Built for HRMU Labor Management
