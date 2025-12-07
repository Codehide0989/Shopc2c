import React, { useState } from "react";
import { User } from "../types";
import { db } from "../services/db";
import { AuthManager } from "../services/auth";

interface LoginProps {
    onUserLogin: (u: User) => void;
    onAdminLogin: () => void;
    onSwitch: () => void;
    maintenanceMode: boolean;
}

const Login: React.FC<LoginProps> = ({ onUserLogin, onAdminLogin, onSwitch, maintenanceMode }) => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const settings = db.getSettings();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (AuthManager.loginAdmin(identifier, password)) {
            onAdminLogin();
            return;
        }

        if (maintenanceMode) {
            setError("System Under Maintenance: Admin Access Only");
            return;
        }

        db.loginUser(identifier, password).then(u => {
            if (u) onUserLogin(u);
            else setError("Invalid credentials");
        });
    };

    return (
        <div className="flex min-h-screen bg-gray-950">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center bg-gray-900">
                <div className="absolute inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1600" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 to-gray-950"></div>
                </div>
                <div className="relative z-10 p-12 text-center max-w-lg">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                        <i className="fa-solid fa-cubes-stacked text-3xl text-white"></i>
                    </div>
                    <h1 className="text-5xl font-display font-bold text-white mb-4">Welcome to {settings.storeName}</h1>
                    <p className="text-xl text-gray-300 font-light">Your gateway to premium digital assets. Secure, fast, and community-driven.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-transparent lg:hidden"></div>
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-white font-display">Sign in to account</h2>
                        <p className="text-gray-400 mt-2">Enter your credentials to access your assets.</p>
                    </div>

                    {maintenanceMode && (
                        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-400">
                            <i className="fa-solid fa-lock text-xl"></i>
                            <div>
                                <p className="font-bold">Maintenance Mode Active</p>
                                <p className="text-xs">Only administrators can log in at this time.</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <i className="fa-solid fa-circle-exclamation"></i> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Username or Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><i className="fa-solid fa-user"></i></div>
                                <input type="text" className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition" placeholder="Enter your ID or username" value={identifier} onChange={e => setIdentifier(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><i className="fa-solid fa-key"></i></div>
                                <input type="password" className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                        </div>

                        <button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-violet-900/20 transform hover:-translate-y-0.5">
                            Log In
                        </button>
                    </form>

                    {!maintenanceMode && (
                        <div className="text-center border-t border-gray-800 pt-6">
                            <p className="text-gray-400 text-sm">
                                Don't have an account?
                                <button onClick={onSwitch} className="text-violet-400 hover:text-white font-bold ml-1 transition">Create one now</button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
