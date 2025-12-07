import React, { useState, useEffect } from "react";
import { Product, Category, User, Review, AppSettings, ChatMessage, UserPermission, Coupon, Order } from "../types";
import { db } from "../services/db";
import { generateId } from "../utils/helpers";
import ProductCard from "../components/ProductCard";


interface AdminDashboardProps {
    user: User | null;
    onLogout: () => void;
    onBackToStore: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, onBackToStore }) => {
    // Admin is always admin here, no "isStaff" check needed for restricted view
    const [activeTab, setActiveTab] = useState<"overview" | "products" | "categories" | "users" | "access" | "reviews" | "orders" | "coupons" | "settings" | "server" | "chat">("overview");
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [permissions, setPermissions] = useState<UserPermission[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [serverLogs, setServerLogs] = useState<any[]>([]);
    const [serverStatus, setServerStatus] = useState<any>(null);
    const [loadingServer, setLoadingServer] = useState(false);
    const [settings, setSettings] = useState<AppSettings>({
        discordLink: "",
        storeName: "",
        heroImage: "",
        maintenanceMode: false,
        chatEnabled: true,
        allowedDomains: []
    });
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [adminMessage, setAdminMessage] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [showBannedModal, setShowBannedModal] = useState(false);
    const [bannedUsers, setBannedUsers] = useState<User[]>([]);

    // Edit/Create State
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const [isAddingCoupon, setIsAddingCoupon] = useState(false);
    const [newCouponCode, setNewCouponCode] = useState("");
    const [newCouponPercent, setNewCouponPercent] = useState<number | "">("");

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (activeTab === 'chat') {
            db.getMessages().then(msgs => setChatMessages(msgs));

            const handleMsg = (msg: ChatMessage) => {
                setChatMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            };
            db.onMessage(handleMsg);

            return () => {
                db.offMessage(handleMsg);
            };
        }
    }, [activeTab]);

    useEffect(() => {
        if (showBannedModal) {
            db.getUsers().then(users => {
                setBannedUsers(users.filter(u => u.isBanned));
            });
        }
    }, [showBannedModal]);

    // Refresh Data
    const loadData = async () => {
        setProducts(await db.getProducts());
        setCategories(await db.getCategories());
        setPermissions(await db.getAllPermissions());
        setReviews(await db.getAllReviews());
        setOrders(await db.getOrders());
        const loadedUsers = await db.getUsers();
        setUsers(loadedUsers.filter(u => u)); // Filter out nulls
        setCoupons(await db.getCoupons());
        const loadedSettings = await db.getSettings();
        setSettings(loadedSettings || {
            discordLink: "",
            storeName: "",
            heroImage: "",
            maintenanceMode: false,
            chatEnabled: true,
            allowedDomains: []
        });
        setChatMessages(await db.getMessages());
    };

    const refresh = loadData;

    const checkServer = async () => {
        setLoadingServer(true);
        try {
            const status = await db.checkServerHealth();
            setServerStatus(status);
            const logs = await db.getServerLogs();
            setServerLogs(logs);
        } catch (e: any) {
            setServerStatus({ status: 'offline', message: e.message });
        } finally {
            setLoadingServer(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'server') {
            checkServer();
        }
    }, [activeTab]);

    // Product Actions
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert("File is too large for browser storage! Please use a file smaller than 2MB or host it externally.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result && editingProduct) {
                setEditingProduct({
                    ...editingProduct,
                    downloadUrl: ev.target.result as string,
                    meta: {
                        ...editingProduct.meta,
                        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
                        fileCount: 1 // Default to 1
                    }
                });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProduct = async () => {
        if (!editingProduct || !editingProduct.title) return;

        try {
            const newProd = {
                ...editingProduct,
                _id: editingProduct._id, // Keep existing _id if updating
                id: editingProduct.id || `prod_${generateId()}`,
                features: editingProduct.features || [],
                priceInr: Number(editingProduct.priceInr) || 0,
                priceOwo: Number(editingProduct.priceOwo) || 0,
                meta: editingProduct.meta || {}
            } as Product;

            await db.saveProduct(newProd);
            setEditingProduct(null);
            refresh();
        } catch (e: any) {
            alert("Error saving product: " + e.message);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (confirm("Delete this product?")) {
            await db.deleteProduct(id);
            refresh();
        }
    };

    // Category Actions
    const handleSaveCategory = async () => {
        if (!editingCategory || !editingCategory.name) return;
        const newCat = {
            ...editingCategory,
            _id: editingCategory._id,
            id: editingCategory.id || `cat_${generateId()}`,
        } as Category;

        await db.saveCategory(newCat);
        setEditingCategory(null);
        refresh();
    };

    // User Actions
    const handleSaveUser = async () => {
        if (!editingUser || !editingUser.username || !editingUser.email || !editingUser.password) {
            alert("Please fill in all fields");
            return;
        }
        try {
            await db.createUser(editingUser as any);
            setEditingUser(null);
            refresh();
        } catch (e: any) {
            alert("Error creating user: " + e.message);
        }
    };

    // Access Actions
    const handleGrantAccess = async (userId: string, productId: string) => {
        if (!userId || !productId) return;
        await db.grantPermission(userId, productId);
        refresh();
    };
    const handleRevokeAccess = async (userId: string, productId: string) => {
        if (confirm("Revoke access?")) {
            await db.revokePermission(userId, productId);
            refresh();
        }
    };

    // Review Actions
    const handleReviewAction = async (id: string, status: 'approved' | 'rejected') => {
        await db.updateReviewStatus(id, status);
        refresh();
    };

    // Chat Actions
    const handleBanUser = (userId: string) => {
        if (confirm("Are you sure you want to ban this user?")) {
            db.banUser(userId);
            refresh();
        }
    };

    const handleUnbanUser = (userId: string) => {
        if (confirm("Unban this user?")) {
            db.unbanUser(userId);
            setBannedUsers(prev => prev.filter(u => u.userId !== userId));
            refresh();
        }
    };

    const handleToggleChat = async () => {
        const newStatus = !settings.chatEnabled;
        setSettings(prev => ({ ...prev, chatEnabled: newStatus })); // Optimistic update
        await db.toggleChat(newStatus);
    };



    const handleAdminSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminMessage.trim()) return;

        db.sendMessage("admin", "Admin", adminMessage.trim(), "admin");
        setAdminMessage("");
        // No need to fetch messages again, the socket listener will catch it
    };

    const handleSaveSettings = async () => {
        await db.saveSettings(settings);
        alert("Settings saved!");
        refresh();
    };

    // Coupon Actions
    const handleAddCoupon = async () => {
        if (!newCouponCode || !newCouponPercent) return;
        await db.addCoupon(newCouponCode, Number(newCouponPercent));
        setIsAddingCoupon(false);
        setNewCouponCode("");
        setNewCouponPercent("");
        refresh();
    };

    // Order Actions
    const handleApproveOrder = async (order: Order) => {
        if (confirm("Approve order and grant access?")) {
            await db.grantPermission(order.userId, order.productId);
            await db.updateOrderStatus(order.id, 'approved');
            refresh();
        }
    };

    const handleRejectOrder = async (orderId: string) => {
        if (confirm("Reject order?")) {
            await db.updateOrderStatus(orderId, 'rejected');
            refresh();
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex text-gray-100 font-sans relative">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none z-0"></div>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 ${collapsed ? 'w-20' : 'w-72'} bg-gray-900/80 backdrop-blur-xl border-r border-gray-800/50 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-all duration-300 shadow-2xl flex flex-col`}>
                <div className={`h-24 flex items-center ${collapsed ? 'justify-center px-0' : 'px-8'} border-b border-gray-800/50 bg-gradient-to-r from-gray-900/90 to-gray-800/50 relative`}>
                    {/* Toggle Button for Desktop */}
                    <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-violet-600 rounded-full items-center justify-center text-white text-[10px] shadow-lg hover:scale-110 transition z-50">
                        <i className={`fa-solid fa-chevron-${collapsed ? 'right' : 'left'}`}></i>
                    </button>

                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex-shrink-0 flex items-center justify-center shadow-lg shadow-violet-500/30 ring-1 ring-white/10">
                            <i className="fa-solid fa-layer-group text-white"></i>
                        </div>
                        <div className={`transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                            <span className="text-xl font-display font-bold text-white tracking-wide block leading-none">ShopC2C</span>
                            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Admin Panel</span>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto text-gray-400 hover:text-white transition"><i className="fa-solid fa-xmark text-xl"></i></button>
                </div>

                <nav className="p-4 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="mb-8">
                        {!collapsed && <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 animate-in fade-in">Dashboard</p>}
                        {(['overview', 'products', 'categories', 'users', 'access', 'orders', 'reviews', 'coupons', 'chat', 'server'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSidebarOpen(false); }}
                                className={`w-full text-left ${collapsed ? 'px-0 justify-center' : 'px-4'} py-3.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 group relative overflow-hidden ${activeTab === tab
                                    ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white shadow-[0_0_20px_rgba(124,58,237,0.1)] border border-violet-500/30"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                                title={collapsed ? tab.charAt(0).toUpperCase() + tab.slice(1) : ''}
                            >
                                {activeTab === tab && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-r-full"></div>}
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 transform group-active:scale-90 ${activeTab === tab ? "bg-violet-500 text-white shdaow-lg scale-110" : "bg-gray-800 text-gray-500 group-hover:bg-gray-700 group-hover:text-gray-300"}`}>
                                    <i className={`fa-solid ${tab === 'overview' ? 'fa-chart-pie' :
                                        tab === 'products' ? 'fa-box' :
                                            tab === 'categories' ? 'fa-tags' :
                                                tab === 'users' ? 'fa-users' :
                                                    tab === 'access' ? 'fa-key' :
                                                        tab === 'orders' ? 'fa-money-bill-transfer' :
                                                            tab === 'reviews' ? 'fa-star' :
                                                                tab === 'coupons' ? 'fa-ticket' :
                                                                    tab === 'server' ? 'fa-server' : 'fa-comments'
                                        }`}></i>
                                </span>
                                {!collapsed && <span className="capitalize font-medium animate-in fade-in slide-in-from-left-2 duration-300">{tab}</span>}
                                {!collapsed && activeTab === tab && <i className="fa-solid fa-chevron-right ml-auto text-[10px] text-violet-400 animate-pulse"></i>}
                            </button>
                        ))}
                    </div>

                    <div>
                        {!collapsed && <p className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 animate-in fade-in">Configuration</p>}
                        <button
                            onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
                            className={`w-full text-left ${collapsed ? 'px-0 justify-center' : 'px-4'} py-3.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 group ${activeTab === 'settings' ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white border border-violet-500/30" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                            title={collapsed ? "Settings" : ""}
                        >
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'settings' ? "bg-violet-500 text-white scale-110" : "bg-gray-800 text-gray-500 group-hover:bg-gray-700"}`}>
                                <i className="fa-solid fa-gear"></i>
                            </span>
                            {!collapsed && "Settings"}
                        </button>

                        <div className={`pt-6 mt-6 border-t border-gray-800/50 space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
                            <button onClick={onBackToStore} className={`w-full text-left ${collapsed ? 'px-0 justify-center' : 'px-4'} py-3 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl flex items-center gap-3 transition-all group`} title="Back to Store">
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800 group-hover:bg-emerald-500/20 transition-colors"><i className="fa-solid fa-store text-xs"></i></span>
                                {!collapsed && "Back to Store"}
                            </button>
                            <button onClick={onLogout} className={`w-full text-left ${collapsed ? 'px-0 justify-center' : 'px-4'} py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-all group`} title="Logout">
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800 group-hover:bg-red-500/20 transition-colors"><i className="fa-solid fa-right-from-bracket text-xs"></i></span>
                                {!collapsed && "Logout"}
                            </button>
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 p-6 md:p-12 overflow-y-auto h-screen relative z-10 custom-scrollbar transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-72'}`}>
                <div className="md:hidden mb-6">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 bg-gray-800 rounded text-gray-300"><i className="fa-solid fa-bars"></i> Menu</button>
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <h1 className="text-4xl font-display font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">System Overview</h1>
                                <p className="text-gray-400">Welcome back, Admin. Real-time insights.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-800">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <p className="text-xs text-gray-400 font-mono">LIVE UPDATE</p>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { title: "Total Revenue", value: `₹${permissions.reduce((acc, perm) => acc + (products.find(p => p.id === perm.productId)?.priceInr || 0), 0).toLocaleString()}`, icon: "fa-wallet", color: "from-violet-500 to-indigo-500", sub: "Lifetime Earnings" },
                                { title: "Total Users", value: users.length, icon: "fa-users", color: "from-fuchsia-500 to-pink-500", sub: `${users.filter(u => u.role !== 'user').length} Staff Members` },
                                { title: "Active Products", value: products.length, icon: "fa-box-open", color: "from-blue-500 to-cyan-500", sub: `${categories.length} Categories` },
                                { title: "Total Reviews", value: reviews.length, icon: "fa-star", color: "from-emerald-500 to-teal-500", sub: `${reviews.filter(r => r.status === 'pending').length} Pending` }
                            ].map((stat, idx) => (
                                <div key={idx} className="relative overflow-hidden bg-gray-900/40 backdrop-blur-xl p-6 rounded-3xl border border-gray-800 group hover:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                                    <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                                        <i className={`fa-solid ${stat.icon} text-8xl`}></i>
                                    </div>
                                    <div className="relative z-10">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:rotate-6 transition-transform`}>
                                            <i className={`fa-solid ${stat.icon}`}></i>
                                        </div>
                                        <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-2">{stat.title}</p>
                                        <p className="text-3xl font-display font-bold text-white mb-2">{stat.value}</p>
                                        <p className="text-xs text-gray-600 font-medium">{stat.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'coupons' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Discount Coupons</h1>
                                <p className="text-gray-400 text-sm">Manage promotional codes for your store.</p>
                            </div>
                            <button
                                onClick={() => setIsAddingCoupon(true)}
                                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-fuchsia-600/20 flex items-center gap-2"
                            >
                                <i className="fa-solid fa-plus"></i> Create New
                            </button>
                        </div>

                        {isAddingCoupon && (
                            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                                <div className="bg-gray-900 w-full max-w-sm rounded-2xl border border-gray-700 p-6 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-pink-500"></div>
                                    <h2 className="text-xl font-bold mb-4 text-white">Add New Coupon</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Coupon Code</label>
                                            <input
                                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none font-mono tracking-wider"
                                                placeholder="e.g. SAVE20"
                                                autoFocus
                                                value={newCouponCode}
                                                onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Discount (%)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none"
                                                placeholder="e.g. 20"
                                                max="100"
                                                min="1"
                                                value={newCouponPercent}
                                                onChange={e => setNewCouponPercent(Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <button onClick={handleAddCoupon} disabled={!newCouponCode || !newCouponPercent} className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 py-3 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed">Add Coupon</button>
                                            <button onClick={() => setIsAddingCoupon(false)} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-white border border-gray-700">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {coupons.length === 0 ? (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-3xl bg-gray-900/20">
                                    <i className="fa-solid fa-ticket text-4xl mb-4 opacity-50"></i>
                                    <p>No active coupons found.</p>
                                </div>
                            ) : (
                                coupons.map(coupon => (
                                    <div key={coupon.id} className="group relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 rounded-2xl flex justify-between items-center hover:border-fuchsia-500/30 transition-all hover:bg-gray-900">
                                        <div className="absolute -left-[1px] top-4 bottom-4 w-1 bg-gradient-to-b from-fuchsia-500 to-pink-500 rounded-r-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                        <div>
                                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Code</p>
                                            <p className="font-bold text-white text-xl tracking-wider font-mono">{coupon.code}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-emerald-400 font-bold text-2xl">{coupon.percent}%</p>
                                            <p className="text-xs text-gray-600 font-bold uppercase">Discount</p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (confirm("Delete this coupon?")) {
                                                    await db.deleteCoupon(coupon.id);
                                                    refresh();
                                                }
                                            }}
                                            className="absolute top-2 right-2 p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold text-white">Products</h1>
                            <button
                                onClick={() => setEditingProduct({
                                    title: "", description: "", priceInr: 0, priceOwo: 0,
                                    category: categories[0]?.name || "", features: [],
                                    imageUrl: "", downloadUrl: "", type: "workflow", meta: {}
                                })}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20"
                            >
                                <i className="fa-solid fa-plus mr-2"></i> Add Product
                            </button>
                        </div>

                        {/* Product Edit Modal would go here (simplified for brevity, assume reusable component or same oversized modal) */}
                        {editingProduct && (
                            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                                <div className="bg-gray-900 w-full max-w-6xl h-[90vh] rounded-2xl border border-gray-700 flex overflow-hidden shadow-2xl">
                                    {/* Form */}
                                    <div className="w-1/2 p-8 overflow-y-auto border-r border-gray-800 custom-scrollbar">
                                        <h2 className="text-2xl font-bold mb-6 text-white">Edit Product</h2>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase">Product Title</label>
                                                <input className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" value={editingProduct.title} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-400 font-bold uppercase">Description</label>
                                                <textarea className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none h-32" value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs text-gray-400 font-bold uppercase">Price (INR)</label>
                                                    <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" value={editingProduct.priceInr} onChange={e => setEditingProduct({ ...editingProduct, priceInr: parseInt(e.target.value) })} />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-400 font-bold uppercase">Price (Owo)</label>
                                                    <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" value={editingProduct.priceOwo} onChange={e => setEditingProduct({ ...editingProduct, priceOwo: parseInt(e.target.value) })} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <select className="bg-gray-800 border border-gray-700 rounded p-3 text-white" value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}>
                                                    <option disabled>Select Category</option>
                                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                </select>
                                                <select className="bg-gray-800 border border-gray-700 rounded p-3 text-white" value={editingProduct.type} onChange={e => setEditingProduct({ ...editingProduct, type: e.target.value as any })}>
                                                    <option value="workflow">Workflow</option>
                                                    <option value="pack">Pack</option>
                                                    <option value="audio">Audio</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <input className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" placeholder="Image URL" value={editingProduct.imageUrl} onChange={e => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })} />

                                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                                <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Upload File</label>
                                                <input type="file" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={handleFileUpload} />
                                                <p className="text-xs text-gray-500 mb-2 mt-2">OR enter external URL:</p>
                                                <input className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white" placeholder="https://..." value={editingProduct.downloadUrl || ""} onChange={e => setEditingProduct({ ...editingProduct, downloadUrl: e.target.value })} />
                                            </div>

                                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                                <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase">Metadata</h3>
                                                {editingProduct.type === 'workflow' && (
                                                    <div className="space-y-2">
                                                        <input className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white" placeholder="Node Count" type="number" value={editingProduct.meta?.nodeCount || ""} onChange={e => setEditingProduct({ ...editingProduct, meta: { ...editingProduct.meta, nodeCount: parseInt(e.target.value) } })} />
                                                        <input className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white" placeholder="Trigger (e.g. Cron)" value={editingProduct.meta?.trigger || ""} onChange={e => setEditingProduct({ ...editingProduct, meta: { ...editingProduct.meta, trigger: e.target.value } })} />
                                                    </div>
                                                )}
                                                {editingProduct.type === 'pack' && (
                                                    <div className="space-y-2">
                                                        <input className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white" placeholder="File Count" type="number" value={editingProduct.meta?.fileCount || ""} onChange={e => setEditingProduct({ ...editingProduct, meta: { ...editingProduct.meta, fileCount: parseInt(e.target.value) } })} />
                                                        <input className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white" placeholder="Resolution (e.g. 4K)" value={editingProduct.meta?.resolution || ""} onChange={e => setEditingProduct({ ...editingProduct, meta: { ...editingProduct.meta, resolution: e.target.value } })} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-4 pt-6">
                                                <button onClick={handleSaveProduct} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-white shadow-lg shadow-blue-600/20">Save Product</button>
                                                <button onClick={() => setEditingProduct(null)} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-white border border-gray-700">Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-1/2 bg-gray-950 p-8 flex items-center justify-center relative">
                                        <div className="absolute inset-0 bg-[#000000] opacity-50"></div>
                                        <div className="relative z-10 w-[350px]">
                                            <ProductCard product={editingProduct as Product} onClick={() => { }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {products.map(p => (
                                <div key={p.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-4 rounded-xl flex justify-between items-center hover:bg-gray-900 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <img src={p.imageUrl} className="w-16 h-16 rounded-lg object-cover shadow-sm bg-gray-800" />
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{p.title}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-emerald-400 font-mono font-bold">₹{p.priceInr}</span>
                                                <span className="text-gray-600 text-xs px-2 py-0.5 bg-gray-800 rounded uppercase">{p.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingProduct(p)} className="p-2.5 bg-gray-800 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition"><i className="fa-solid fa-pencil"></i></button>
                                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2.5 bg-gray-800 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition"><i className="fa-solid fa-trash"></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Other tabs rendered with similar improvements */}
                {activeTab === 'categories' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold text-white">Categories</h1>
                            <button onClick={() => setEditingCategory({ name: "", icon: "fa-tag" })} className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-violet-600/20"><i className="fa-solid fa-plus mr-2"></i> Add Category</button>
                        </div>

                        {editingCategory && (
                            <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl mb-8 flex gap-4 items-end shadow-xl">
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs text-gray-500 font-bold uppercase">Name</label>
                                    <input className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white" value={editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs text-gray-500 font-bold uppercase">Icon Class</label>
                                    <input className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white" value={editingCategory.icon} onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })} />
                                </div>
                                <button onClick={handleSaveCategory} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-emerald-600/20">Save</button>
                                <button onClick={() => setEditingCategory(null)} className="bg-gray-800 px-6 py-3 rounded-xl font-bold text-white">Cancel</button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map(c => (
                                <div key={c.id} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex justify-between items-center hover:border-violet-500/50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-violet-500 group-hover:text-white transition-colors shadow-lg">
                                            <i className={`fa-solid ${c.icon}`}></i>
                                        </div>
                                        <span className="font-bold text-lg text-white">{c.name}</span>
                                    </div>
                                    <button onClick={async () => { if (confirm("Delete?")) { await db.deleteCategory(c.id); refresh(); } }} className="text-gray-500 hover:text-red-500 transition"><i className="fa-solid fa-trash"></i></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'access' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Access Management</h1>
                                <p className="text-gray-400 text-sm">Grant or revoke product access for users.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Grant Access Form */}
                            <div className="lg:col-span-1">
                                <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl space-y-6 sticky top-8">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><i className="fa-solid fa-key"></i></div>
                                        Grant New Access
                                    </h3>

                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const form = e.target as HTMLFormElement;
                                        const userSelect = form.elements.namedItem('userId') as HTMLSelectElement;
                                        const productSelect = form.elements.namedItem('productId') as HTMLSelectElement;
                                        handleGrantAccess(userSelect.value, productSelect.value);
                                        form.reset();
                                    }} className="space-y-4">
                                        <div>
                                            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Select User</label>
                                            <select name="userId" className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-emerald-500 outline-none" required>
                                                <option value="">-- Choose User --</option>
                                                {users.map(u => <option key={u.userId} value={u.userId}>{u.username} ({u.email})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Select Product</label>
                                            <select name="productId" className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-emerald-500 outline-none" required>
                                                <option value="">-- Choose Product --</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                            </select>
                                        </div>
                                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-transform active:scale-95">Grant Access</button>
                                    </form>
                                </div>
                            </div>

                            {/* Permissions List */}
                            <div className="lg:col-span-2 space-y-4">
                                {permissions.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-3xl bg-gray-900/20">
                                        <i className="fa-solid fa-lock-open text-4xl mb-4 opacity-50"></i>
                                        <p>No active permissions found.</p>
                                    </div>
                                ) : (
                                    permissions.map((perm, idx) => {
                                        const user = users.find(u => u.userId === perm.userId);
                                        const product = products.find(p => p.id === perm.productId);
                                        if (!user || !product) return null; // cleanup invalid references visually

                                        return (
                                            <div key={idx} className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl flex items-center justify-between hover:bg-gray-900 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold">
                                                        {user.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{user.username}</p>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <span>has access to</span>
                                                            <span className="text-violet-400 font-medium">{product.title}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRevokeAccess(perm.userId, perm.productId)} className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10" title="Revoke Access">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Review Moderation</h1>
                                <p className="text-gray-400 text-sm">Approve or reject customer reviews.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {reviews.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-3xl bg-gray-900/20">
                                    <i className="fa-regular fa-star text-4xl mb-4 opacity-50"></i>
                                    <p>No reviews submitted yet.</p>
                                </div>
                            ) : (
                                reviews.slice().reverse().map(review => {
                                    const product = products.find(p => p.id === review.productId);
                                    return (
                                        <div key={review.id} className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl flex flex-col md:flex-row gap-6 relative overflow-hidden group">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${review.status === 'approved' ? 'bg-emerald-500' :
                                                review.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                                                }`}></div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="flex text-yellow-500 text-sm">
                                                        {[...Array(5)].map((_, i) => (
                                                            <i key={i} className={`fa-solid fa-star ${i < review.rating ? '' : 'text-gray-700'}`}></i>
                                                        ))}
                                                    </div>
                                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${review.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        review.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                                                        }`}>{review.status}</span>
                                                    <span className="text-xs text-gray-600 ml-auto">{new Date(review.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-white font-medium mb-1">"{review.comment}"</p>
                                                <p className="text-sm text-gray-500">by <span className="text-gray-300 font-bold">{review.username}</span> on <span className="text-violet-400">{product?.title || 'Unknown Product'}</span></p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {review.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleReviewAction(review.id, 'approved')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-emerald-600/20 transition-transform active:scale-95">Approve</button>
                                                        <button onClick={() => handleReviewAction(review.id, 'rejected')} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold text-sm border border-gray-700">Reject</button>
                                                    </>
                                                )}
                                                {review.status !== 'pending' && (
                                                    <button onClick={() => handleReviewAction(review.id, review.status === 'approved' ? 'rejected' : 'approved')} className="text-xs text-gray-500 underline hover:text-white">
                                                        Change to {review.status === 'approved' ? 'Rejected' : 'Approved'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Order Management</h1>
                                <p className="text-gray-400 text-sm">Review pending payments and grant access.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {orders.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-3xl bg-gray-900/20">
                                    <i className="fa-solid fa-money-check-dollar text-4xl mb-4 opacity-50"></i>
                                    <p>No orders found.</p>
                                </div>
                            ) : (
                                orders.slice().reverse().map(order => {
                                    return (
                                        <div key={order.id} className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:bg-gray-900 transition">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${order.status === 'approved' ? 'bg-emerald-500' :
                                                order.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                                                }`}></div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${order.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        order.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                                                        }`}>{order.status}</span>
                                                    <span className="text-xs text-gray-600 ml-auto">{new Date(order.timestamp).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-white font-bold text-lg mb-1">{order.productTitle}</h3>
                                                        <p className="text-sm text-gray-400">User: <span className="text-white font-bold">{order.username}</span> ({order.userId})</p>
                                                        <p className="text-xs text-gray-500 font-mono mt-2 bg-gray-900/50 p-2 rounded inline-block">Memo: {order.memo}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-emerald-400 font-mono">{order.amount.toLocaleString()} {order.currency}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-center gap-2 border-l border-gray-800 pl-6">
                                                {order.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleApproveOrder(order)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-transform active:scale-95 flex items-center gap-2">
                                                            <i className="fa-solid fa-check"></i> Approve
                                                        </button>
                                                        <button onClick={() => handleRejectOrder(order.id)} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-sm border border-gray-700 flex items-center gap-2">
                                                            <i className="fa-solid fa-xmark"></i> Reject
                                                        </button>
                                                    </>
                                                )}
                                                {order.status !== 'pending' && (
                                                    <div className="text-center w-full px-6">
                                                        <p className="text-xs text-gray-500 font-bold uppercase">Processed</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold text-white">User Base</h1>
                            <button onClick={() => setEditingUser({ username: "", email: "", password: "" })} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-fuchsia-600/20"><i className="fa-solid fa-plus mr-2"></i> Add User</button>
                        </div>
                        {/* New User Modal here if needed */}
                        {editingUser && (
                            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                                <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-700 p-8 shadow-2xl">
                                    <h2 className="text-xl font-bold mb-6 text-white">Add New User</h2>
                                    <div className="space-y-4">
                                        <input className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white" placeholder="Username" value={editingUser.username} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })} />
                                        <input className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white" placeholder="Email" type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
                                        <input className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white" placeholder="Password" type="password" value={editingUser.password} onChange={e => setEditingUser({ ...editingUser, password: e.target.value })} />
                                        <div className="flex gap-4 pt-4">
                                            <button onClick={handleSaveUser} className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 py-3 rounded-xl font-bold text-white">Create User</button>
                                            <button onClick={() => setEditingUser(null)} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-white">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            {users.filter(u => u).map(u => (
                                <div key={u._id} className="bg-gray-900/50 border border-gray-800 p-4 rounded-xl flex justify-between items-center hover:bg-gray-900 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${u.role === 'staff' ? 'from-fuchsia-500 to-pink-500' : 'from-violet-500 to-indigo-500'} flex items-center justify-center text-white font-bold shadow-lg`}>
                                            {(u.username || "?").substring(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-white">{u.username}</h3>
                                                {u.role === 'admin' && <span className="bg-violet-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Admin</span>}
                                                {u.role === 'staff' && <span className="bg-fuchsia-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Staff</span>}
                                            </div>
                                            <p className="text-sm text-gray-500">{u.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Simplified Actions */}
                                        {u.role !== 'admin' && (
                                            u.role === 'user' ?
                                                <button onClick={async () => { if (confirm("Promote?")) { await db.setUserRole(u.userId, 'staff'); refresh(); } }} className="text-xs text-fuchsia-400 font-bold hover:underline">Promote</button> :
                                                <button onClick={async () => { if (confirm("Demote?")) { await db.setUserRole(u.userId, 'user'); refresh(); } }} className="text-xs text-gray-400 font-bold hover:underline">Demote</button>
                                        )}
                                        <div className="w-px h-4 bg-gray-700 mx-2"></div>
                                        <button onClick={() => handleBanUser(u.userId)} className="text-gray-500 hover:text-red-500"><i className="fa-solid fa-ban"></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 h-[calc(100vh-8rem)] flex flex-col">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Live Chat Moderation</h1>
                                <p className="text-gray-400 text-sm">Monitor and moderate global chat in real-time.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleToggleChat} className={`px-4 py-2 rounded-xl font-bold text-sm border transition-all shadow-lg flex items-center gap-2 ${settings.chatEnabled ? 'bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/20'}`}>
                                    <i className={`fa-solid ${settings.chatEnabled ? 'fa-video-slash' : 'fa-video'}`}></i>
                                    {settings.chatEnabled ? 'Disable Chat' : 'Enable Chat'}
                                </button>
                                <button onClick={() => setShowBannedModal(true)} className="px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl font-bold text-sm hover:bg-gray-700 hover:text-white transition-all shadow-lg">
                                    <i className="fa-solid fa-user-slash mr-2"></i> Banned Users
                                </button>
                                <button onClick={() => { if (confirm("Clear all chat history?")) { db.clearChat().then(() => setChatMessages([])); } }} className="px-4 py-2 bg-orange-500/10 text-orange-500 border border-orange-500/50 rounded-xl font-bold text-sm hover:bg-orange-500/20 hover:text-orange-400 transition-all shadow-lg">
                                    <i className="fa-solid fa-trash mr-2"></i> Clear History
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-900/30">
                                {chatMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-600">
                                        <i className="fa-solid fa-comments text-5xl mb-4 opacity-50"></i>
                                        <p>No messages in history.</p>
                                    </div>
                                ) : (
                                    chatMessages.slice().reverse().map(msg => {
                                        const isAdmin = msg.role === 'admin';
                                        return (
                                            <div key={msg.id} className="group flex items-start gap-4 hover:bg-white/5 p-3 rounded-2xl transition-all border border-transparent hover:border-gray-800">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${isAdmin ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                                                    {msg.username[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-bold text-sm ${isAdmin ? 'text-violet-400' : 'text-gray-200'}`}>{msg.username}</span>
                                                                {isAdmin && <span className="bg-violet-500/20 text-violet-300 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Admin</span>}
                                                                {msg.role === 'staff' && <span className="bg-fuchsia-500/20 text-fuchsia-300 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Staff</span>}
                                                            </div>
                                                            <p className="text-gray-300 mt-1 text-sm leading-relaxed break-words">{msg.content}</p>
                                                            {msg.imageUrl && (
                                                                <div className="mt-2 rounded-lg overflow-hidden border border-gray-700 w-fit">
                                                                    <img src={msg.imageUrl} alt="attachment" className="max-h-48 object-cover" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-xs text-gray-600 whitespace-nowrap">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            <button onClick={() => { if (confirm("Delete this message?")) { db.deleteMessage(msg.id); setChatMessages(prev => prev.filter(m => m.id !== msg.id)); } }} className="w-8 h-8 rounded-lg bg-gray-800 text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all" title="Delete Message">
                                                                <i className="fa-solid fa-trash text-xs"></i>
                                                            </button>
                                                            {msg.role !== 'admin' && (
                                                                <button onClick={() => handleBanUser(msg.userId)} className="w-8 h-8 rounded-lg bg-gray-800 text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all" title="Ban User">
                                                                    <i className="fa-solid fa-gavel text-xs"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleAdminSendMessage} className="p-4 bg-gray-900 border-t border-gray-800 flex gap-3">
                                <div className="flex-1 bg-gray-950 border border-gray-800 rounded-xl flex items-center p-1.5 focus-within:border-violet-500 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mr-2">
                                        <i className="fa-solid fa-shield-cat text-violet-500"></i>
                                    </div>
                                    <input
                                        value={adminMessage}
                                        onChange={e => setAdminMessage(e.target.value)}
                                        placeholder="Broadcast message as Administrator..."
                                        className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder-gray-600 focus:outline-none font-medium"
                                    />
                                </div>
                                <button type="submit" disabled={!adminMessage.trim()} className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-bold text-white shadow-lg shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center gap-2">
                                    <span>Send</span>
                                    <i className="fa-solid fa-paper-plane text-xs"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'server' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Server Status</h1>
                                <p className="text-gray-400 text-sm">Monitor system health and error logs.</p>
                            </div>
                            <button
                                onClick={checkServer}
                                disabled={loadingServer}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                <i className={`fa-solid fa-rotate ${loadingServer ? 'animate-spin' : ''}`}></i>
                                Refresh Status
                            </button>
                        </div>

                        {/* Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-2">Server Health</p>
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${serverStatus?.status === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                                    <p className="text-2xl font-bold text-white uppercase">{serverStatus?.status || 'Unknown'}</p>
                                </div>
                                <p className="text-xs text-gray-600 mt-2 font-mono">Environment: {serverStatus?.env || 'Unknown'}</p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-2">Database</p>
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${serverStatus?.database === 'connected' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                                    <p className="text-2xl font-bold text-white uppercase">{serverStatus?.database || 'Unknown'}</p>
                                </div>
                                <p className="text-xs text-gray-600 mt-2 font-mono">MongoDB</p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-2">Recent Errors</p>
                                <p className="text-2xl font-bold text-white">{serverLogs.length}</p>
                                <p className="text-xs text-gray-600 mt-2">Last 100 entries</p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-2">Realtime Connection</p>
                                <p className="text-2xl font-bold text-white">{db['socket']?.connected ? 'Connected' : 'Disconnected'}</p>
                                <p className="text-xs text-gray-600 mt-2 font-mono">Transport: {db['socket']?.io?.engine?.transport?.name || 'Polling'}</p>
                            </div>
                        </div>

                        {/* Logs Table */}
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                                <h3 className="font-bold text-white">System Logs</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs text-gray-500 font-bold uppercase border-b border-gray-800">
                                            <th className="p-5">Level</th>
                                            <th className="p-5">Message</th>
                                            <th className="p-5">Timestamp</th>
                                            <th className="p-5">Context</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {serverLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-gray-500">No logs found.</td>
                                            </tr>
                                        ) : (
                                            serverLogs.map(log => (
                                                <tr key={log._id} className="border-b border-gray-800/50 hover:bg-white/5">
                                                    <td className="p-5">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.level === 'error' ? 'bg-red-500/10 text-red-500' :
                                                            log.level === 'warn' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                'bg-blue-500/10 text-blue-500'
                                                            }`}>{log.level}</span>
                                                    </td>
                                                    <td className="p-5 text-white font-mono text-xs">{log.message}</td>
                                                    <td className="p-5 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                                    <td className="p-5 text-gray-600 font-mono text-xs">{JSON.stringify(log.metadata || {})}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 max-w-4xl">
                        <h1 className="text-3xl font-bold text-white mb-8">System Configuration</h1>
                        <div className="space-y-6">
                            <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl space-y-6">
                                <h3 className="text-xl font-bold text-white mb-6">General Details</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500 font-bold uppercase">Store Name</label>
                                        <input className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none" value={settings.storeName} onChange={e => setSettings({ ...settings, storeName: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500 font-bold uppercase">Discord Invite</label>
                                        <input className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none" value={settings.discordLink} onChange={e => setSettings({ ...settings, discordLink: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-500 font-bold uppercase">Hero Image URL</label>
                                    <input className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none" value={settings.heroImage} onChange={e => setSettings({ ...settings, heroImage: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-500 font-bold uppercase">Allowed Email Domains (Comma Separated)</label>
                                    <input className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-violet-500 outline-none" placeholder="e.g. gmail.com, yahoo.com" value={settings.allowedDomains.join(", ")} onChange={e => setSettings({ ...settings, allowedDomains: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} />
                                </div>
                            </div>

                            <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl flex items-center justify-between col-span-2">
                                <div>
                                    <h3 className="font-bold text-white text-lg">Maintenance Mode</h3>
                                    <p className="text-sm text-gray-500">Lock store for non-admins.</p>
                                </div>
                                <button onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })} className={`w-14 h-8 rounded-full relative transition-colors ${settings.maintenanceMode ? 'bg-violet-600' : 'bg-gray-700'}`}>
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <button onClick={handleSaveSettings} className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-bold text-white shadow-xl shadow-fuchsia-600/20 hover:scale-[1.01] transition-transform">Save All Settings</button>
                        </div>
                    </div>
                )}

                {/* Banned Users Modal */}
                {showBannedModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[70vh] shadow-2xl">
                            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                                <h3 className="font-bold text-white">Banned Users</h3>
                                <button onClick={() => setShowBannedModal(false)} className="text-gray-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
                            </div>
                            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                                {bannedUsers.length === 0 ? <p className="text-center text-gray-600 text-sm py-8">No banned users.</p> : (
                                    <ul className="space-y-2">
                                        {bannedUsers.map(u => (
                                            <li key={u.userId} className="flex justify-between items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
                                                <span className="text-gray-300 text-sm font-bold">{u.username}</span>
                                                <button onClick={() => handleUnbanUser(u.userId)} className="text-xs text-emerald-400 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-bold transition">Unban</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
