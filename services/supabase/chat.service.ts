import { supabase } from './client';
import type { ChatMessage } from '@/types/database.types';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Send a chat message
 */
export async function sendChatMessage(matchId: string, message: string) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
        .from('chat_messages')
        .insert({
            match_id: matchId,
            sender_id: user.id,
            message: message.trim(),
        })
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Get chat messages for a match
 */
export async function getChatMessages(matchId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Subscribe to real-time chat messages
 */
export function subscribeToChatMessages(
    matchId: string,
    onMessage: (message: ChatMessage) => void
): RealtimeChannel {
    const channel = supabase
        .channel(`chat:${matchId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `match_id=eq.${matchId}`,
            },
            (payload) => {
                onMessage(payload.new as ChatMessage);
            }
        )
        .subscribe();

    return channel;
}

/**
 * Unsubscribe from chat
 */
export async function unsubscribeFromChat(channel: RealtimeChannel) {
    await supabase.removeChannel(channel);
}

/**
 * Mark chat as closed (when item is returned)
 */
export async function closeChatForMatch(matchId: string) {
    // Update match status to indicate chat is closed
    const { error } = await supabase
        .from('matches')
        .update({ status: 'completed' })
        .eq('id', matchId);

    if (error) throw error;
}
