# Deployment Guide for BeAligned Lite MVP

## Vercel Deployment

### Prerequisites
1. Vercel account
2. Supabase project already set up
3. OpenAI API key

### Step 1: Environment Variables in Vercel

Add these environment variables in your Vercel project settings:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Important:** Only add the VITE_ prefixed variables. The Edge Functions run on Supabase, not Vercel.

### Step 2: Deploy Edge Functions to Supabase

1. Install Supabase CLI locally:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Deploy the Edge Functions:
```bash
supabase functions deploy responses-proxy --no-verify-jwt --project-ref your-project-ref
supabase functions deploy mvp-password-gate --no-verify-jwt --project-ref your-project-ref
```

### Step 3: Set Edge Function Secrets in Supabase

In your Supabase dashboard, go to Edge Functions and set these secrets:

```
OPENAI_API_KEY=your-openai-api-key
PASSWORD_GATE_HASH=$2a$10$6eh6ipbsiT3EX1ZR5K2yqO6falDWhn456joWfebcNktxjKaICXEmy
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 4: Configure CORS in Supabase

1. Go to your Supabase Dashboard
2. Navigate to Authentication > URL Configuration
3. Add your Vercel deployment URL to "Site URL" and "Redirect URLs":
   - `https://your-app.vercel.app`
   - `http://localhost:5173` (for local development)

### Step 5: Database Setup

Run the migration scripts in order:
1. Go to SQL Editor in Supabase Dashboard
2. Run each file in `supabase/migrations/` folder in numerical order

### Common Issues and Solutions

#### "Failed to fetch" Error
This usually means:
1. **Missing environment variables** - Check all VITE_ variables are set in Vercel
2. **Edge Functions not deployed** - Make sure you deployed to Supabase
3. **CORS not configured** - Add your Vercel URL to Supabase allowed origins
4. **Wrong Supabase URL** - Ensure no trailing slash in VITE_SUPABASE_URL

#### Edge Function Errors
Check logs in Supabase Dashboard > Edge Functions > Logs

#### Database Connection Issues
- Verify your anon key has proper permissions
- Check RLS policies are disabled or properly configured

### Testing Deployment

1. Visit your Vercel URL
2. The password for the MVP is: `BeAligned2024!`
3. Test the reflection journey flow

### Support

If you encounter issues:
1. Check browser console for specific error messages
2. Review Supabase Edge Function logs
3. Verify all environment variables are correctly set
4. Ensure database migrations ran successfully