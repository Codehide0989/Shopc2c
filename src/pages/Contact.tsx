import React from "react";
import { db } from "../services/db";

const Contact = () => {
    const settings = db.getSettings();
    return (
        <div className="min-h-screen pt-20 pb-20 px-4 bg-[#050505] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[128px] pointer-events-none"></div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                <div className="animate-in fade-in slide-in-from-left-8 duration-700">
                    <span className="text-violet-400 font-bold tracking-widest text-xs uppercase mb-4 block">Support & Sales</span>
                    <h1 className="text-5xl font-display font-black text-white mb-6 tracking-tight">Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Touch</span></h1>
                    <p className="text-gray-400 mb-12 leading-relaxed text-lg font-light">
                        Have a question about a product or need support? Our team is available 24/7 on Discord. For business inquiries, use the form below.
                    </p>

                    <div className="space-y-6 mb-8">
                        <a href={settings.discordLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 text-gray-300 hover:text-white transition group cursor-pointer p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10">
                            <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/20 flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-[0_0_20px_rgba(88,101,242,0.2)]">
                                <i className="fa-brands fa-discord text-2xl text-[#5865F2]"></i>
                            </div>
                            <div>
                                <p className="font-bold text-white text-lg group-hover:text-[#5865F2] transition">Join our Discord</p>
                                <p className="text-sm text-gray-500">Priority Support & Updates</p>
                            </div>
                            <i className="fa-solid fa-arrow-right ml-auto text-gray-600 group-hover:text-white transition"></i>
                        </a>
                        <div className="flex items-center gap-6 text-gray-300 p-4 rounded-2xl border border-transparent">
                            <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
                                <i className="fa-solid fa-envelope text-2xl text-gray-400"></i>
                            </div>
                            <div>
                                <p className="font-bold text-white text-lg">Email Us</p>
                                <p className="text-sm text-gray-500">support@shopc2c.io</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0a0a0a]/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-gray-800 shadow-2xl animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
                    <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                        <i className="fa-solid fa-paper-plane text-violet-500"></i> Send a Message
                    </h3>
                    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert("Message Sent!"); }}>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Name</label>
                                <input placeholder="John Doe" className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                                <input placeholder="john@example.com" className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</label>
                            <input placeholder="How can we help?" className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message</label>
                            <textarea placeholder="Tell us more..." rows={4} className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition resize-none"></textarea>
                        </div>
                        <button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-4 rounded-xl transition shadow-[0_0_20px_rgba(139,92,246,0.3)] transform hover:-translate-y-1">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
