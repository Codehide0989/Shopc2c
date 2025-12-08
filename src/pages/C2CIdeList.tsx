import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { C2CIde } from '../types';

interface C2CIdeListProps {
    onNavigate: (view: string, id?: string) => void;
}

const C2CIdeList: React.FC<C2CIdeListProps> = ({ onNavigate }) => {
    const [ides, setIdes] = useState<C2CIde[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIdes = async () => {
            const data = await db.getC2CIdeLinks();
            setIdes(data);
            setLoading(false);
        };
        fetchIdes();
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] pt-24 pb-12 px-4 md:px-12 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-violet-900/10 to-transparent pointer-events-none z-0"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 animate-in fade-in slide-in-from-bottom-4">
                        C2C <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">IDE</span> Environments
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
                        Launch instant, secure development environments directly in your browser.
                    </p>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : ides.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-gray-800 rounded-3xl bg-white/5">
                        <i className="fa-solid fa-code text-6xl text-gray-600 mb-6"></i>
                        <h3 className="text-2xl font-bold text-white mb-2">No Environments Active</h3>
                        <p className="text-gray-500">Check back later for available coding sessions.</p>
                    </div>
                ) : (

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
                        {ides.map((ide) => (
                            <div
                                key={ide.id}
                                onClick={() => onNavigate('c2c-ide-view', ide.id)}
                                className="group relative bg-[#0a0a0a]/50 backdrop-blur-md border border-gray-800 hover:border-violet-500/50 rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] cursor-pointer hover:-translate-y-2 flex flex-col"
                            >
                                <div className="aspect-[16/10] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gray-900 animate-pulse" />
                                    <img
                                        src={ide.imageUrl}
                                        alt={ide.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-700 relative z-10"
                                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=1000"; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-20 opacity-80"></div>
                                    <div className="absolute top-4 right-4 z-30">
                                        <span className="text-xs font-bold bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            Live
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 md:p-6 flex-1 flex flex-col relative z-30 -mt-12">
                                    <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-xl mb-4 flex-1">
                                        <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-violet-400 transition-colors mb-2 line-clamp-1">{ide.title}</h3>
                                        <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
                                            <span className="flex items-center gap-1.5 bg-white/5 py-1 px-2 rounded-md">
                                                <i className="fa-regular fa-clock"></i> {ide.timerDuration}m session
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-white/5 py-1 px-2 rounded-md truncate max-w-[120px]">
                                                <i className="fa-solid fa-link"></i> Embedded
                                            </span>
                                        </div>
                                    </div>
                                    <button className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-lg shadow-violet-900/20 transition-all flex items-center justify-center gap-2 group/btn relative overflow-hidden">
                                        <span className="relative z-10">Launch Environment</span>
                                        <i className="fa-solid fa-rocket relative z-10 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform"></i>
                                        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-violet-600 translate-x-[-100%] group-hover/btn:translate-x-0 transition-transform duration-500"></div>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default C2CIdeList;
