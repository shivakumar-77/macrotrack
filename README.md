# MacroTrack — Smart Nutrition Tracker

## Setup

1. **Install dependencies**
```bash
npm install
```

2. **Set environment variables**
```bash
cp .env.example .env.local
# Fill in your keys
```

3. **Run Supabase schema**
- Go to Supabase → SQL Editor
- Paste contents of `supabase-schema.sql` and run

4. **Run locally**
```bash
npm run dev
```

5. **Deploy to Vercel**
- Connect GitHub repo to Vercel
- Add environment variables in Vercel dashboard
- Set root directory to `/` (repo root)
- Deploy!

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```
