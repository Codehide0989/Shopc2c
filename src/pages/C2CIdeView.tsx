import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { C2CIde } from '../types';

interface C2CIdeViewProps {
    ideId: string;
    onBack: () => void;
}

const C2CIdeView: React.FC<C2CIdeViewProps> = ({ ideId, onBack }) => {
    const [ide, setIde] = useState<C2CIde | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [sessionEnded, setSessionEnded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchIde = async () => {
            const allIdes = await db.getC2CIdeLinks();
            const found = allIdes.find(i => i.id === ideId);
            if (found) {
                setIde(found);
                setTimeLeft(found.timerDuration * 60); // Duration is in minutes
            }
            setLoading(false);
        };
        fetchIde();
    }, [ideId]);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev === null || prev <= 1) {
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timeLeft === 0 && !sessionEnded) {
            // Timer ended
            if (intervalRef.current) clearInterval(intervalRef.current);
            setSessionEnded(true);
            setTimeout(() => {
                onBack();
            }, 3000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [timeLeft, onBack, sessionEnded]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div className="h-screen bg-black flex items-center justify-center text-white">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!ide) return (
        <div className="h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
            <p className="text-xl">Environment not found.</p>
            <button onClick={onBack} className="px-6 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition">Go Back</button>
        </div>
    );

    return (
        <div className="h-screen w-screen bg-[#050505] flex flex-col overflow-hidden relative">
            {/* Header / Toolbar */}
            {!isFullscreen && (
                <div className="h-14 bg-[#0a0a0a] border-b border-gray-800 flex items-center justify-between px-4 z-50">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            {ide.title}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className={`p-2 rounded-lg transition-colors ${isFullscreen ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-gray-400'}`}
                            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        >
                            <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                        </button>
                        <div className={`px-3 py-1 border rounded-lg flex items-center gap-2 text-xs font-mono font-bold transition-colors ${timeLeft && timeLeft < 60 ? 'bg-red-500/20 border-red-500/50 text-red-500 animate-pulse' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                            <i className="fa-solid fa-clock"></i>
                            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Fullscreen Exit Button */}
            {isFullscreen && (
                <button
                    onClick={() => setIsFullscreen(false)}
                    className="absolute top-4 right-4 z-[60] bg-black/50 hover:bg-black/80 text-white p-2 rounded-lg backdrop-blur-sm transition border border-white/10"
                    title="Exit Fullscreen"
                >
                    <i className="fa-solid fa-compress"></i>
                </button>
            )}

            {/* Iframe */}
            <div className="flex-1 relative bg-black">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#050505] z-10">
                        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                {sessionEnded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50 backdrop-blur-sm animate-in fade-in duration-500">
                        <div className="text-center">
                            <i className="fa-solid fa-hourglass-end text-4xl text-violet-500 mb-4 animate-bounce"></i>
                            <h2 className="text-2xl font-bold text-white mb-2">Session Expired</h2>
                            <p className="text-gray-400">Closing environment...</p>
                        </div>
                    </div>
                )}
                <iframe
                    src={ide.url}
                    className="w-full h-full border-0"
                    title={ide.title}
                    allow="clipboard-read; clipboard-write; camera; microphone; fullscreen; display-capture"
                    allowFullScreen
                    onLoad={() => setLoading(false)}
                />
            </div>
        </div>
    );
};

export default C2CIdeView;
