'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { ChatMessage } from '@/types/database.types';
import { getRelativeTime } from '@/utils/date-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ChatInterfaceProps {
    matchId: string;
    currentUserId: string;
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    disabled?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    matchId,
    currentUserId,
    messages,
    onSendMessage,
    disabled = false,
}) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && !disabled) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <Card variant="glass">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">💬</span>
                    Private Chat
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Messages Container */}
                <div className="h-96 overflow-y-auto scrollbar-thin space-y-3 p-4 bg-gradient-to-b from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-950/50 rounded-xl">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <div className="text-6xl mb-4 animate-bounce-slow">💬</div>
                            <p className="text-center font-medium">
                                No messages yet
                            </p>
                            <p className="text-sm text-center mt-1">
                                Start the conversation!
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {messages.map((message, index) => {
                                const isCurrentUser = message.sender_id === currentUserId;
                                return (
                                    <motion.div
                                        key={message.id}
                                        initial={{
                                            opacity: 0,
                                            y: 20,
                                            scale: 0.8,
                                            x: isCurrentUser ? 20 : -20
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            scale: 1,
                                            x: 0
                                        }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.8
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 30,
                                            delay: index * 0.05
                                        }}
                                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-lg ${isCurrentUser
                                                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-sm'
                                                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm border border-slate-200 dark:border-slate-700'
                                                }`}
                                        >
                                            <p className="text-sm break-words leading-relaxed">
                                                {message.message}
                                            </p>
                                            <p
                                                className={`text-xs mt-1.5 ${isCurrentUser
                                                        ? 'text-white/70'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                    }`}
                                            >
                                                {getRelativeTime(message.created_at)}
                                            </p>
                                        </motion.div>
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </AnimatePresence>
                    )}
                </div>

                {/* Input Form */}
                {disabled ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                        <p className="text-sm text-muted-foreground">
                            💬 Chat is closed. This item has been marked as returned.
                        </p>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 input"
                            disabled={disabled}
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!newMessage.trim() || disabled}
                            rightIcon={<Send className="w-4 h-4" />}
                        >
                            Send
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
};

export default ChatInterface;
