# Race Alert - Marathon Registration Notification System

Never miss marathon registration again! Get instant notifications when registration opens for the world's most popular marathons.

## 🏃‍♂️ Features

- **10 Major Marathons**: Boston, London, Berlin, Chicago, NYC, Tokyo, Paris, Valencia, Lagos, Comrades
- **Instant Alerts**: Email notifications the moment registration opens
- **Free Service**: No subscription fees, just helpful race alerts
- **Smart Detection**: Automated keyword-based status monitoring
- **Reliable**: GitHub Actions + Supabase for 99.9% uptime

## 🚀 Tech Stack (MVP - All Free Tiers)

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Database**: Supabase (500MB free)
- **Email**: Resend (3000 emails/month free)
- **Scraping**: GitHub Actions (2000 minutes/month free)
- **Hosting**: Vercel (100GB bandwidth free)
- **Browser Automation**: Playwright

## 📦 Project Structure

```
race-alert/
├── apps/
│   └── web/                 # Next.js web application
├── packages/
│   └── database/           # Database schemas and seeds
├── scripts/
│   └── scraper.js          # GitHub Actions race scraper
├── .github/
│   └── workflows/          # CI/CD and scheduled scraping
└── README.md
```

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/your-username/race-alert.git
cd race-alert
npm install
cd apps/web && npm install
```

### 2. Set Up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL from `packages/database/schema.sql` in the Supabase SQL editor
3. Run the SQL from `packages/database/seed.sql` to populate races
4. Copy your project URL and keys

### 3. Set Up Resend

1. Create account at [resend.com](https://resend.com)
2. Generate API key
3. Verify your sending domain (or use their test domain for development)

### 4. Configure Environment Variables

```bash
# In apps/web/.env.local
cp apps/web/.env.example apps/web/.env.local
# Fill in your actual values
```

### 5. Set Up GitHub Actions (Production)

1. Push to GitHub
2. Go to Settings → Secrets and variables → Actions
3. Add these secrets:
   - `WEBHOOK_URL`: Your deployed app URL + `/api/webhook`
   - `WEBHOOK_SECRET`: A secure random string
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key

### 6. Deploy

```bash
# Deploy to Vercel
npx vercel --prod

# Or use the Vercel dashboard to connect your GitHub repo
```

## 🧪 Development

```bash
# Start development server
npm run dev

# Test the scraper locally
npm run scrape

# Lint code
npm run lint
```

## 📊 Usage

1. **Subscribe**: Users enter email on landing page
2. **Scraping**: GitHub Actions runs every 2 hours, checking race registration pages
3. **Detection**: Playwright browser automation + keyword matching
4. **Notifications**: When status changes to "open", webhook triggers email alerts
5. **Delivery**: Resend sends beautiful HTML emails to all subscribers

## 🔧 API Endpoints

- `POST /api/subscribe` - Subscribe to race alerts
- `POST /api/webhook` - Receive scraper results (internal)
- `GET /api/webhook` - Health check

## 📈 Monitoring

- GitHub Actions logs for scraper status
- Vercel logs for API performance
- Supabase dashboard for database metrics
- Resend dashboard for email delivery

## 🚦 Roadmap

### Stage 1: MVP (Current)
- ✅ 10 hand-picked major races
- ✅ Basic email alerts
- ✅ Simple landing page

### Stage 2: Growth (Month 2)
- 🔄 50+ races
- 🔄 User dashboard
- 🔄 Race categories
- 🔄 User-submitted races

### Stage 3: Scale (Month 3+)
- 🔄 Auto-discovery
- 🔄 ML-powered detection
- 🔄 Mobile app
- 🔄 Advanced filtering

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

- **Issues**: GitHub Issues
- **Email**: support@racealert.run (coming soon)
- **Docs**: [Wiki](../../wiki)

---

**Built with ❤️ for the running community**