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
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-end gap-8 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="relative group mx-auto md:mx-0">
                        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-32 h-32 rounded-full bg-[#0a0a0a] flex items-center justify-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 border-4 border-[#0a0a0a]">
                            {user.username[0].toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#0a0a0a]" title="Online"></div>
                    </div>

                    <div className="flex-1 mb-2 text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-2 tracking-tight">{user.username}</h1>
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-400 text-sm justify-center md:justify-start">
                            <span className="flex items-center gap-2"><i className="fa-solid fa-envelope"></i> {user.email}</span>
                            <span className="hidden md:inline w-1 h-1 bg-gray-700 rounded-full"></span>
                            <span className="flex items-center gap-2"><i className="fa-solid fa-calendar"></i> Joined {joinDate}</span>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto justify-center">
                        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 p-4 rounded-2xl min-w-[140px] flex-1 md:flex-none text-center md:text-left">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Assets</p>
                            <p className="text-3xl font-display font-bold text-white">{myAssets.length}</p>
                        </div>
                        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 p-4 rounded-2xl min-w-[140px] flex-1 md:flex-none text-center md:text-left">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">User ID</p>
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <p className="font-mono text-violet-400 font-bold truncate max-w-[100px]">{user.userId}</p>
                                <button onClick={() => { navigator.clipboard.writeText(user.userId); alert("ID Copied!"); }} className="text-gray-500 hover:text-white transition"><i className="fa-regular fa-copy"></i></button>
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
