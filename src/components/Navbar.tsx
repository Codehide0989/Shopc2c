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
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => onNavigate("home")}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center animate-glow group-hover:scale-105 transition shadow-lg shadow-violet-900/20">
                            <i className="fa-solid fa-cubes-stacked text-white text-sm"></i>
                        </div>
                        <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:from-violet-400 group-hover:to-fuchsia-400 transition-all">
                            {settings.storeName}
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {['home', 'about', 'contact', 'chat'].map((view) => (
                            <button
                                key={view}
                                onClick={() => onNavigate(view)}
                                className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 group overflow-hidden ${activeView === view ? "text-white" : "text-gray-400 hover:text-white"}`}
                            >
                                <span className="relative z-10 capitalize">{view}</span>
                                {activeView === view && (
                                    <div className="absolute inset-0 bg-white/10 rounded-full border border-white/5 shadow-[0_0_15px_rgba(255,255,255,0.1)]"></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-violet-600/10 to-violet-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            </button>
                        ))}

                        {(isAdmin || user?.role === 'staff') && (
                            <button onClick={() => onNavigate("admin")} className="ml-2 text-sm font-bold text-white bg-[#2e1065] hover:bg-[#3b0764] px-4 py-2 rounded-lg border border-violet-500/30 transition flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                                <i className="fa-solid fa-shield-halved"></i> {user?.role === 'staff' ? 'Staff' : 'Dashboard'}
                            </button>
                        )}

                        <div className="w-px h-6 bg-gray-800 mx-4"></div>

                        {user ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className={`flex items-center space-x-3 pl-2 pr-4 py-1.5 rounded-full transition border ${isProfileOpen ? "bg-gray-800 border-violet-500/50" : "bg-gray-900/50 border-gray-700 hover:border-gray-600"}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <span className="text-sm text-gray-200 font-medium max-w-[100px] truncate">{user.username}</span>
                                    <i className={`fa-solid fa-chevron-down text-xs text-gray-500 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}></i>
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-[#0a0a0a] border border-gray-800 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                        <div className="px-4 py-3 border-b border-gray-800 mb-2">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Signed in as</p>
                                            <p className="text-white font-bold truncate">{user.username}</p>
                                        </div>

                                        <button onClick={() => { onNavigate("profile"); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 flex items-center gap-3 transition">
                                            <i className="fa-solid fa-user w-4 text-center text-violet-400"></i> My Profile
                                        </button>
                                        <button onClick={() => { onNavigate("orders"); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 flex items-center gap-3 transition">
                                            <i className="fa-solid fa-box w-4 text-center text-emerald-400"></i> My Orders
                                        </button>

                                        <div className="h-px bg-gray-800 my-2"></div>

                                        <button onClick={() => { onLogoutUser(); setIsProfileOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition">
                                            <i className="fa-solid fa-right-from-bracket w-4 text-center"></i> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <button onClick={() => onNavigate("login")} className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition">Log In</button>
                                <button onClick={() => onNavigate("signup")} className="px-5 py-2 rounded-lg bg-gray-200 text-black text-sm font-bold transition hover:bg-white shadow-lg shadow-white/5 transform hover:-translate-y-0.5">
                                    Get Started
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-white/5 transition">
                            <i className={`fa-solid ${isOpen ? "fa-xmark" : "fa-bars"} text-xl`}></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="md:hidden glass-panel border-b border-gray-800 fixed inset-x-0 top-16 bg-[#050505]/95 z-40 backdrop-blur-2xl animate-in slide-in-from-top duration-200 shadow-2xl h-[calc(100vh-4rem)] overflow-y-auto">
                    <div className="p-4 space-y-2">
                        {user && (
                            <div className="bg-gray-900/50 rounded-xl p-4 mb-4 border border-gray-800 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-white font-bold text-lg">{user.username}</p>
                                    <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">Member</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <button onClick={() => { onNavigate("home"); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition flex items-center gap-3">
                                <i className="fa-solid fa-store w-5 text-center opacity-50"></i> Store
                            </button>
                            <button onClick={() => { onNavigate("about"); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition flex items-center gap-3">
                                <i className="fa-solid fa-circle-info w-5 text-center opacity-50"></i> About Us
                            </button>
                            <button onClick={() => { onNavigate("contact"); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition flex items-center gap-3">
                                <i className="fa-solid fa-envelope w-5 text-center opacity-50"></i> Contact
                            </button>
                            <button onClick={() => { onNavigate("chat"); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition flex items-center gap-3">
                                <i className="fa-solid fa-comments w-5 text-center opacity-50"></i> Global Chat
                            </button>
                        </div>

                        {user ? (
                            <>
                                <div className="h-px bg-gray-800 my-2"></div>
                                <div className="space-y-1">
                                    <button onClick={() => { onNavigate("profile"); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition flex items-center gap-3">
                                        <i className="fa-solid fa-user w-5 text-center text-violet-400"></i> My Profile
                                    </button>
                                    <button onClick={() => { onLogoutUser(); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition flex items-center gap-3">
                                        <i className="fa-solid fa-right-from-bracket w-5 text-center"></i> Sign Out
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="pt-4">
                                <button onClick={() => { onNavigate("login"); setIsOpen(false); }} className="w-full py-3 text-white bg-violet-600 rounded-xl font-bold shadow-lg hover:bg-violet-500 transition mb-3">Log In</button>
                                <button onClick={() => { onNavigate("signup"); setIsOpen(false); }} className="w-full py-3 text-white bg-gray-800 rounded-xl font-bold hover:bg-gray-700 transition">Create Account</button>
                            </div>
                        )}

                        {(isAdmin || user?.role === 'staff') && (
                            <div className="pt-4 border-t border-gray-800 mt-2">
                                <button onClick={() => { onNavigate("admin"); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-fuchsia-400 hover:bg-fuchsia-500/10 rounded-xl border border-fuchsia-500/20 font-bold flex items-center gap-3">
                                    <i className="fa-solid fa-shield-halved w-5 text-center"></i> {user?.role === 'staff' ? 'Staff Dashboard' : 'Admin Dashboard'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
