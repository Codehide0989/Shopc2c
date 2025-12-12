import React, { useEffect, useState } from "react";
import { User, Product, UserPermission, Order } from "../types";
import { db } from "../services/db";

interface ProfileProps {
    user: User;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
    const [myAssets, setMyAssets] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // First sync permissions for free products
                let permissions = await db.getPermissions(user.userId);
                try {
                    const synced = await db.syncFreePermissions(user.userId);
                    if (synced && synced.length > 0) permissions = synced;
                } catch (syncErr) {
                    console.error("Failed to sync free permissions", syncErr);
                }

                const [allProducts, allOrders] = await Promise.all([
                    db.getProducts(),
                    db.getOrders()
                ]);

                // Filter products that are free OR user has permission for
                const owned = allProducts.filter(prod =>
                    prod.priceInr === 0 || permissions.some((perm: UserPermission) => perm.productId === prod.id)
                );
                setMyAssets(owned);
                setOrders(allOrders.filter((o: Order) => o.userId === user.userId));
                if (owned.length === 0) {
                    setSuggestedProducts(allProducts.slice(0, 3)); // Show top 3 products
                }
            } catch (error) {
                console.error("Failed to fetch profile data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user.userId]);

    // Countdown Timer Logic
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number; ms: number }>({
        d: 48, h: 1, m: 39, s: 27, ms: 0
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { d, h, m, s, ms } = prev;
                if (ms > 0) ms--;
                else {
                    ms = 99;
                    if (s > 0) s--;
                    else {
                        s = 59;
                        if (m > 0) m--;
                        else {
                            m = 59;
                            if (h > 0) h--;
                            else {
                                h = 23;
                                if (d > 0) d--;
                                // Stop at 0
                            }
                        }
                    }
                }
                return { d, h, m, s, ms };
            });
        }, 10);
        return () => clearInterval(timer);
    }, []);

    const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (loading) {
        return (
            <div className="min-h-screen pt-20 pb-20 px-4 bg-[#050505] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-20 px-4 bg-[#050505] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[128px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Member Card Section */}
                <div className="flex justify-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="relative w-full max-w-[480px] aspect-[1.586/1] bg-[#0a0a0a] rounded-[2rem] overflow-hidden shadow-2xl shadow-violet-900/20 border border-white/10 group select-none transition-all duration-500 hover:scale-[1.02] hover:shadow-violet-900/30">
                        {/* Card Background Effects */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay"></div>
                        <div className="absolute -top-32 -right-32 w-80 h-80 bg-violet-600/30 rounded-full blur-[100px] group-hover:bg-violet-600/40 transition duration-1000"></div>
                        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-fuchsia-600/30 rounded-full blur-[100px] group-hover:bg-fuchsia-600/40 transition duration-1000"></div>

                        {/* Chip */}
                        <div className="absolute top-8 right-8 w-14 h-11 bg-gradient-to-br from-yellow-100 to-yellow-600 rounded-lg shadow-lg shadow-yellow-900/20 flex items-center justify-center overflow-hidden border border-yellow-400/50 z-20">
                            <div className="w-full h-[1px] bg-yellow-800/20 absolute top-1/3"></div>
                            <div className="w-full h-[1px] bg-yellow-800/20 absolute bottom-1/3"></div>
                            <div className="h-full w-[1px] bg-yellow-800/20 absolute left-1/3"></div>
                            <div className="h-full w-[1px] bg-yellow-800/20 absolute right-1/3"></div>
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"></div>
                        </div>

                        {/* Card Content */}
                        <div className="relative h-full p-6 sm:p-8 flex flex-col justify-between z-10">
                            {/* Top Row */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tighter uppercase font-display italic">
                                        SHOP C2C
                                    </h2>
                                    <p className="text-[10px] font-bold tracking-[0.3em] text-violet-400 uppercase mt-1">Premium Member</p>
                                </div>
                            </div>

                            {/* Middle Row - User Info */}
                            <div className="flex items-center gap-5 sm:gap-6 mt-4">
                                <div className="relative group/avatar">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-gray-700/50 flex items-center justify-center text-3xl font-bold text-gray-500 overflow-hidden shadow-inner ring-2 ring-transparent group-hover/avatar:ring-violet-500/50 transition-all duration-300">
                                        <span className="bg-gradient-to-br from-violet-400 to-fuchsia-400 bg-clip-text text-transparent transform group-hover/avatar:scale-110 transition duration-500">
                                            {user.username[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white text-black rounded-full shadow-lg flex items-center justify-center text-xs hover:bg-gray-200 transition-colors duration-200">
                                        <i className="fa-solid fa-camera"></i>
                                    </button>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight mb-1 truncate">{user.username}</h1>
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-[10px] sm:text-xs font-mono text-gray-400 tracking-wider">ID: <span className="text-gray-300">{user.userId.substring(0, 8).toUpperCase()}</span></p>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Since {joinDate}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Row - Valid Thru & Badge */}
                            <div className="flex justify-between items-end mt-4">
                                <div>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Offer Expires In</p>
                                    <div className="font-mono text-lg sm:text-2xl font-bold text-white tracking-widest flex gap-1.5 sm:gap-2 items-baseline text-shadow-glow">
                                        <span className="tabular-nums">{timeLeft.d.toString().padStart(2, '0')}</span>
                                        <span className="text-violet-500 animate-pulse">:</span>
                                        <span className="tabular-nums">{timeLeft.h.toString().padStart(2, '0')}</span>
                                        <span className="text-violet-500 animate-pulse">:</span>
                                        <span className="tabular-nums">{timeLeft.m.toString().padStart(2, '0')}</span>
                                        <span className="text-violet-500 animate-pulse">:</span>
                                        <span className="tabular-nums">{timeLeft.s.toString().padStart(2, '0')}</span>
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Active</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Library Section */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 justify-center md:justify-start">
                        <i className="fa-solid fa-layer-group text-violet-500"></i> My Library
                    </h2>

                    {myAssets.length === 0 ? (
                        <div className="space-y-8">
                            <div className="text-center py-16 bg-gray-900/20 rounded-3xl border border-gray-800 border-dashed backdrop-blur-sm">
                                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <i className="fa-solid fa-box-open text-3xl text-gray-600"></i>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Your library is empty</h3>
                                <p className="text-gray-500 mb-8 max-w-md mx-auto px-4">Looks like you haven't purchased any assets yet. Check out some of our popular items below.</p>
                                <button onClick={() => window.location.href = '/'} className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition transform hover:-translate-y-1">
                                    Browse Store
                                </button>
                            </div>

                            {suggestedProducts.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-4">Recommended for You</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {suggestedProducts.map((asset, idx) => (
                                            <div key={asset.id} className="group bg-[#0a0a0a] rounded-2xl border border-gray-800 p-4 hover:border-violet-500/50 transition duration-300 hover:shadow-2xl hover:shadow-violet-500/10" style={{ animationDelay: `${idx * 50}ms` }}>
                                                <div className="flex gap-5">
                                                    <div className="w-24 h-24 rounded-xl overflow-hidden relative flex-shrink-0">
                                                        <img src={asset.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={asset.title} />
                                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition"></div>
                                                    </div>
                                                    <div className="flex-1 flex flex-col justify-center min-w-0">
                                                        <span className="text-[10px] font-bold tracking-wider text-violet-400 uppercase mb-1 bg-violet-500/10 px-2 py-1 rounded w-fit">{asset.type}</span>
                                                        <h3 className="font-bold text-white text-lg leading-tight mb-1 line-clamp-1 group-hover:text-violet-400 transition" title={asset.title}>{asset.title}</h3>
                                                        <div className="mt-auto pt-2">
                                                            <button onClick={() => window.location.href = `/product/${asset.id}`} className="text-xs bg-gray-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition flex items-center gap-2 w-fit">
                                                                View Details
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myAssets.map((asset, idx) => (
                                <div key={asset.id} className="group bg-[#0a0a0a] rounded-2xl border border-gray-800 p-4 hover:border-violet-500/50 transition duration-300 hover:shadow-2xl hover:shadow-violet-500/10" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="flex gap-5">
                                        <div className="w-24 h-24 rounded-xl overflow-hidden relative flex-shrink-0">
                                            <img src={asset.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={asset.title} />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition"></div>
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center min-w-0">
                                            <span className="text-[10px] font-bold tracking-wider text-violet-400 uppercase mb-1 bg-violet-500/10 px-2 py-1 rounded w-fit">{asset.type}</span>
                                            <h3 className="font-bold text-white text-lg leading-tight mb-1 line-clamp-1 group-hover:text-violet-400 transition" title={asset.title}>{asset.title}</h3>
                                            <div className="mt-auto pt-2">
                                                <button onClick={() => {
                                                    window.open(asset.downloadUrl, "_blank");
                                                }} className="text-xs bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition flex items-center gap-2 w-fit">
                                                    <i className="fa-solid fa-download"></i> Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>


                {/* Order History Section */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 mt-16 border-t border-gray-800/50 pt-16">
                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 justify-center md:justify-start">
                        <i className="fa-solid fa-clock-rotate-left text-fuchsia-500"></i> Order History
                    </h2>

                    {orders.length === 0 ? (
                        <div className="text-center py-12 bg-gray-900/20 rounded-3xl border border-gray-800 border-dashed">
                            <p className="text-gray-500">No recent orders found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.slice().reverse().map((order) => (
                                <div key={order.id} className="bg-gray-900/40 border border-gray-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-gray-900/60 transition">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${order.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                            order.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            <i className={`fa-solid ${order.status === 'approved' ? 'fa-check' :
                                                order.status === 'rejected' ? 'fa-xmark' : 'fa-clock'
                                                }`}></i>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{order.productTitle}</h3>
                                            <p className="text-xs text-gray-500 font-mono">ID: {order.id} • {new Date(order.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-mono font-bold">{order.amount.toLocaleString()} {order.currency}</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                            order.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Profile;
