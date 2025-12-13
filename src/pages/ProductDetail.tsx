import React, { useState, useEffect } from "react";
import { Product, User, Review } from "../types";
import { db } from "../services/db";

interface ProductDetailProps {
    product: Product;
    user: User | null;
    onBack: () => void;
    onPurchase: () => void;
    previewMode?: boolean;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, user, onBack, onPurchase, previewMode = false }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [discordLink, setDiscordLink] = useState("");
    const [currentImage, setCurrentImage] = useState(product.imageUrl);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

    useEffect(() => {
        setCurrentImage(product.imageUrl);
    }, [product.imageUrl]);

    useEffect(() => {
        const loadData = async () => {
            // In preview mode, we might not have a real ID or real reviews
            if (previewMode) return;

            const r = await db.getPublicReviews(product.id);
            setReviews(r);
            if (user) {
                const reviewed = await db.hasUserReviewed(user.userId, product.id);
                setHasReviewed(reviewed);
            }
            const settings = await db.getSettings();
            setDiscordLink(settings.discordLink);

            // Load related products (simple fetch for now, can be random or same category)
            const allProducts = await db.getProducts();
            setRelatedProducts(allProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 3));
        };
        loadData();
    }, [product.id, user, previewMode, product.category]);
    const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
    const [submitted, setSubmitted] = useState(false);

    // Realtime Reviews Polling
    React.useEffect(() => {
        if (previewMode) return;

        const interval = setInterval(async () => {
            const latestReviews = await db.getPublicReviews(product.id);
            // Only update if length changed to avoid unnecessary re-renders (simple check)
            // For a real app, deep comparison or timestamp check would be better
            setReviews(prev => {
                if (prev.length !== latestReviews.length) return latestReviews;
                return prev;
            });
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [product.id, previewMode]);

    const [hasPurchased, setHasPurchased] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            // In preview mode, assume not purchased or purchased based on desire, but here false is fine or logic to simulate
            if (previewMode) {
                setHasPurchased(false);
                return;
            }

            if (!user) {
                setHasPurchased(product.priceInr === 0);
                return;
            }
            if (product.priceInr === 0) {
                setHasPurchased(true);
                return;
            }
            const has = await db.hasPermission(user.userId, product.id);
            setHasPurchased(has);
        };
        checkAccess();
    }, [user, product.id, product.priceInr, previewMode]);


    const handleSubmitReview = (e: React.FormEvent) => {
        e.preventDefault();
        if (previewMode) {
            alert("Review submission disabled in preview mode.");
            return;
        }
        if (!user) return;
        db.addReview({
            productId: product.id,
            userId: user.userId,
            username: user.username,
            rating: newReview.rating,
            comment: newReview.comment
        });
        setSubmitted(true);
    };

    return (
        <div className={`bg-[#050505] ${previewMode ? 'h-full overflow-y-auto custom-scrollbar' : 'min-h-screen pb-20'}`}>
            {/* Cinematic Header Backdrop */}
            <div className={`relative w-full overflow-hidden group ${previewMode ? 'h-[40vh]' : 'h-[60vh] md:h-[75vh]'}`}>
                <div className="absolute inset-0">
                    <img
                        src={currentImage}
                        alt={product.title}
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800"; }}
                        className="w-full h-full object-cover blur-sm opacity-40 scale-105 group-hover:scale-110 transition duration-[20s] ease-linear"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 to-transparent"></div>
                </div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                <div className={`absolute left-0 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto h-full flex flex-col justify-end pb-20 md:pb-32 ${previewMode ? 'pb-10' : ''}`}>
                    {!previewMode && (
                        <button onClick={onBack} className="absolute top-24 left-4 md:left-8 text-gray-400 hover:text-white flex items-center text-sm font-bold transition bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 hover:border-white/20 w-fit group/back z-20">
                            <i className="fa-solid fa-arrow-left mr-2 group-hover/back:-translate-x-1 transition"></i> Back to Store
                        </button>
                    )}

                    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
                        <div className="flex flex-wrap gap-3 mb-4 md:mb-6">
                            <span className="bg-violet-500/20 backdrop-blur-md text-violet-200 border border-violet-500/30 text-[10px] md:text-xs px-3 md:px-4 py-1.5 rounded-full uppercase font-bold tracking-wider shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                                {product.type}
                            </span>
                            <span className="bg-white/5 backdrop-blur-md text-gray-300 border border-white/10 text-[10px] md:text-xs px-3 md:px-4 py-1.5 rounded-full uppercase font-bold tracking-wider">
                                {product.category}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black text-white mb-4 md:mb-6 leading-tight drop-shadow-2xl tracking-tight">
                            {product.title}
                        </h1>

                        <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm">
                            <div className="flex items-center gap-2 bg-black/30 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5">
                                <div className="flex text-yellow-400 text-[10px] md:text-xs">
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className={`fa-solid fa-star ${i < 4 ? "" : "text-gray-600"}`}></i>
                                    ))}
                                </div>
                                <span className="text-white font-bold">{reviews.length}</span>
                                <span className="text-gray-400">Reviews</span>
                            </div>
                            <div className="h-4 w-px bg-white/10"></div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <i className="fa-solid fa-shield-check text-emerald-400"></i>
                                <span>Verified Asset</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${previewMode ? '-mt-6' : '-mt-20 md:-mt-32'} relative z-10`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Navigation Tabs */}
                        <div className="flex gap-2 p-1 bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-800 w-full md:w-fit overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold transition rounded-lg flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                            >
                                <i className="fa-solid fa-circle-info"></i> Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold transition rounded-lg flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'reviews' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                            >
                                <i className="fa-solid fa-star"></i> Reviews
                            </button>
                        </div>

                        <div className="min-h-[400px]">
                            {activeTab === 'overview' ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Image Gallery */}
                                    {(product.images && product.images.length > 0) && (
                                        <div className="glass-panel p-4 md:p-6 rounded-2xl border border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-xl">
                                            <h3 className="text-lg md:text-xl font-display font-bold text-white mb-4 flex items-center gap-3">
                                                <i className="fa-solid fa-images text-fuchsia-500"></i> Gallery
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                                <button
                                                    onClick={() => setCurrentImage(product.imageUrl)}
                                                    className={`relative group aspect-video rounded-xl overflow-hidden border-2 transition-all duration-300 ${currentImage === product.imageUrl ? 'border-fuchsia-500 shadow-[0_0_20px_rgba(232,121,249,0.5)] scale-[1.02] z-10' : 'border-gray-800 hover:border-gray-600 opacity-70 hover:opacity-100 hover:scale-105'}`}
                                                >
                                                    <img src={product.imageUrl} className="w-full h-full object-cover" />
                                                    <div className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity ${currentImage === product.imageUrl ? 'opacity-0' : 'opacity-100'}`}></div>
                                                </button>
                                                {product.images.map((img, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentImage(img)}
                                                        className={`relative group aspect-video rounded-xl overflow-hidden border-2 transition-all duration-300 ${currentImage === img ? 'border-fuchsia-500 shadow-[0_0_20px_rgba(232,121,249,0.5)] scale-[1.02] z-10' : 'border-gray-800 hover:border-gray-600 opacity-70 hover:opacity-100 hover:scale-105'}`}
                                                    >
                                                        <img src={img} className="w-full h-full object-cover" />
                                                        <div className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity ${currentImage === img ? 'opacity-0' : 'opacity-100'}`}></div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="glass-panel p-8 md:p-10 rounded-2xl border border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-xl">
                                        <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                            <i className="fa-solid fa-align-left text-violet-500"></i> Description
                                        </h3>
                                        <div className="prose prose-invert max-w-none">
                                            <p className="text-gray-200 leading-relaxed text-base md:text-lg font-normal">{product.description}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="glass-panel p-8 md:p-10 rounded-2xl border border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-xl">
                                            <h3 className="text-lg md:text-xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                                <i className="fa-solid fa-list-check text-emerald-500"></i> Key Features
                                            </h3>
                                            <ul className="space-y-4">
                                                {product.features.map((f, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-gray-200">
                                                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] flex-shrink-0"></div>
                                                        <span className="flex-1 text-base md:text-lg">{f}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {product.meta && (
                                            <div className="glass-panel p-6 md:p-8 rounded-2xl border border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-xl">
                                                <h3 className="text-lg md:text-xl font-display font-bold text-white mb-6 flex items-center gap-3">
                                                    <i className="fa-solid fa-microchip text-blue-500"></i> Technical Specs
                                                </h3>
                                                <div className="space-y-4">
                                                    {Object.entries(product.meta).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0">
                                                            <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                            <span className="text-white font-mono font-bold text-sm">{value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Related Products Section */}
                                    {relatedProducts.length > 0 && (
                                        <div className="pt-8 border-t border-gray-800">
                                            <h3 className="text-2xl font-display font-bold text-white mb-6">Related Products</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {relatedProducts.map(rp => (
                                                    <div key={rp.id} className="group flex flex-col gap-3 cursor-pointer" onClick={() => window.location.href = `/product/${rp.id}`}>
                                                        <div className="aspect-video rounded-xl bg-gray-900 border border-gray-800 overflow-hidden relative">
                                                            <img src={rp.imageUrl} alt={rp.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition duration-500" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                                                            <div className="absolute bottom-2 left-2 right-2">
                                                                <p className="text-white font-bold text-sm truncate">{rp.title}</p>
                                                                <p className="text-gray-400 text-xs">{rp.category}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {/* Review Summary */}
                                        <div className="md:col-span-1 glass-panel p-6 rounded-2xl border border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-xl h-fit">
                                            <div className="text-center">
                                                <div className="text-6xl font-display font-black text-white mb-2">4.8</div>
                                                <div className="flex justify-center text-yellow-400 mb-2 text-sm">
                                                    {[...Array(5)].map((_, i) => (
                                                        <i key={i} className="fa-solid fa-star"></i>
                                                    ))}
                                                </div>
                                                <p className="text-gray-400 text-sm font-medium">{reviews.length} Customer Reviews</p>
                                            </div>

                                            <div className="mt-8 space-y-2">
                                                {[5, 4, 3, 2, 1].map((star) => (
                                                    <div key={star} className="flex items-center gap-3 text-xs">
                                                        <span className="text-gray-400 w-3 font-bold">{star}</span>
                                                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: star === 5 ? '80%' : star === 4 ? '15%' : '5%' }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Reviews List */}
                                        <div className="md:col-span-2 space-y-6">
                                            {user && !hasReviewed && !submitted && (
                                                <form onSubmit={handleSubmitReview} className="glass-panel p-6 rounded-2xl border border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-xl">
                                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                                        <i className="fa-solid fa-pen-nib text-violet-500"></i> Write a Review
                                                    </h3>
                                                    <div className="mb-4">
                                                        <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Rating</label>
                                                        <div className="flex gap-2">
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <button
                                                                    key={star}
                                                                    type="button"
                                                                    onClick={() => setNewReview({ ...newReview, rating: star })}
                                                                    className={`text-2xl transition transform hover:scale-110 ${star <= newReview.rating ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" : "text-gray-800"}`}
                                                                >
                                                                    <i className="fa-solid fa-star"></i>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <textarea
                                                        required
                                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none mb-4 min-h-[120px] transition placeholder:text-gray-600"
                                                        placeholder="Share your experience with this asset..."
                                                        value={newReview.comment}
                                                        onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                                    ></textarea>
                                                    <div className="flex justify-end">
                                                        <button className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition shadow-lg shadow-white/10">Submit Review</button>
                                                    </div>
                                                </form>
                                            )}

                                            {submitted && (
                                                <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl border border-emerald-500/20 flex items-center gap-3 animate-in fade-in">
                                                    <i className="fa-solid fa-check-circle text-xl"></i>
                                                    <div>
                                                        <p className="font-bold">Review Submitted!</p>
                                                        <p className="text-xs opacity-80">Your review is pending approval.</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                {reviews.length === 0 ? (
                                                    <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-2xl border border-gray-800 border-dashed">
                                                        <i className="fa-regular fa-comment-dots text-4xl mb-3 opacity-50"></i>
                                                        <p>No reviews yet. Be the first to share your thoughts!</p>
                                                    </div>
                                                ) : (
                                                    reviews.map(review => (
                                                        <div key={review.id} className="glass-panel p-6 rounded-2xl border border-gray-800 bg-[#0a0a0a]/80 backdrop-blur-xl hover:border-gray-700 transition group">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                                                                        {review.username[0].toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-bold text-white block leading-tight">{review.username}</span>
                                                                        <span className="text-xs text-gray-500 font-medium">Verified Buyer</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-yellow-400 text-xs bg-yellow-400/10 px-2 py-1 rounded-lg border border-yellow-400/20">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <i key={i} className={`fa-solid fa-star ${i < review.rating ? "" : "text-gray-700"}`}></i>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-300 text-sm leading-relaxed pl-13 border-l-2 border-gray-800 pl-4 ml-5 group-hover:border-violet-500/50 transition-colors">{review.comment}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Sticky Action Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="glass-panel p-1 rounded-3xl border border-gray-700 shadow-2xl relative overflow-hidden group bg-gradient-to-b from-gray-800 to-gray-900">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 opacity-0 group-hover:opacity-100 transition duration-700"></div>

                                <div className="bg-[#050505] rounded-[22px] p-6 relative z-10 h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-1">Total Price</p>
                                            {product.priceInr === 0 ? (
                                                <span className="text-4xl md:text-5xl font-display font-bold text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">Free</span>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="text-3xl md:text-4xl font-display font-bold text-white">₹{product.priceInr}</span>
                                                    <span className="text-xs text-gray-500 font-mono mt-1">≈ {product.priceOwo.toLocaleString()} Owo</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-gray-900 p-2 rounded-lg border border-gray-800">
                                            <i className="fa-solid fa-tag text-violet-400"></i>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center justify-between text-sm py-2 border-b border-gray-800/50">
                                            <span className="text-gray-400 flex items-center gap-2"><i className="fa-solid fa-file-contract text-gray-600"></i> License</span>
                                            <span className="text-white font-medium">Standard</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm py-2 border-b border-gray-800/50">
                                            <span className="text-gray-400 flex items-center gap-2"><i className="fa-solid fa-headset text-gray-600"></i> Support</span>
                                            <span className="text-white font-medium">Priority</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm py-2 border-b border-gray-800/50">
                                            <span className="text-gray-400 flex items-center gap-2"><i className="fa-solid fa-rotate text-gray-600"></i> Updates</span>
                                            <span className="text-white font-medium">Lifetime</span>
                                        </div>
                                    </div>

                                    {hasPurchased ? (
                                        <button
                                            onClick={async () => {
                                                if (user && product.priceInr === 0) {
                                                    // Ensure free products are added to library locally + logic
                                                    await db.grantPermission(user.userId, product.id);
                                                }
                                                window.open(product.downloadUrl || "#", "_blank");
                                            }}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-[0_0_30px_rgba(16,185,129,0.3)] transition transform hover:-translate-y-1 flex items-center justify-center gap-3 text-lg group/btn"
                                        >
                                            <i className="fa-solid fa-download group-hover/btn:animate-bounce"></i> Download Asset
                                        </button>
                                    ) : (
                                        <button
                                            onClick={onPurchase}
                                            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white py-4 rounded-xl font-bold shadow-[0_0_30px_rgba(139,92,246,0.3)] transition transform hover:-translate-y-1 flex items-center justify-center gap-3 text-lg relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition duration-300"></div>
                                            <i className="fa-solid fa-cart-shopping"></i> Purchase Now
                                        </button>
                                    )}

                                    <div className="mt-6 flex items-center justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition duration-500">
                                        <i className="fa-brands fa-cc-visa text-2xl text-white"></i>
                                        <i className="fa-brands fa-cc-mastercard text-2xl text-white"></i>
                                        <i className="fa-brands fa-cc-paypal text-2xl text-white"></i>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-xl">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                                        <i className="fa-brands fa-discord text-xl"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm mb-1">Need Help?</h4>
                                        <p className="text-gray-400 text-xs mb-3 leading-relaxed">Join our Discord community for instant support, updates, and more.</p>
                                        <button onClick={() => window.open(discordLink, "_blank")} className="text-[#5865F2] text-xs font-bold hover:text-white transition flex items-center gap-1">
                                            Join Server <i className="fa-solid fa-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
