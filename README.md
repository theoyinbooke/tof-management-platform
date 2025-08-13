# TheOyinbooke Foundation Management Platform

A comprehensive educational foundation management system built for supporting students across Nigerian educational institutions from Nursery through University levels.

## 🎯 Overview

The TOF Management Platform is a modern web application designed to streamline the operations of TheOyinbooke Foundation, enabling efficient management of beneficiaries, academic progress tracking, financial operations, and communication systems.

## ✨ Key Features

### 📊 **Financial Management**
- **Payment Tracking**: Monitor beneficiary payments and financial support
- **Invoice Generation**: Create and manage invoices for school fees, books, and expenses
- **Budget Management**: Plan and monitor foundation budgets with approval workflows
- **Multi-currency Support**: Handle both NGN and USD transactions

### 🎓 **Academic Progress Tracking**
- **Performance Recording**: Track grades, subjects, and academic achievements
- **Session Management**: Manage academic sessions across different educational levels
- **Nigerian Education Context**: Support for Nursery → Primary → Secondary → University progression
- **Progress Analytics**: Visual dashboards showing academic performance trends

### 📅 **Attendance Monitoring**
- **Session Attendance**: Record and track attendance for programs and sessions
- **Attendance Analytics**: Monitor attendance rates and identify at-risk students
- **Alert System**: Automatic alerts for poor attendance (below 75%)

### 🚨 **Academic Alerts & Notifications**
- **Performance Alerts**: Automated alerts for students with grades below 60%
- **Intervention Alerts**: Flag students requiring academic support
- **Real-time Monitoring**: Proactive identification of at-risk beneficiaries
- **Alert Management**: Workflow for acknowledging, tracking, and resolving alerts

### 👥 **User Management**
- **Role-based Access**: Super Admin, Admin, Reviewer, Beneficiary, Guardian roles
- **Multi-foundation Support**: Architecture supporting multiple foundations
- **Authentication**: Secure authentication with Clerk integration

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Convex real-time subscriptions
- **Forms**: React Hook Form + Zod validation

### Backend
- **Database**: Convex (real-time, TypeScript-first)
- **Authentication**: Clerk + Convex integration
- **File Storage**: Convex built-in storage
- **Real-time**: Convex subscriptions
- **API**: Convex functions (queries/mutations)

### Deployment
- **Frontend**: Vercel (automatic deployments)
- **Backend**: Convex Cloud (automatic scaling)
- **CDN**: Vercel Edge Network

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Convex CLI
- Clerk account

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/theoyinbooke/tof-management-platform.git
   cd tof-management-platform
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   Fill in your Convex and Clerk credentials.

4. **Initialize Convex**
   \`\`\`bash
   npx convex dev
   \`\`\`

5. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines and architecture decisions
- **[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)** - Complete design system and UI guidelines
- **[specifications.md](./specifications.md)** - Detailed technical specifications (38,000+ tokens)

## 🏗 Architecture

### Database Schema
- **30+ interconnected tables** supporting comprehensive foundation management
- **Multi-foundation architecture** with proper data isolation
- **Audit logging** for compliance and tracking
- **Real-time subscriptions** for live updates

### Key Components
- **Dashboard Systems**: Role-specific dashboards for all user types
- **Financial Management**: Complete invoicing, payment, and budget systems
- **Academic Tracking**: Grade recording, session management, performance analytics
- **Alert Systems**: Automated monitoring and intervention workflows

## 🌍 Nigerian Educational Context

The platform is specifically designed for the Nigerian educational system:

- **Academic Levels**: Nursery (1-2) → Primary (1-6) → Secondary (JSS 1-3, SSS 1-3) → University (Year 1-5)
- **Academic Calendar**: September to July with 3 terms
- **Grade Classifications**: First Class, Second Class Upper/Lower, Third Class, Pass, Distinction, Merit, Credit
- **Phone Validation**: Nigerian phone number formats (+234, 070x, 080x, 081x, 090x)
- **Currency**: Primary NGN, secondary USD support
- **Examination Integration**: WAEC, JAMB, NECO considerations

## 📱 Mobile-First Design

- **Responsive UI**: Optimized for mobile devices with varying connectivity
- **Touch-friendly**: 44px minimum tap targets
- **Progressive Web App**: Offline capabilities where possible
- **Performance**: Optimized for 2G/3G networks

## 🔐 Security & Compliance

- **Role-based Access Control**: Granular permissions system
- **Audit Logging**: Complete tracking of all user actions
- **Data Validation**: Comprehensive input validation and sanitization
- **Authentication**: Secure authentication with Clerk
- **GDPR Compliance**: Privacy-focused data handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.ai/code)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database and backend by [Convex](https://convex.dev/)
- Authentication by [Clerk](https://clerk.com/)

## 📞 Support

For support and questions, please contact:
- **Email**: tech@theoyinbooke.org
- **Website**: [theoyinbooke.org](https://theoyinbooke.org)

---

**TheOyinbooke Foundation** - Empowering education, transforming lives 🎓✨
