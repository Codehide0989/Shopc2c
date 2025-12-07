import React, { useState, useEffect, useRef } from "react";
import { db } from "../services/db";
import { ChatMessage, User } from "../types";

interface CommunityChatProps {
    user: User;
}

const CommunityChat: React.FC<CommunityChatProps> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const settings = db.getSettings();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            const interval = setInterval(() => {
                const msgs = db.getMessages();
                setMessages(prev => {
                    if (prev.length !== msgs.length) return msgs;
                    return prev;
                });
            }, 2000); // Poll every 2 seconds
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setError(null);

        try {
            db.sendMessage(user.userId, user.username, newMessage.trim());
            setNewMessage("");
            setMessages(db.getMessages()); // Immediate update
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (!settings.chatEnabled) {
        if (!isOpen) return null; // Hide if closed and disabled
        // If open, show disabled message
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 bg-[#0a0a0a]/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
                    {/* Header */}
                    <div className="bg-gray-900/50 p-4 border-b border-gray-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <h3 className="font-bold text-white">Community Chat</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="h-96 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {!settings.chatEnabled ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                                <i className="fa-solid fa-lock text-3xl mb-2"></i>
                                <p>Chat is currently disabled by admins.</p>
                            </div>
                        ) : (
                            <>
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex flex-col ${msg.userId === user.userId ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className={`text-xs font-bold ${msg.userId === user.userId ? 'text-violet-400' : 'text-gray-400'}`}>{msg.username}</span>
                                            <span className="text-[10px] text-gray-600">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] ${msg.userId === user.userId ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input Area */}
                    {settings.chatEnabled && (
                        <div className="p-4 bg-gray-900/30 border-t border-gray-800">
                            {error && (
                                <div className="mb-2 text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20 flex items-center gap-2">
                                    <i className="fa-solid fa-circle-exclamation"></i> {error}
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:border-violet-500 focus:outline-none transition"
                                />
                                <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white w-10 h-10 rounded-xl flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={!newMessage.trim()}>
                                    <i className="fa-solid fa-paper-plane"></i>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 transition transform hover:scale-110 flex items-center justify-center text-xl z-50"
            >
                {isOpen ? <i className="fa-solid fa-chevron-down"></i> : <i className="fa-solid fa-comments"></i>}
            </button>
        </div>
    );
};

export default CommunityChat;
