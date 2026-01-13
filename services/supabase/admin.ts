import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminInstance: SupabaseClient | null = null;

// Server-side Supabase client (bypasses RLS)
// This should ONLY be used in server-side code (API routes, server components, services)
function getSupabaseAdmin(): SupabaseClient {
    if (!supabaseAdminInstance) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase environment variables for admin client');
        }

        supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }

    return supabaseAdminInstance;
}

// Export a getter that returns the admin client
// This ensures lazy initialization - client is only created when first accessed
export const supabaseAdmin = {
    get from() { return getSupabaseAdmin().from; },
    get rpc() { return getSupabaseAdmin().rpc; },
    get auth() { return getSupabaseAdmin().auth; },
    get storage() { return getSupabaseAdmin().storage; },
    get functions() { return getSupabaseAdmin().functions; },
    get channel() { return getSupabaseAdmin().channel; },
    get removeChannel() { return getSupabaseAdmin().removeChannel; },
    get removeAllChannels() { return getSupabaseAdmin().removeAllChannels; },
    get getChannels() { return getSupabaseAdmin().getChannels; },
};
