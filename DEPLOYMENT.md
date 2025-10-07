# Deployment Guide

## Deploying to Your Own Supabase + Vercel

### 1. Set Up Your Supabase Project

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public key

### 2. Run Database Migrations

Copy all SQL from `supabase/migrations/` and run them in your Supabase SQL Editor:

1. Go to your Supabase Dashboard > SQL Editor
2. Run each migration file in order (sorted by timestamp)
3. This creates the `attendees` table, RLS policies, and helper functions

### 3. Deploy Edge Functions

Install Supabase CLI and deploy functions:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Deploy functions
supabase functions deploy check-email
supabase functions deploy update-attendee
```

### 4. Set Up Storage

1. Go to Storage in Supabase Dashboard
2. Create a bucket named `headshots`
3. Make it public
4. Set up the same RLS policies as in the migrations

### 5. Configure Authentication

1. Go to Authentication > Settings
2. Enable Email provider
3. Add your site URL to "Site URL"
4. Add your deployment URL to "Redirect URLs"
5. **For testing**: Enable "Confirm email" setting or disable it for faster testing

### 6. Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_SUPABASE_PROJECT_ID=your-project-id
   ```
4. Deploy!

### 7. Test Your Deployment

1. Visit your Vercel URL
2. Try creating a poster with a registered email
3. Share the poster link
4. Verify public viewing works
5. Test edit permissions

## Environment Variables

The app supports both Vite and Next.js variable naming:

- `VITE_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Schema

The app uses these tables:
- `attendees`: Stores poster data (email, name, company, headshot_url, registered)

See `supabase/migrations/` for the complete schema.

## Troubleshooting

- **404 on poster pages**: Check that migrations ran successfully
- **Auth errors**: Verify redirect URLs in Supabase auth settings
- **Storage errors**: Ensure `headshots` bucket exists and is public
- **Edge function errors**: Check function logs in Supabase Dashboard
