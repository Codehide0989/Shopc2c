import React, { useState, useEffect } from "react";
import { Product, Category, Review, ChatMessage, UserPermission, User } from "../types";
import { db } from "../services/db";
import { generateId } from "../utils/helpers";
import ProductCard from "../components/ProductCard";

interface StaffDashboardProps {
    user: User | null;
    onLogout: () => void;
    onBackToStore: () => void;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, onLogout, onBackToStore }) => {
    // Staff have access to these tabs
    const [activeTab, setActiveTab] = useState<"overview" | "products" | "categories" | "reviews" | "chat">("overview");

    // Data States
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // Edit States
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
    const [staffMessage, setStaffMessage] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (activeTab === 'chat') {
            db.getMessages().then(setChatMessages);
            const handleMsg = (msg: ChatMessage) => setChatMessages(prev => [...prev, msg]);
            db.onMessage(handleMsg);
            return () => db.offMessage();
        }
    }, [activeTab]);

    const loadData = async () => {
        setProducts(await db.getProducts());
        setCategories(await db.getCategories());
        setReviews(await db.getAllReviews());
        setChatMessages(await db.getMessages());
    };

    const refresh = loadData;

    // --- Actions ---

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert("File too large (>2MB).");
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
                        fileCount: 1
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
                _id: editingProduct._id,
                id: editingProduct.id || `prod_${generateId()}`,
                features: editingProduct.features || [],
                priceInr: Number(editingProduct.priceInr) || 0,
                priceOwo: Number(editingProduct.priceOwo) || 0,
                meta: editingProduct.meta || {}
            } as Product;

            await db.saveProduct(newProd);
            setEditingProduct(null);
            alert("Product saved successfully!");
            refresh();
        } catch (e: any) {
            alert("Error saving product: " + e.message);
        }
    };

    const handleReviewAction = async (id: string, status: 'approved' | 'rejected') => {
        await db.updateReviewStatus(id, status);
        refresh();
    };

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

    const handleStaffSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffMessage.trim()) return;
        // Staff messages appear as normal users but maybe with a tag if the frontend renders it
        // The backend doesn't distinguish deeply, but we send as the staff user
        if (user) {
            db.sendMessage(user.userId, user.username, staffMessage.trim(), user.role || 'staff');
            setStaffMessage("");
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex text-gray-100 font-sans">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 ${collapsed ? 'w-20' : 'w-72'} bg-gray-900/95 backdrop-blur-xl border-r border-gray-800 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-all duration-300 shadow-2xl`}>
                <div className={`h-24 flex items-center ${collapsed ? 'justify-center px-0' : 'px-8'} border-b border-gray-800/50 bg-gradient-to-r from-gray-900 to-gray-800/50 relative`}>
                    {/* Toggle Button for Desktop */}
                    <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-fuchsia-600 rounded-full items-center justify-center text-white text-[10px] shadow-lg hover:scale-110 transition z-50">
                        <i className={`fa-solid fa-chevron-${collapsed ? 'right' : 'left'}`}></i>
                    </button>

                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-600 to-pink-600 flex-shrink-0 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                            <i className="fa-solid fa-id-badge text-white text-sm"></i>
                        </div>
                        <div className={`transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                            <span className="text-xl font-display font-bold text-white tracking-wide whitespace-nowrap">ShopC2C <span className="text-fuchsia-500">STAFF</span></span>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto text-gray-400 hover:text-white transition"><i className="fa-solid fa-xmark text-xl"></i></button>
                </div>

                <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-6rem)] custom-scrollbar">
                    <div className="mb-6">
                        {!collapsed && <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 animate-in fade-in">Staff Menu</p>}
                        {['overview', 'products', 'categories', 'reviews', 'chat'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab as any); setSidebarOpen(false); }}
                                className={`w-full text-left ${collapsed ? 'px-0 justify-center' : 'px-4'} py-3.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 group relative overflow-hidden ${activeTab === tab
                                    ? "bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 text-white border border-fuchsia-500/30 shadow-lg shadow-fuchsia-900/10"
                                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white hover:pl-5"}`}
                                title={collapsed ? tab.charAt(0).toUpperCase() + tab.slice(1) : ''}
                            >
                                {activeTab === tab && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-fuchsia-500 to-pink-500 rounded-r-full"></div>}
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 transform group-active:scale-90 ${activeTab === tab ? "bg-fuchsia-500/20 text-fuchsia-400" : "bg-gray-800/50 text-gray-500 group-hover:bg-gray-800 group-hover:text-gray-300"}`}>
                                    <i className={`fa-solid ${tab === 'overview' ? 'fa-chart-pie' :
                                        tab === 'products' ? 'fa-box' :
                                            tab === 'categories' ? 'fa-tags' :
                                                tab === 'reviews' ? 'fa-comments' : 'fa-message'
                                        }`}></i>
                                </span>
                                {!collapsed && <span className="capitalize">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>}
                                {!collapsed && activeTab === tab && <i className="fa-solid fa-chevron-right ml-auto text-xs text-fuchsia-500/50"></i>}
                            </button>
                        ))}
                    </div>

                    <div className={`pt-4 mt-4 border-t border-gray-800/50 space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
                        <button onClick={onBackToStore} className={`w-full text-left ${collapsed ? 'px-0 justify-center' : 'px-4'} py-3 text-gray-400 hover:text-white hover:bg-gray-800/30 rounded-xl flex items-center gap-3 transition-all`} title="Back to Store">
                            <span className="w-8 h-8 flex items-center justify-center"><i className="fa-solid fa-store w-5 text-center"></i></span>
                            {!collapsed && "Back to Store"}
                        </button>
                        <button onClick={onLogout} className={`w-full text-left ${collapsed ? 'px-0 justify-center' : 'px-4'} py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl flex items-center gap-3 transition-all`} title="Logout">
                            <span className="w-8 h-8 flex items-center justify-center"><i className="fa-solid fa-right-from-bracket w-5 text-center"></i></span>
                            {!collapsed && "Logout"}
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 ${collapsed ? 'md:ml-20' : 'md:ml-72'} p-4 md:p-8 overflow-y-auto h-screen bg-gray-950/50 transition-all duration-300`}>
                <div className="md:hidden mb-6">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 bg-gray-800 rounded text-gray-300"><i className="fa-solid fa-bars"></i> Menu</button>
                </div>

                {/* --- OVERVIEW --- */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Staff Dashboard</h1>
                                <p className="text-gray-400">Hello, {user?.username}. Work hard!</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Products Card */}
                            <div className="relative overflow-hidden bg-gray-900 p-6 rounded-2xl border border-gray-800">
                                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Total Products</p>
                                <p className="text-3xl font-display font-bold text-white">{products.length}</p>
                            </div>
                            {/* Reviews Card */}
                            <div className="relative overflow-hidden bg-gray-900 p-6 rounded-2xl border border-gray-800">
                                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Total Reviews</p>
                                <p className="text-3xl font-display font-bold text-white">{reviews.length}</p>
                            </div>
                            {/* Categories Card */}
                            <div className="relative overflow-hidden bg-gray-900 p-6 rounded-2xl border border-gray-800">
                                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Categories</p>
                                <p className="text-3xl font-display font-bold text-white">{categories.length}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PRODUCTS --- */}
                {activeTab === 'products' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-bold text-white">Product Management</h1>
                            <button
                                onClick={() => setEditingProduct({
                                    title: "", description: "", priceInr: 0, priceOwo: 0,
                                    category: categories[0]?.name || "", features: [],
                                    imageUrl: "", downloadUrl: "", type: "workflow", meta: {}
                                })}
                                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-lg font-bold"
                            >
                                <i className="fa-solid fa-plus mr-2"></i> Add Product
                            </button>
                        </div>

                        {/* Editor Modal */}
                        {editingProduct && (
                            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                                <div className="bg-gray-900 w-full max-w-6xl h-[90vh] rounded-2xl border border-gray-700 flex overflow-hidden shadow-2xl">
                                    <div className="w-1/2 p-8 overflow-y-auto border-r border-gray-800">
                                        <h2 className="text-xl font-bold mb-6">Edit Product</h2>
                                        <div className="space-y-4">
                                            <input className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white" placeholder="Title" value={editingProduct.title} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} />
                                            <textarea className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white" placeholder="Description" rows={3} value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="number" className="bg-gray-800 border border-gray-700 rounded p-3 text-white" placeholder="Price (INR)" value={editingProduct.priceInr} onChange={e => setEditingProduct({ ...editingProduct, priceInr: parseInt(e.target.value) })} />
                                                <input type="number" className="bg-gray-800 border border-gray-700 rounded p-3 text-white" placeholder="Price (Owo)" value={editingProduct.priceOwo} onChange={e => setEditingProduct({ ...editingProduct, priceOwo: parseInt(e.target.value) })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <select className="bg-gray-800 border border-gray-700 rounded p-3 text-white" value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}>
                                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                </select>
                                                <select className="bg-gray-800 border border-gray-700 rounded p-3 text-white" value={editingProduct.type} onChange={e => setEditingProduct({ ...editingProduct, type: e.target.value as any })}>
                                                    <option value="workflow">Workflow</option>
                                                    <option value="pack">Pack</option>
                                                    <option value="audio">Audio</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <input className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white" placeholder="Image URL" value={editingProduct.imageUrl} onChange={e => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })} />
                                            <input type="file" className="w-full text-sm text-gray-400 file:bg-fuchsia-50 file:text-fuchsia-700" onChange={handleFileUpload} />
                                            <div className="flex gap-4 pt-4">
                                                <button onClick={handleSaveProduct} className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 py-3 rounded font-bold">Save Product</button>
                                                <button onClick={() => setEditingProduct(null)} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded font-bold">Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-1/2 p-8 bg-gray-950 flex items-center justify-center">
                                        <ProductCard product={editingProduct as Product} onClick={() => { }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {products.map(p => (
                                <div key={p.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex justify-between items-center hover:border-gray-700 transition">
                                    <div className="flex items-center gap-4">
                                        <img src={p.imageUrl} className="w-12 h-12 rounded object-cover" />
                                        <div>
                                            <h3 className="font-bold text-white">{p.title}</h3>
                                            <p className="text-sm text-gray-500">₹{p.priceInr}</p>
                                        </div>
                                    </div>
                                    {/* Staff can edit but maybe not delete? Request said staff can "Add products" and "Accept reviews". No mention of delete. Assuming Edit is part of Add/Manage. */}
                                    {/* Staff can only Add products, not Edit existing ones */}

                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- CATEGORIES --- */}
                {activeTab === 'categories' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-bold text-white">Categories</h1>
                            <button onClick={() => setEditingCategory({ name: "", icon: "fa-tag" })} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-lg font-bold"><i className="fa-solid fa-plus mr-2"></i> Add Category</button>
                        </div>

                        {editingCategory && (
                            <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl mb-6 flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 block mb-1">Name</label>
                                    <input className="w-full bg-gray-800 border border-gray-700 rounded p-2" value={editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 block mb-1">FontAwesome Icon Class</label>
                                    <input className="w-full bg-gray-800 border border-gray-700 rounded p-2" value={editingCategory.icon} onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })} />
                                </div>
                                <button onClick={handleSaveCategory} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-bold">Save</button>
                                <button onClick={() => setEditingCategory(null)} className="bg-gray-800 px-4 py-2 rounded font-bold">Cancel</button>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categories.map(c => (
                                <div key={c.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                                        <i className={`fa-solid ${c.icon}`}></i>
                                    </div>
                                    <span className="font-bold">{c.name}</span>
                                </div>
                            ))}
                        </div>
                        {/* Staff probably shouldn't edit categories unless specified. Leaving as read-only for now based on 'Add Products' focus. */}
                    </div>
                )}

                {/* --- REVIEWS --- */}
                {activeTab === 'reviews' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <h1 className="text-3xl font-bold text-white mb-6">Review Moderation</h1>
                        <div className="space-y-4">
                            {reviews.map(r => (
                                <div key={r.id} className={`p-4 rounded-xl border ${r.status === 'pending' ? 'bg-gray-900 border-yellow-500/30' : 'bg-gray-900/50 border-gray-800'} flex justify-between items-start`}>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-bold text-white">{r.username}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${r.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : r.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{r.status}</span>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-2">{r.comment}</p>
                                    </div>
                                    {r.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleReviewAction(r.id, 'approved')} className="p-2 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600 hover:text-white"><i className="fa-solid fa-check"></i></button>
                                            <button onClick={() => handleReviewAction(r.id, 'rejected')} className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- CHAT --- */}
                {activeTab === 'chat' && (
                    <div className="animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
                        <h1 className="text-3xl font-bold mb-6">Staff Chat View</h1>
                        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden flex flex-col flex-1">
                            <div className="p-4 bg-gray-900/50 border-b border-gray-700">Live Global Chat</div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/50">
                                {chatMessages.map(msg => (
                                    <div key={msg.id} className={`flex flex-col ${msg.userId === user?.userId ? "items-end" : "items-start"}`}>
                                        <div className={`p-3 rounded-lg max-w-[80%] ${msg.userId === user?.userId ? "bg-fuchsia-600 text-white" : "bg-gray-800 text-gray-200"}`}>
                                            <p className="text-xs opacity-50 font-bold mb-1">{msg.username}</p>
                                            {msg.imageUrl && (
                                                <img src={msg.imageUrl} alt="Attachment" className="h-20 rounded-lg mb-1 border border-white/10 object-cover" />
                                            )}
                                            <p>{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleStaffSendMessage} className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2">
                                <input className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white" placeholder="Type a message..." value={staffMessage} onChange={e => setStaffMessage(e.target.value)} />
                                <button type="submit" className="bg-fuchsia-600 text-white px-6 py-2 rounded-lg font-bold">Send</button>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StaffDashboard;
