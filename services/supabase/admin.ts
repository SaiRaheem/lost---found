import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client (bypasses RLS)
// This should ONLY be used in server-side code (API routes, server components, services)
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
