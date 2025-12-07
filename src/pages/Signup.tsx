import React, { useState } from "react";
import { User } from "../types";
import { db } from "../services/db";

interface SignupProps {
    onLogin: (u: User) => void;
    onSwitch: () => void;
}

const Signup: React.FC<SignupProps> = ({ onLogin, onSwitch }) => {
    const [formData, setFormData] = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState("");
    const settings = db.getSettings();

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        db.createUser(formData).then(onLogin).catch(e => setError(e.message));
    };

    return (
        <div className="flex min-h-screen bg-gray-950">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center bg-gray-900">
                <div className="absolute inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1600" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-tl from-fuchsia-900/50 to-gray-950"></div>
                </div>
                <div className="relative z-10 p-12 text-center max-w-lg">
                    <h1 className="text-5xl font-display font-bold text-white mb-4">Join the Grid</h1>
                    <p className="text-xl text-gray-300 font-light mb-8">Create an account to unlock exclusive content and join our growing community of creators.</p>

                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                            <i className="fa-solid fa-bolt text-yellow-400 mb-2 text-xl"></i>
                            <h3 className="font-bold text-white">Instant Access</h3>
                            <p className="text-xs text-gray-400">Download assets immediately after purchase.</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                            <i className="fa-solid fa-shield-halved text-emerald-400 mb-2 text-xl"></i>
                            <h3 className="font-bold text-white">Secure Identity</h3>
                            <p className="text-xs text-gray-400">Your unique ID keeps your library safe.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-transparent lg:hidden"></div>
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-white font-display">Create Account</h2>
                        <p className="text-gray-400 mt-2">Start your journey with {settings.storeName}.</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <i className="fa-solid fa-circle-exclamation"></i> {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><i className="fa-solid fa-user"></i></div>
                                <input type="text" className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition" placeholder="Choose a username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><i className="fa-solid fa-envelope"></i></div>
                                <input type="email" className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition" placeholder="name@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><i className="fa-solid fa-key"></i></div>
                                <input type="password" className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition" placeholder="Create a strong password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                        </div>

                        <button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-violet-900/20 transform hover:-translate-y-0.5">
                            Sign Up
                        </button>
                    </form>

                    <div className="text-center border-t border-gray-800 pt-6">
                        <p className="text-gray-400 text-sm">
                            Already have an account?
                            <button onClick={onSwitch} className="text-violet-400 hover:text-white font-bold ml-1 transition">Log In</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
