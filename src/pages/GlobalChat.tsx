import React, { useState, useEffect, useRef } from "react";
import { db } from "../services/db";
import { ChatMessage, User, AppSettings } from "../types";

interface GlobalChatProps {
    user: User | null;
    onLogout: () => void;
}

interface ConnectedUser {
    userId: string;
    username: string;
    role: string;
}

const GlobalChat: React.FC<GlobalChatProps> = ({ user: initialUser }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [showBannedModal, setShowBannedModal] = useState(false);
    const [bannedUsers, setBannedUsers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
    const [showUsersSidebar, setShowUsersSidebar] = useState(false); // Mobile toggle
    const [showScrollButton, setShowScrollButton] = useState(false);
    const scrollViewportRef = useRef<HTMLDivElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [settings, setSettings] = useState<AppSettings>({
        discordLink: "",
        storeName: "Shopc2c",
        heroImage: "",
        maintenanceMode: false,
        chatEnabled: true,
        allowedDomains: []
    });

    const [isConnected, setIsConnected] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleScroll = () => {
        if (scrollViewportRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        }
    };

    // Initial Load and Socket Setup
    useEffect(() => {
        const initChat = async () => {
            const msgs = await db.getMessages();
            setMessages(msgs);
            const sets = await db.getSettings();
            setSettings(sets);
        };
        initChat();

        // Join chat with user info
        if (currentUser) {
            db.joinChat({
                userId: currentUser.userId,
                username: currentUser.username,
                role: currentUser.role
            });
        } else {
            db.joinChat();
        }

        const handleNewMessage = (msg: ChatMessage) => {
            console.log("[GlobalChat] Received message:", msg);
            setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg].slice(-100); // Keep last 100 messages
            });
            scrollToBottom();
        };

        const handleUserListUpdate = (users: ConnectedUser[]) => {
            const uniqueUsers = Array.from(new Map(users.map(u => [u.userId, u])).values());
            setConnectedUsers(uniqueUsers);
        };

        db.onMessage(handleNewMessage);
        db.onUserListUpdate(handleUserListUpdate);

        const connectionHandlers = db.onConnectionChange((connected) => {
            setIsConnected(connected);
            if (connected) {
                if (currentUser) {
                    db.joinChat({
                        userId: currentUser.userId,
                        username: currentUser.username,
                        role: currentUser.role
                    });
                } else {
                    db.joinChat();
                }
            }
        });

        const handleChatStatus = (enabled: boolean) => {
            setSettings(prev => ({ ...prev, chatEnabled: enabled }));
        };
        db.onChatStatusChange(handleChatStatus);

        return () => {
            db.offMessage(handleNewMessage);
            db.offChatStatusChange(handleChatStatus);
            db.offConnectionChange(connectionHandlers);
            db.offUserListUpdate(handleUserListUpdate);
        };
    }, [currentUser]);

    // Polling Fallback for Vercel (Serverless)
    useEffect(() => {
        if (isConnected) return; // Don't poll if socket is working

        const pollInterval = setInterval(async () => {
            console.log("[GlobalChat] Polling for new messages (Fallback Mode)...");
            try {
                const msgs = await db.getMessages();
                setMessages(prev => {
                    // Simple diff check or just append new ones
                    // To avoid full re-renders, best to merge.
                    // For simplicity in this fix, we replace or merge:
                    if (msgs.length === prev.length && msgs[msgs.length - 1]?.id === prev[prev.length - 1]?.id) {
                        return prev; // No change
                    }
                    return msgs;
                });

                // Also poll users if possible (optional, but good for "Realtime Data" feel)
                const users = await db.getUsers(); // API call
                // This is heavier, so maybe just messages first.
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 5000); // 5 seconds

        return () => clearInterval(pollInterval);
    }, [isConnected]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (showBannedModal) {
            const fetchUsers = async () => {
                const users = await db.getUsers();
                setAllUsers(users);
                setBannedUsers(users.filter(u => u.isBanned));
            };
            fetchUsers();
        }
    }, [showBannedModal]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit increased
                setError("Image size must be less than 2MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !imagePreview) || !currentUser) return;
        if (!isConnected) {
            setError("You are currently disconnected. Please wait for reconnection.");
            return;
        }
        setError(null);

        try {
            db.sendMessage(currentUser.userId, currentUser.username, newMessage.trim(), currentUser.role, imagePreview || undefined);
            setNewMessage("");
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleAdminAction = async (action: 'ban' | 'unban' | 'timeout' | 'clear', targetUserId?: string) => {
        if (currentUser?.userId !== 'admin' && currentUser?.role !== 'admin' && currentUser?.role !== 'staff') return;

        try {
            if (action === 'ban' && targetUserId) {
                if (confirm("Permanently ban this user?")) await db.banUser(targetUserId);
            } else if (action === 'unban' && targetUserId) {
                await db.unbanUser(targetUserId);
                setBannedUsers(prev => prev.filter(u => u.userId !== targetUserId));
            } else if (action === 'timeout' && targetUserId) {
                if (confirm("Timeout user for 10 minutes?")) await db.timeoutUser(targetUserId, 10);
            } else if (action === 'clear') {
                if (window.confirm("Prepare to clear all chat history for everyone. Continue?")) {
                    await db.clearChat();
                    setMessages([]);
                }
            }
            setSelectedUser(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const isBanned = currentUser?.isBanned;
    const isTimedOut = currentUser?.timeoutUntil && currentUser.timeoutUntil > Date.now();
    const isAdmin = currentUser?.userId === 'admin' || currentUser?.role === 'admin';
    const isStaff = currentUser?.role === 'staff';

    return (
        <div className="h-[100dvh] bg-[#050505] flex font-sans text-gray-100 overflow-hidden relative selection:bg-fuchsia-500/30">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-[#050505] to-[#050505] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-violet-900/10 via-[#050505] to-[#050505] pointer-events-none"></div>

            {/* Navigation / Header Area (Desktop only, moved to header for mobile) */}
            <div className="hidden md:block absolute top-6 left-6 z-50">
                <a href="/" className="flex items-center gap-3 px-3 py-2 md:px-4 md:py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition group">
                    <i className="fa-solid fa-arrow-left text-gray-400 group-hover:text-white transition"></i>
                    <span className="text-sm font-bold text-gray-300 group-hover:text-white transition">Back Home</span>
                </a>
            </div>

            {/* Main Chat Layout */}
            <main className="flex-1 flex w-full relative z-10">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] relative">
                    {/* Header */}
                    <div className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-30">
                        <div className="flex items-center gap-3 md:gap-0">
                            {/* Mobile Back Button */}
                            <a href="/" className="md:hidden p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg">
                                <i className="fa-solid fa-arrow-left"></i>
                            </a>

                            <div className="flex flex-col">
                                <h1 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
                                    <span className="hidden md:inline">Global Community</span>
                                    <span className="md:hidden">Chat</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white uppercase tracking-wider shadow-lg shadow-violet-500/20">Live</span>
                                </h1>
                                <p className="text-[10px] md:text-xs text-gray-500 font-medium flex items-center gap-2 mt-0.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-yellow-500 animate-pulse'}`}></span>
                                    {isConnected ? 'Connected' : 'Live Updates (Polling)'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 md:gap-4">
                            <button
                                onClick={() => setShowUsersSidebar(!showUsersSidebar)}
                                className="md:hidden p-2.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95 border border-white/5"
                            >
                                <i className="fa-solid fa-users text-sm"></i>
                                {connectedUsers.length > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full border border-[#0a0a0a]"></span>}
                            </button>
                            {(isAdmin || isStaff) && (
                                <div className="hidden md:flex gap-2">
                                    {isAdmin && (
                                        <>
                                            <button onClick={() => setShowBannedModal(true)} className="px-4 py-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition flex items-center gap-2">
                                                <i className="fa-solid fa-user-slash"></i> Banned
                                            </button>
                                            <button onClick={() => handleAdminAction('clear')} className="px-4 py-2 text-xs font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl transition flex items-center gap-2">
                                                <i className="fa-solid fa-trash"></i> Clear
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        ref={scrollViewportRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 custom-scrollbar scroll-smooth relative"
                    >
                        {isBanned ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6 animate-pulse">
                                    <i className="fa-solid fa-ban text-4xl text-red-500"></i>
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">Access Denied</h2>
                                <p className="text-gray-500 max-w-md">You have been permanently banned from participating in the global chat.</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                <i className="fa-solid fa-ghost text-6xl mb-4 text-gray-700"></i>
                                <p className="text-gray-500 font-medium">It's quiet here...</p>
                                <p className="text-gray-600 text-sm">Be the first to say hello!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isMe = currentUser && msg.userId === currentUser.userId;
                                const showAvatar = index === 0 || messages[index - 1].userId !== msg.userId || (msg.timestamp - messages[index - 1].timestamp > 60000);
                                const isRecent = Date.now() - msg.timestamp < 60000; // Less than 1 minute ago

                                return (
                                    <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`flex max-w-[85%] md:max-w-[60%] ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
                                            {/* Avatar */}
                                            <div className={`flex-shrink-0 flex flex-col items-center ${!showAvatar ? 'invisible' : ''}`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-2xl relative overflow-hidden ${msg.role === 'admin' ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white ring-2 ring-violet-500/50' :
                                                    msg.role === 'staff' ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white ring-2 ring-fuchsia-500/50' :
                                                        'bg-gray-800 text-gray-400 border border-gray-700'
                                                    }`}>
                                                    {msg.username.substring(0, 1).toUpperCase()}
                                                    {/* Shine effect */}
                                                    {(msg.role === 'admin' || msg.role === 'staff') && <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>}
                                                </div>
                                            </div>

                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                {showAvatar && (
                                                    <div className="flex items-center gap-2 mb-1.5 px-1">
                                                        <span className={`text-xs font-bold tracking-wide ${msg.role === 'admin' ? 'text-violet-400' :
                                                            msg.role === 'staff' ? 'text-fuchsia-400' :
                                                                'text-gray-400'
                                                            }`}>
                                                            {msg.username}
                                                        </span>
                                                        {msg.role === 'admin' && <i className="fa-solid fa-certificate text-[10px] text-violet-500" title="Admin"></i>}
                                                        {msg.role === 'staff' && <i className="fa-solid fa-shield-halved text-[10px] text-fuchsia-500" title="Staff"></i>}
                                                        <span className="text-[10px] text-gray-700 font-medium">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                )}

                                                {/* Admin Tools */}
                                                {(isAdmin || isStaff) && !isMe && selectedUser === msg.userId && (
                                                    <div className="mb-2 bg-gray-900 border border-gray-800 rounded-xl p-1.5 shadow-2xl z-20 min-w-[160px] animate-in zoom-in-95 duration-100 origin-bottom-left">
                                                        <div className="flex justify-between items-center px-2 py-1.5 border-b border-gray-800 mb-1">
                                                            <span className="text-[10px] text-gray-500 font-bold uppercase truncate max-w-[100px]">Manage User</span>
                                                            <button onClick={() => setSelectedUser(null)}><i className="fa-solid fa-xmark text-gray-500 hover:text-white text-xs"></i></button>
                                                        </div>
                                                        <button onClick={() => handleAdminAction('timeout', msg.userId)} className="w-full text-left px-2 py-2 text-xs text-yellow-500 hover:bg-yellow-500/10 rounded-lg flex items-center gap-2 transition-colors relative font-bold"><i className="fa-solid fa-clock w-4"></i> Timeout 10m</button>
                                                        {isAdmin && <button onClick={() => handleAdminAction('ban', msg.userId)} className="w-full text-left px-2 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors font-bold"><i className="fa-solid fa-gavel w-4"></i> Ban User</button>}
                                                    </div>
                                                )}

                                                <div
                                                    onClick={() => (isAdmin || isStaff) && !isMe ? setSelectedUser(selectedUser === msg.userId ? null : msg.userId) : null}
                                                    className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm relative transition-all cursor-${(isAdmin || isStaff) && !isMe ? 'pointer' : 'default'} ${isMe
                                                        ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-tr-sm shadow-violet-900/20'
                                                        : 'bg-[#1a1a1a] text-gray-200 rounded-tl-sm border border-gray-800 hover:border-gray-700'
                                                        } ${msg.role === 'admin' && !isMe ? 'border-violet-500/30 bg-violet-900/10' : ''} ${msg.role === 'staff' && !isMe ? 'border-fuchsia-500/30 bg-fuchsia-900/10' : ''}`}
                                                >
                                                    {msg.imageUrl && (
                                                        <div className="mb-3 rounded-lg overflow-hidden relative group/img">
                                                            <div className="absolute inset-0 bg-black/20 group-hover/img:bg-transparent transition-colors"></div>
                                                            <img src={msg.imageUrl} alt="attachment" className="max-w-full max-h-80 object-cover" />
                                                        </div>
                                                    )}
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );

                            })
                        )}
                        <div ref={messagesEndRef} />

                        {/* Scroll to Bottom Button */}
                        <div className={`fixed bottom-24 right-6 md:right-80 z-30 transition-all duration-300 ${showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                            <button
                                onClick={scrollToBottom}
                                className="w-10 h-10 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 hover:scale-110 active:scale-95 transition flex items-center justify-center"
                            >
                                <i className="fa-solid fa-arrow-down"></i>
                            </button>
                        </div>
                    </div>

                    {/* Input Area */}
                    {!isBanned && !isTimedOut && (
                        <div className="p-3 md:p-6 bg-[#0a0a0a] border-t border-white/5 safe-area-bottom">
                            {settings.chatEnabled ? (currentUser ? (
                                <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                                    <div className="relative flex bg-[#111] rounded-2xl p-1.5 md:p-2 items-end gap-2 shadow-2xl">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors shrink-0"
                                            title="Upload Image"
                                        >
                                            <i className="fa-solid fa-image text-lg"></i>
                                        </button>
                                        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />

                                        <div className="flex-1 flex flex-col justify-center min-h-[48px]">
                                            {imagePreview && (
                                                <div className="relative w-fit mb-2 mt-2 group/preview">
                                                    <img src={imagePreview} alt="preview" className="h-20 rounded-lg border border-gray-700" />
                                                    <button onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md opacity-0 group-hover/preview:opacity-100 transition"><i className="fa-solid fa-xmark"></i></button>
                                                </div>
                                            )}
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder={`Message as ${currentUser.username}...`}
                                                className="w-full bg-transparent text-gray-200 placeholder-gray-600 focus:outline-none px-2 font-medium"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() && !imagePreview}
                                            className="p-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl shadow-lg shadow-fuchsia-900/20 hover:shadow-fuchsia-600/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation"
                                        >
                                            <i className="fa-solid fa-paper-plane"></i>
                                        </button>
                                    </div>
                                    {error && <p className="text-red-500 text-xs mt-2 ml-2 font-bold"><i className="fa-solid fa-circle-exclamation mr-1"></i> {error}</p>}
                                </form>
                            ) : (
                                <div className="text-center py-4 bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
                                    <p className="text-gray-500 mb-2">You must be logged in to chat.</p>
                                    <a href="/login" className="inline-block px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition">Log In</a>
                                </div>
                            )) : (
                                <div className="text-center py-4 text-gray-500 bg-gray-900/30 rounded-2xl border border-gray-800">
                                    <i className="fa-solid fa-lock mr-2"></i> Chat is currently disabled.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Sidebar: Online Users */}
                <aside className={`${showUsersSidebar ? 'translate-x-0 bg-[#0a0a0a]' : 'translate-x-full md:translate-x-0'} fixed md:relative right-0 inset-y-0 w-72 bg-[#050505] border-l border-white/5 z-40 transition-transform duration-300 md:flex flex-col`}>
                    <div className="h-20 flex items-center px-6 border-b border-white/5">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <i className="fa-solid fa-earth-americas text-gray-600"></i> Online Members <span className="text-white bg-white/10 px-1.5 rounded text-xs">{connectedUsers.length}</span>
                        </h2>
                        <button onClick={() => setShowUsersSidebar(false)} className="md:hidden ml-auto text-gray-500"><i className="fa-solid fa-xmark"></i></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                        {/* Admins */}
                        {connectedUsers.some(u => u.role === 'admin') && (
                            <div>
                                <h3 className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-3 px-2">Administrators</h3>
                                <div className="space-y-2">
                                    {connectedUsers.filter(u => u.role === 'admin').map(u => (
                                        <div key={u.userId} className="flex items-center gap-3 p-2 rounded-xl bg-violet-500/5 border border-violet-500/10">
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-violet-500/20">{u.username[0].toUpperCase()}</div>
                                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full"></div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-violet-200">{u.username}</p>
                                                <p className="text-[9px] text-violet-400/60 uppercase font-bold tracking-wider">Owner</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Staff */}
                        {connectedUsers.some(u => u.role === 'staff') && (
                            <div>
                                <h3 className="text-[10px] font-bold text-fuchsia-500 uppercase tracking-widest mb-3 px-2">Staff Team</h3>
                                <div className="space-y-2">
                                    {connectedUsers.filter(u => u.role === 'staff').map(u => (
                                        <div key={u.userId} className="flex items-center gap-3 p-2 rounded-xl bg-fuchsia-500/5 border border-fuchsia-500/10">
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-600 to-pink-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-fuchsia-500/20">{u.username[0].toUpperCase()}</div>
                                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full"></div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-fuchsia-200">{u.username}</p>
                                                <p className="text-[9px] text-fuchsia-400/60 uppercase font-bold tracking-wider">Mod</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Members */}
                        <div>
                            <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 px-2">Members</h3>
                            <div className="space-y-1">
                                {connectedUsers.filter(u => u.role !== 'admin' && u.role !== 'staff').length === 0 ? (
                                    <p className="text-xs text-gray-700 italic px-2">No members online</p>
                                ) : (
                                    connectedUsers.filter(u => u.role !== 'admin' && u.role !== 'staff').map(u => (
                                        <div key={u.userId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition opacity-70 hover:opacity-100">
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">{u.username[0].toUpperCase()}</div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full"></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-300">{u.username}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </aside>
            </main >

            {/* Banned Modal */}
            {
                showBannedModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[70vh] shadow-2xl">
                            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                                <h3 className="font-bold text-white">Banned Users</h3>
                                <button onClick={() => setShowBannedModal(false)} className="text-gray-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
                            </div>
                            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                                {bannedUsers.length === 0 ? <p className="text-center text-gray-600 text-sm py-8">No banned users.</p> : (
                                    <ul className="space-y-2">
                                        {bannedUsers.map(u => (
                                            <li key={u.userId} className="flex justify-between items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
                                                <span className="text-gray-300 text-sm font-bold">{u.username}</span>
                                                <button onClick={() => { handleAdminAction('unban', u.userId); }} className="text-xs text-emerald-400 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-bold transition">Unban</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default GlobalChat;
