# Race Alert - Product Requirements Document (PRD)

## Executive Summary

Race Alert is a live, operational marathon registration notification system deployed at https://race-alert-k3xe3dj3o-orezi-menas-projects.vercel.app/. The system monitors registration status for 10 major international marathons and sends instant email alerts when registration opens. Built as an MVP using entirely free-tier services, the system operates autonomously using GitHub Actions for web scraping, Supabase for data management, and Resend for email delivery.

**Current Status**: Fully deployed and operational with automated scraping running twice daily (8 AM and 8 PM UTC).

## Current Feature Set

### 1. User Registration & Subscription Management
- **Email Signup Form** (`/Users/mena/Desktop/Development/Races/apps/web/src/components/SignupForm.tsx`)
  - Single email input with validation
  - Automatic timezone detection via `Intl.DateTimeFormat().resolvedOptions().timeZone`
  - Real-time feedback with success/error messaging
  - Automatic subscription to all monitored races (MVP approach)
  - Email validation using Zod schema
  - Loading states and form disable during submission

- **Subscription API** (`/Users/mena/Desktop/Development/Races/apps/web/src/app/api/subscribe/route.ts`)
  - Email normalization (lowercase conversion)
  - Upsert functionality for existing subscribers
  - Automatic subscription to all available races
  - Welcome email delivery
  - Race count returned in response (currently 10 races)

### 2. Race Monitoring System
- **Database Schema** (`/Users/mena/Desktop/Development/Races/packages/database/schema.sql`)
  - 4 core tables: `subscribers`, `races`, `subscriptions`, `notifications`
  - Configurable keyword-based detection system
  - Race status tracking: `unknown`, `open`, `closed`, `full`
  - Subscriber status management: `pending`, `active`, `bounced`, `unsubscribed`, `complained`

- **Monitored Races** (`/Users/mena/Desktop/Development/Races/packages/database/seed.sql`)
  1. Boston Marathon
  2. TCS London Marathon
  3. BMW Berlin Marathon
  4. Bank of America Chicago Marathon
  5. TCS New York City Marathon
  6. Tokyo Marathon
  7. Schneider Electric Paris Marathon
  8. Valencia Marathon Trinidad Alfonso
  9. Access Bank Lagos City Marathon
  10. Comrades Marathon

### 3. Web Scraping Infrastructure
- **Scraper Implementation** (`/Users/mena/Desktop/Development/Races/scripts/scraper.js`)
  - Playwright-based browser automation
  - Headless Chrome with security configurations
  - Configurable open/closed keyword detection per race
  - Content snippet extraction (500 characters)
  - Comprehensive error handling and logging
  - Respectful scraping with 1-second delays between requests
  - Fallback race configuration for development

- **Automation Schedule** (`/Users/mena/Desktop/Development/Races/.github/workflows/scrape-races.yml`)
  - Twice daily execution: 8 AM and 8 PM UTC
  - Manual trigger capability with optional race-specific targeting
  - Log artifact collection on failures
  - Node.js 18 runtime environment

### 4. Notification System
- **Status Change Detection** (Database function `notify_registration_opened`)
  - Only triggers notifications when status changes to 'open' from non-open status
  - Prevents duplicate notifications via unique constraints
  - Batch notification creation for all active subscribers

- **Email Delivery** (`/Users/mena/Desktop/Development/Races/apps/web/src/lib/email.ts`)
  - Resend integration with verified domain
  - Two email templates: Welcome and Registration Open alerts
  - HTML and plain text versions
  - Branded styling with Race Alert identity
  - Unsubscribe links (currently placeholder)

### 5. Landing Page
- **User Interface** (`/Users/mena/Desktop/Development/Races/apps/web/src/app/page.tsx`)
  - Hero section with value proposition
  - Feature highlights: Major Marathons, Instant Alerts, Always Free
  - Visual grid of all 10 monitored races
  - Responsive design using Tailwind CSS
  - Clean, gradient-based design (blue theme)

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom primary color scheme
- **Deployment**: Vercel hosting
- **State Management**: React hooks (useState for form state)

### Backend Infrastructure
- **Database**: Supabase PostgreSQL with Row Level Security
- **Email Service**: Resend with onboarding@resend.dev sender
- **Authentication**: Supabase service role for API operations
- **API**: Next.js API routes (`/api/subscribe`, `/api/webhook`)

### Data Processing Pipeline
1. **GitHub Actions** executes scraper twice daily
2. **Playwright** navigates to race registration pages
3. **Keyword matching** determines registration status
4. **Webhook** posts results to `/api/webhook` with Bearer token authentication
5. **Database function** processes status changes and creates notifications
6. **Resend** delivers emails to subscribers

### Security Implementation
- Webhook authentication via Bearer token (`WEBHOOK_SECRET`)
- Input validation using Zod schemas
- Supabase Row Level Security policies
- Service role isolation for sensitive operations
- Case-insensitive email storage using citext

## User Flows

### Subscription Flow
1. User visits landing page
2. User enters email in signup form
3. Frontend validates email format
4. API creates/updates subscriber record with 'active' status
5. API creates subscriptions for all 10 races
6. Welcome email sent via Resend
7. Success message shows race count (10 races)

### Notification Flow
1. GitHub Actions triggers scraper
2. Scraper visits each race registration page
3. Page content analyzed for open/closed keywords
4. If status = 'open', webhook called with race data
5. Database function updates race status
6. If status changed to 'open', notifications created for active subscribers
7. Registration open emails sent immediately
8. Process logged for monitoring

## Data Models

### Subscribers Table
```sql
- id: uuid (primary key)
- email: citext (unique, case-insensitive)
- status: enum ('pending','active','bounced','unsubscribed','complained')
- timezone: text (default: 'UTC')
- created_at, updated_at: timestamptz
```

### Races Table
```sql
- id: uuid (primary key)
- name: text (race display name)
- url: text (registration page URL)
- open_keywords: text[] (detection phrases for open registration)
- closed_keywords: text[] (detection phrases for closed registration)
- current_status: enum ('unknown','open','closed','full')
- last_scraped_at: timestamptz
- created_at, updated_at: timestamptz
```

### Subscriptions Table (Many-to-Many)
```sql
- id: uuid (primary key)
- subscriber_id: uuid (foreign key to subscribers)
- race_id: uuid (foreign key to races)
- is_active: boolean (default: true)
- created_at: timestamptz
- Unique constraint: (subscriber_id, race_id)
```

### Notifications Table (Audit Log)
```sql
- id: uuid (primary key)
- race_id: uuid (foreign key to races)
- recipient_email: citext
- subject: text
- body: text
- sent_at: timestamptz
- Unique constraint: (race_id, recipient_email) - prevents duplicates
```

## Integration Points

### Third-Party Services
1. **Supabase**
   - Database hosting and management
   - Real-time capabilities (unused in current implementation)
   - Service role authentication
   - Environment: Production instance

2. **Resend**
   - Email delivery service
   - Sender: `Race Alert <onboarding@resend.dev>`
   - Templates: HTML/text dual format
   - Rate limits: 3000 emails/month (free tier)

3. **Vercel**
   - Next.js hosting and deployment
   - Automatic deployments from Git
   - Environment variable management
   - CDN and edge functions

4. **GitHub Actions**
   - Automated scraping execution
   - Ubuntu latest runner environment
   - Playwright browser installation
   - Secret management for credentials

### API Endpoints
- **POST /api/subscribe**: Email subscription with timezone capture
- **POST /api/webhook**: Scraper result ingestion (Bearer auth required)
- **GET /api/webhook**: Health check endpoint

## Operational Requirements

### Monitoring & Logging
- GitHub Actions execution logs
- Scraper daily log files (`/logs/scraper-YYYY-MM-DD.log`)
- Supabase database metrics and query performance
- Resend email delivery reports
- Vercel function execution logs

### Performance Specifications
- Scraper execution: ~10 seconds per race (with 1-second delays)
- Email delivery: Immediate upon status change detection
- Page load time: <2 seconds on Vercel
- Database queries: Optimized with indexes on email, status, and foreign keys

### Reliability Measures
- Scraper fallback to hardcoded races if database unavailable
- Email sending failures don't block webhook success
- Row Level Security prevents unauthorized data access
- Unique constraints prevent duplicate subscriptions/notifications

## Success Metrics

### Operational Metrics
- **Scraper Reliability**: 99%+ successful execution rate
- **Email Delivery**: >95% delivery rate via Resend
- **Database Performance**: <100ms average query time
- **API Response Time**: <500ms for subscription endpoint

### User Engagement (Trackable)
- **Subscriber Growth**: Email addresses in `subscribers` table with `active` status
- **Notification Volume**: Records in `notifications` table
- **Scraper Efficacy**: Status change detection rate (open/closed transitions)

### Business Metrics (Observable)
- **Cost Efficiency**: $0/month operating cost on free tiers
- **Registration Success**: User feedback on actual registrations (not currently tracked)

## Known Limitations

### Technical Constraints
1. **Detection Method**: Keyword-based only; vulnerable to website redesigns
2. **Scraping Frequency**: Limited to twice daily; may miss brief registration windows
3. **Email Sender**: Using Resend default domain, not custom branded domain
4. **No Unsubscribe**: Links present but not functional (placeholder implementation)
5. **MVP Subscription Model**: All users automatically subscribed to all races

### Scalability Limitations
1. **GitHub Actions**: 2000 minutes/month limit for scraping
2. **Supabase**: 500MB database limit, 2GB bandwidth/month
3. **Resend**: 3000 emails/month sending limit
4. **Browser Resources**: Single Chrome instance limits concurrent scraping

### User Experience Gaps
1. **No User Dashboard**: Cannot manage subscriptions or preferences
2. **No Race Selection**: Cannot choose specific races to monitor
3. **No Subscription Confirmation**: No double opt-in process
4. **Limited Error Feedback**: Generic error messages for users

## Future Roadmap

### Phase 1: User Management (Next 30 days)
- Implement functional unsubscribe system
- Add race-specific subscription preferences
- Create basic subscriber dashboard
- Add email confirmation workflow

### Phase 2: Detection Enhancement (60 days)
- Implement ML-based content analysis
- Add visual change detection capabilities
- Increase scraping frequency to hourly
- Add manual race status override system

### Phase 3: Scale Preparation (90 days)
- Migrate to paid service tiers
- Add race auto-discovery system
- Implement user-submitted race requests
- Add mobile-responsive dashboard

### Phase 4: Community Features (120+ days)
- Add user race reviews and ratings
- Implement race calendar integration
- Create race completion tracking
- Add social sharing capabilities

## Compliance & Privacy

### Current Implementation
- **Data Collection**: Email addresses and timezones only
- **Data Storage**: Supabase with Row Level Security enabled
- **Email Sending**: Via verified Resend domain
- **User Control**: Placeholder unsubscribe links (not functional)

### Required Improvements
- Implement GDPR-compliant unsubscribe process
- Add privacy policy and terms of service
- Create data deletion procedures
- Add consent management for email preferences

---

**Document Version**: 1.0  
**Last Updated**: 2025-09-04  
**System Status**: Live and Operational  
**Total Lines of Code**: ~1,500 lines across all components  
**Database Records**: 10 races, variable subscribers and notifications

This PRD documents the current state of Race Alert as of the analysis date. All features and technical specifications are based on actual implementation in the provided codebase.