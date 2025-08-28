# BeAligned Lite MVP

Web-first MVP for guided co-parenting communication support using the BeAligned/BeH2O curriculum.

## Quick Start

1. **Clone and install dependencies:**
```bash
cd bealigned-lite-mvp
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

3. **Add your API keys to `.env`:**
```env
# Supabase Configuration (get from https://app.supabase.com)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# For Edge Functions
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
PASSWORD_GATE_HASH=your_bcrypt_hash
```

4. **Generate password hash:**
```bash
deno run scripts/generate-password-hash.ts
```

5. **Set up Supabase:**
```bash
# Initialize Supabase (if not already done)
npx supabase init

# Link to your project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase migration up

# Deploy Edge Functions
npx supabase functions deploy mvp-password-gate
npx supabase functions deploy responses-proxy

# Set Edge Function secrets
npx supabase secrets set OPENAI_API_KEY="your_openai_api_key"
npx supabase secrets set PASSWORD_GATE_HASH="your_bcrypt_hash"
```

6. **Seed the database:**
```bash
# Run the seed file in Supabase SQL editor or via CLI
npx supabase db seed

# Seed knowledge base
npm run seed:knowledge
```

7. **Start development server:**
```bash
npm run dev
```

## Project Structure

```
bealigned-lite-mvp/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts
│   ├── lib/           # Utilities and Supabase client
│   ├── types/         # TypeScript types
│   └── styles/        # CSS files
├── supabase/
│   ├── migrations/    # Database schema
│   ├── functions/     # Edge Functions
│   └── seed.sql       # Initial data
└── scripts/           # Setup and utility scripts
```

## Key Features

- **7-Step Reflection Process**: Guided journey from reaction to reflection
- **Password-Gated Access**: Single shared password for MVP
- **AI-Powered Reflections**: OpenAI integration for dynamic guidance
- **Knowledge Auditing**: Every AI response includes grounding sources
- **CLEAR/BALANCE Frameworks**: Communication support tools
- **Session Management**: Export or delete session data

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript checks
- `npm run lint` - Run ESLint
- `npm run seed:knowledge` - Seed knowledge base
- `npm run verify` - Verify environment setup

## Environment Variables

### Client-side (Vite)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Server-side (Edge Functions)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin access
- `OPENAI_API_KEY` - OpenAI API key for AI responses
- `PASSWORD_GATE_HASH` - Bcrypt hash of the access password

## Security Notes

- Sessions expire after 24 hours
- All data is session-scoped with RLS policies
- No user accounts or PII storage in MVP
- Password hash never sent to client

## License

Proprietary - BeAligned™