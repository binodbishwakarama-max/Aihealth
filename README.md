# CareAI - AI Health Education Assistant

A production-ready, white-label AI-powered health education platform built with Next.js 14, Supabase, and Clerk authentication.

![CareAI](https://img.shields.io/badge/CareAI-Health%20Education-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ⚠️ Important Disclaimer

**CareAI provides educational health information only and is NOT a substitute for professional medical advice, diagnosis, or treatment.**

This application:
- Does NOT diagnose diseases
- Does NOT prescribe medication
- Provides educational guidance only
- Always recommends consulting healthcare professionals

## Features

### User Features
- 🏠 **Landing Page** - Professional healthcare SaaS design with clear disclaimers
- 🔍 **Symptom Checker** - AI-powered symptom analysis form
- 📊 **Results Page** - Detailed health education report with risk assessment
- 📄 **PDF Reports** - Downloadable health reports
- 📜 **History** - View previous symptom checks (authenticated users)

### Admin Features
- 📈 **Dashboard** - Analytics with daily usage charts
- 📋 **Symptom Table** - View all submissions with filters
- 📤 **CSV Export** - Export data for analysis
- 🎨 **White Label Settings** - Customize branding (name, logo, colors)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **AI**: OpenAI GPT-4o-mini
- **Charts**: Recharts
- **PDF**: jsPDF

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account
- OpenAI API key

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd aisymptom
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Fill in your credentials:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=sk-...
LLM_PROVIDER=openai

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the SQL from `supabase/schema.sql`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
npm run build
```

### Environment Variables in Vercel

Add all variables from `.env.local.example` to your Vercel project settings.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── checker/page.tsx      # Symptom checker form
│   ├── result/page.tsx       # Results display
│   ├── history/page.tsx      # User history
│   ├── admin/
│   │   ├── page.tsx          # Admin dashboard
│   │   └── settings/page.tsx # White label settings
│   ├── sign-in/              # Clerk sign in
│   ├── sign-up/              # Clerk sign up
│   └── api/
│       ├── analyze/route.ts  # Symptom analysis API
│       ├── history/route.ts  # User history API
│       ├── settings/route.ts # Settings API
│       └── admin/            # Admin APIs
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── Disclaimer.tsx
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── supabase.ts          # Database client
│   ├── ai.ts                # OpenAI integration
│   └── utils.ts             # Utility functions
└── middleware.ts            # Auth middleware
```

## API Routes

### POST `/api/analyze`
Analyze symptoms and get AI-generated health education.

**Request:**
```json
{
  "age": 30,
  "gender": "female",
  "symptoms": "headache and fatigue for 3 days",
  "duration": "3-7-days",
  "severity": 5
}
```

**Response:**
```json
{
  "id": "uuid",
  "ai_response": {
    "possible_conditions": ["Tension headache", "Fatigue"],
    "risk_level": "Low",
    "self_care": ["Rest", "Hydration"],
    "see_doctor_if": ["Symptoms worsen"],
    "emergency_signs": ["Severe headache with confusion"]
  }
}
```

### GET `/api/history`
Get authenticated user's symptom check history.

### GET `/api/admin/checks`
Get all symptom checks with stats (admin only).

### GET/POST `/api/settings`
Get or update white label settings.

## Customization

### White Label Settings

Access `/admin/settings` to customize:
- App name
- Logo URL
- Primary color
- Booking URL

### Adding Admin Role

To restrict admin access, update `middleware.ts`:

```typescript
if (isAdminRoute(req)) {
  const user = await clerkClient.users.getUser(userId);
  if (user.publicMetadata.role !== 'admin') {
    return Response.redirect(new URL('/', req.url));
  }
}
```

Set admin role in Clerk Dashboard → Users → User → Metadata:
```json
{
  "role": "admin"
}
```

## Safety Features

1. **Keyword Detection**: High-risk keywords (chest pain, breathing difficulty) automatically trigger High risk level
2. **Severity Override**: High severity (9-10) automatically escalates risk level
3. **Medical Disclaimers**: Displayed on landing page and results
4. **Educational Language**: AI responses use non-diagnostic language

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub.

---

**Remember**: This is an educational tool. Always consult healthcare professionals for medical advice.
