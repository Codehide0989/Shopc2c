import React from "react";

const About = () => (
    <div className="min-h-screen pt-20 pb-20 px-4 bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[128px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <span className="text-violet-400 font-bold tracking-widest text-xs uppercase mb-4 block">Our Mission</span>
                <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-8 tracking-tight">
                    Empowering <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Creators</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
                    At Shopc2c, we believe in the power of digital assets to accelerate innovation. Our marketplace connects elite developers with creators who need premium workflows, sounds, and designs.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                {[
                    { icon: "fa-bolt", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", title: "Lightning Fast", desc: "Optimized n8n workflows that save you hundreds of hours." },
                    { icon: "fa-shield-halved", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", title: "Secure & Verified", desc: "Every asset is tested by our team to ensure safety and quality." },
                    { icon: "fa-users", color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/20", title: "Community Driven", desc: "Join thousands of creators on our Discord for support." }
                ].map((item, i) => (
                    <div key={i} className={`glass-panel p-8 rounded-3xl border ${item.border} bg-[#0a0a0a]/50 backdrop-blur-xl hover:-translate-y-2 transition duration-500 group`}>
                        <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300`}>
                            <i className={`fa-solid ${item.icon} ${item.color} text-2xl`}></i>
                        </div>
                        <h3 className="text-2xl font-display font-bold text-white mb-3">{item.title}</h3>
                        <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-12 border border-gray-700/50 flex flex-wrap justify-around text-center gap-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 opacity-0 group-hover:opacity-100 transition duration-700"></div>
                <div className="relative z-10">
                    <div className="text-5xl font-display font-black text-white mb-2">10k+</div>
                    <div className="text-gray-400 uppercase text-xs font-bold tracking-widest">Downloads</div>
                </div>
                <div className="relative z-10">
                    <div className="text-5xl font-display font-black text-white mb-2">500+</div>
                    <div className="text-gray-400 uppercase text-xs font-bold tracking-widest">Assets</div>
                </div>
                <div className="relative z-10">
                    <div className="text-5xl font-display font-black text-white mb-2">99.9%</div>
                    <div className="text-gray-400 uppercase text-xs font-bold tracking-widest">Uptime</div>
                </div>
            </div>
        </div>
    </div>
);

export default About;
