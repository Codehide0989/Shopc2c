import React, { useState, useRef, useEffect } from "react";
import { User, AppSettings } from "../types";
import { db } from "../services/db";

interface NavbarProps {
    onNavigate: (view: string) => void;
    activeView: string;
    isAdmin: boolean;
    user: User | null;
    onLogoutUser: () => void;
    settings: AppSettings;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, activeView, isAdmin, user, onLogoutUser, settings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#030303]/80 backdrop-blur-xl transition-all duration-300">
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-50"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-20">
                    {/* Logo */}
                    <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => onNavigate("home")}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center animate-glow group-hover:scale-105 transition shadow-lg shadow-violet-900/20">
                            <i className="fa-solid fa-cubes-stacked text-white text-lg"></i>
                        </div>
                        <span className="text-xl md:text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:from-violet-400 group-hover:to-fuchsia-400 transition-all">
                            {settings.storeName}
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {['home', 'about', 'contact', 'community', 'c2c-ide'].map((view) => (
                            <button
                                key={view}
                                onClick={() => onNavigate(view)}
                                className={`relative px-4 lg:px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 group overflow-hidden ${activeView === view ? "text-white" : "text-gray-400 hover:text-white"}`}
                            >
                                <span className="relative z-10 capitalize">{view}</span>
                                {activeView === view && (
                                    <div className="absolute inset-0 bg-white/10 rounded-full border border-white/5 shadow-[0_0_15px_rgba(255,255,255,0.1)]"></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-violet-600/10 to-violet-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            </button>
                        ))}

                        <div className="w-px h-8 bg-gray-800 mx-3 lg:mx-6"></div>

                        {(isAdmin || user?.role === 'staff') && (
                            <button onClick={() => onNavigate("admin")} className="mr-4 text-sm font-bold text-white bg-[#2e1065] hover:bg-[#3b0764] px-4 py-2 rounded-lg border border-violet-500/30 transition flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                                <i className="fa-solid fa-shield-halved"></i> <span className="hidden lg:inline">{user?.role === 'staff' ? 'Staff' : 'Dashboard'}</span>
                            </button>
                        )}

                        {user ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className={`flex items-center space-x-3 pl-2 pr-4 py-1.5 rounded-full transition border ${isProfileOpen ? "bg-gray-800 border-violet-500/50" : "bg-gray-900/50 border-gray-700 hover:border-gray-600"}`}
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <span className="text-sm text-gray-200 font-medium max-w-[100px] truncate hidden lg:block">{user.username}</span>
                                    <i className={`fa-solid fa-chevron-down text-xs text-gray-500 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}></i>
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-3 w-60 bg-[#0a0a0a] border border-gray-800 rounded-2xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                        <div className="px-4 py-4 border-b border-gray-800 mb-2">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Signed in as</p>
                                            <p className="text-white font-bold truncate text-lg">{user.username}</p>
                                        </div>

                                        <button onClick={() => { onNavigate("profile"); setIsProfileOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 flex items-center gap-3 transition">
                                            <i className="fa-solid fa-user w-5 text-center text-violet-400"></i> My Profile
                                        </button>
                                        <button onClick={() => { onNavigate("orders"); setIsProfileOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 flex items-center gap-3 transition">
                                            <i className="fa-solid fa-box w-5 text-center text-emerald-400"></i> My Orders
                                        </button>
                                        <button onClick={() => { onNavigate("community"); setIsProfileOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 flex items-center gap-3 transition">
                                            <i className="fa-solid fa-users w-5 text-center text-blue-400"></i> Community Forum
                                        </button>
                                        <button onClick={() => { onNavigate("c2c-ide"); setIsProfileOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 flex items-center gap-3 transition">
                                            <i className="fa-solid fa-code w-5 text-center text-pink-400"></i> C2C IDE
                                        </button>

                                        <div className="h-px bg-gray-800 my-2"></div>

                                        <button onClick={() => { onLogoutUser(); setIsProfileOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition mb-1">
                                            <i className="fa-solid fa-right-from-bracket w-5 text-center"></i> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <button onClick={() => onNavigate("login")} className="text-sm font-medium text-gray-300 hover:text-white px-5 py-2.5 hover:bg-white/5 rounded-xl transition">Log In</button>
                                <button onClick={() => onNavigate("signup")} className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-bold transition hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] transform hover:-translate-y-0.5">
                                    Get Started
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        {user && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white shadow-inner" onClick={() => onNavigate("profile")}>
                                {user.username[0].toUpperCase()}
                            </div>
                        )}
                        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-white p-2.5 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-gray-700">
                            <i className={`fa-solid ${isOpen ? "fa-xmark" : "fa-bars"} text-xl`}></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="md:hidden glass-panel border-b border-gray-800 fixed inset-0 top-[64px] bg-[#050505]/98 z-40 backdrop-blur-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
                    <div className="p-6 space-y-6 min-h-[calc(100vh-64px)] flex flex-col">
                        {user && (
                            <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800 flex items-center gap-4 shadow-lg">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-xl font-bold text-white shadow-lg ring-2 ring-white/10">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-xl truncate">{user.username}</p>
                                    <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mt-1">Logged In</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 flex-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Menu</p>
                            {[
                                { view: 'home', icon: 'fa-store', label: 'Store' },
                                { view: 'about', icon: 'fa-circle-info', label: 'About Us' },
                                { view: 'contact', icon: 'fa-envelope', label: 'Contact' },
                                { view: 'chat', icon: 'fa-comments', label: 'Global Chat' },
                                { view: 'community', icon: 'fa-users', label: 'Community Forum' },
                                { view: 'c2c-ide', icon: 'fa-code', label: 'C2C IDE' }
                            ].map((item) => (
                                <button
                                    key={item.view}
                                    onClick={() => { onNavigate(item.view); setIsOpen(false); }}
                                    className={`w-full text-left px-5 py-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition flex items-center gap-4 ${activeView === item.view ? 'bg-gray-800 text-white border border-gray-700' : ''}`}
                                >
                                    <i className={`fa-solid ${item.icon} w-6 text-center opacity-70`}></i>
                                    <span className="font-medium text-lg">{item.label}</span>
                                    {activeView === item.view && <i className="fa-solid fa-chevron-right ml-auto text-xs opacity-50"></i>}
                                </button>
                            ))}
                        </div>

                        {user ? (
                            <div className="pt-6 border-t border-gray-800">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 mb-4">Account</p>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button onClick={() => { onNavigate("profile"); setIsOpen(false); }} className="text-left px-4 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl transition flex flex-col gap-2 border border-gray-800">
                                        <i className="fa-solid fa-user text-violet-400 text-xl mb-1"></i>
                                        <span className="text-xs font-bold text-gray-400">Profile</span>
                                    </button>
                                    <button onClick={() => { onNavigate("orders"); setIsOpen(false); }} className="text-left px-4 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl transition flex flex-col gap-2 border border-gray-800">
                                        <i className="fa-solid fa-box text-emerald-400 text-xl mb-1"></i>
                                        <span className="text-xs font-bold text-gray-400">Orders</span>
                                    </button>
                                </div>

                                {(isAdmin || user?.role === 'staff') && (
                                    <button onClick={() => { onNavigate("admin"); setIsOpen(false); }} className="w-full text-left px-5 py-4 text-fuchsia-400 hover:bg-fuchsia-500/10 rounded-xl border border-fuchsia-500/20 font-bold flex items-center gap-3 mb-3">
                                        <i className="fa-solid fa-shield-halved w-6 text-center"></i> {user?.role === 'staff' ? 'Staff Dashboard' : 'Admin Dashboard'}
                                    </button>
                                )}

                                <button onClick={() => { onLogoutUser(); setIsOpen(false); }} className="w-full text-left px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-xl transition flex items-center gap-3 border border-red-500/10">
                                    <i className="fa-solid fa-right-from-bracket w-6 text-center"></i> Sign Out
                                </button>
                            </div>
                        ) : (
                            <div className="pt-6 border-t border-gray-800">
                                <button onClick={() => { onNavigate("login"); setIsOpen(false); }} className="w-full py-4 text-white bg-violet-600 rounded-xl font-bold shadow-lg hover:bg-violet-500 transition mb-3 text-lg">Log In</button>
                                <button onClick={() => { onNavigate("signup"); setIsOpen(false); }} className="w-full py-4 text-white bg-gray-800 rounded-xl font-bold hover:bg-gray-700 transition text-lg border border-gray-700">Create Account</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
