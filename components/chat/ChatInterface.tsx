'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/database.types';
import { formatForDisplay, getRelativeTime } from '@/utils/date-utils';

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
        <div className="glass-card p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Private Chat</h3>

            {/* Messages Container */}
            <div className="h-96 overflow-y-auto scrollbar-thin space-y-3 p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <p className="text-center">
                            No messages yet. Start the conversation!
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => {
                            const isCurrentUser = message.sender_id === currentUserId;
                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${isCurrentUser
                                                ? 'bg-primary text-white rounded-br-sm'
                                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                                            }`}
                                    >
                                        <p className="text-sm break-words">{message.message}</p>
                                        <p
                                            className={`text-xs mt-1 ${isCurrentUser ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            {getRelativeTime(message.created_at)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Form */}
            {disabled ? (
                <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Chat is closed. This item has been marked as returned.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 glass-input"
                        disabled={disabled}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || disabled}
                        className="btn-primary px-6"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            )}
        </div>
    );
};

export default ChatInterface;
