import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client (with RLS)
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
