# Craftd - Career Tracking Application

A comprehensive, full-stack career tracking application built with React Router, designed to help job seekers manage and analyze their job search journey with powerful insights and analytics.

## 🎯 Key Features

### 📊 **Job Applications Dashboard**
- **Real-time Analytics**: Comprehensive metrics with performance insights
- **Application Progress Visualization**: Unified funnel and status breakdown charts
- **Performance Metrics**: Response rates, interview rates, and timing analytics
- **Search & Filter**: Instant search across positions and companies
- **Interactive Charts**: Visual progress bars and status distributions

### 📝 **Application Management**
- **Complete CRUD Operations**: Create, read, update, delete job applications
- **Status Tracking**: Track applications through multiple stages (Applied, Phone Screen, Interview, Final Round, Offer, Accepted, Rejected, Withdrawn)
- **Company Integration**: Automatic company creation and management
- **Application Details**: Position, location, job posting links, salary information
- **Timeline Tracking**: Application stages with timestamps

### 💰 **Salary Insights**
- **Salary Tracking**: Track quoted, offered, and accepted salaries
- **Negotiation Analytics**: Success rates and average increases
- **Compensation Trends**: Historical salary data and insights
- **Offer Analysis**: Compare offers across companies and positions

### 📈 **Advanced Analytics**
- **Timing Metrics**: 
  - Average time to response
  - Average time to offer
  - Average time to final decision
  - Application cycle time analysis
- **Success Rates**:
  - Response rate calculations
  - Interview conversion rates
  - Offer acceptance rates
- **Status Distribution**: Visual breakdown of application statuses
- **Performance Tracking**: Historical trends and improvements

### 🏢 **Company Management**
- **Automatic Company Creation**: Companies created automatically when adding applications
- **Application History**: Track all applications per company
- **Company Analytics**: Performance metrics by company

### 🔍 **Smart Search & Filtering**
- **Real-time Search**: Instant filtering by position or company name
- **Application Table**: Sortable, filterable table with all application details
- **Quick Actions**: Easy access to edit, update, or delete applications

## 🛠 Technical Stack

- **Frontend**: React 18 + React Router v7
- **Backend**: Node.js with React Router SSR
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: TailwindCSS with custom components
- **Authentication**: Supabase Auth integration
- **TypeScript**: Full type safety throughout
- **State Management**: React Router data loading and mutations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL (local or remote)
- Docker (optional, for local PostgreSQL)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd craftd_react
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
```

Configure your `.env` file with:
```dotenv
# Database
VITE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/craftd_dev
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/craftd_dev

# Supabase (for authentication)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start local PostgreSQL** (if using Docker):
```bash
docker-compose up -d
```

5. **Run database migrations**:
```bash
npx drizzle-kit push
```

6. **Start the development server**:
```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## 📊 Database Schema

The application includes a comprehensive database schema designed for career tracking:

- **Users**: User profiles and authentication
- **Companies**: Company information and details
- **Job Applications**: Complete application tracking with stages
- **Application Stages**: Timeline of application progress
- **Salary Information**: Compensation tracking and analytics

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern Interface**: Clean, professional design with intuitive navigation
- **Real-time Updates**: Instant feedback and live data updates
- **Accessible**: Built with accessibility best practices
- **Performance Optimized**: Fast loading and smooth interactions

## 📱 Pages & Routes

- **`/career/applications`**: Main dashboard with analytics and application management
- **`/job-applications/create`**: Create new job applications
- **Authentication flows**: Login, signup, and user management

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run typecheck` - Run TypeScript type checking
- `npx drizzle-kit studio` - Open Drizzle Studio for database management

### Code Organization

```
app/
├── components/career/          # Career tracking UI components
├── lib/db/                    # Database schema and queries
├── routes/                    # Application routes and pages
├── types/                     # TypeScript type definitions
└── utils/                     # Utility functions
```

## 🚀 Deployment

Deployments are automated via GitHub Actions at [.github/workflows/fly-deploy.yml](./.github/workflows/fly-deploy.yml).

To deploy manually:
```bash
npm run build
# Deploy to your preferred platform
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Built with ❤️ using React Router, TypeScript, and modern web technologies.**

*Empowering job seekers with data-driven insights for career success.*
