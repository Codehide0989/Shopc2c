import React, { useState } from "react";
import { Product, Category } from "../types";
import { db } from "../services/db";
import ProductCard from "../components/ProductCard";

interface HomeProps {
    products: Product[];
    categories: Category[];
    onProductClick: (p: Product) => void;
}

const Home: React.FC<HomeProps> = ({ products, categories, onProductClick }) => {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [search, setSearch] = useState("");

    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen pb-20 bg-[#050505] selection:bg-violet-500/30 selection:text-violet-200 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[128px]"></div>
            </div>

            {/* Hero Section */}
            <div className="relative z-10 pt-32 pb-24 px-4">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-200 text-xs font-bold tracking-widest uppercase mb-8 backdrop-blur-sm animate-fade-in-up shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                        </span>
                        New Assets Dropped Weekly
                    </div>

                    <h1 className="text-6xl md:text-8xl font-display font-black text-white mb-8 tracking-tight leading-[1.1] drop-shadow-2xl">
                        Next Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 animate-gradient-x">Digital</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Assets</span>
                    </h1>

                    <p className="text-xl text-gray-400 font-light mb-12 max-w-2xl mx-auto leading-relaxed">
                        Premium n8n workflows, meme packs, and creator tools to <span className="text-white font-medium">supercharge</span> your content pipeline.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto mb-16 group">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                            <i className="fa-solid fa-magnifying-glass text-gray-500 text-lg group-focus-within:text-violet-400 transition-colors"></i>
                        </div>
                        <input
                            type="text"
                            className="w-full pl-14 pr-6 py-5 rounded-2xl bg-[#0a0a0a]/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:bg-[#0a0a0a]/80 focus:ring-4 focus:ring-violet-500/10 transition-all text-lg shadow-2xl shadow-black/50 backdrop-blur-xl group-hover:bg-[#0a0a0a]/60"
                            placeholder="Search for workflows, packs, or bots..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 -z-10 blur-xl transition-opacity duration-500"></div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={() => setSelectedCategory("All")}
                            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 border backdrop-blur-md ${selectedCategory === "All"
                                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105"
                                : "bg-[#0a0a0a]/50 text-gray-400 border-white/5 hover:bg-[#0a0a0a]/80 hover:border-white/20 hover:text-white"
                                }`}
                        >
                            All Assets
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 border flex items-center gap-2 backdrop-blur-md ${selectedCategory === cat.name
                                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105"
                                    : "bg-[#0a0a0a]/50 text-gray-400 border-white/5 hover:bg-[#0a0a0a]/80 hover:border-white/20 hover:text-white"
                                    }`}
                            >
                                <i className={`fa-solid ${cat.icon}`}></i>
                                {cat.name}
                            </button>
                        ))}

                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="flex justify-between items-end mb-10 border-b border-white/5 pb-6">
                    <div>
                        <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3 mb-2 group cursor-default">
                            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-fuchsia-500/10 text-fuchsia-500 border border-fuchsia-500/20 group-hover:scale-110 transition-transform duration-300">
                                <i className="fa-solid fa-fire"></i>
                            </span>
                            Trending Now
                        </h2>
                        <p className="text-gray-400 text-sm">Most popular assets this week</p>
                    </div>
                    <span className="text-gray-500 font-mono text-sm bg-[#0a0a0a]/50 px-3 py-1 rounded-full border border-white/5">
                        {filteredProducts.length} results
                    </span>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-32 bg-[#0a0a0a]/30 rounded-3xl border border-white/5 border-dashed backdrop-blur-sm">
                        <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i className="fa-solid fa-ghost text-4xl text-gray-600"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No assets found</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            We couldn't find any assets matching your search. Try adjusting your filters or search terms.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} onClick={onProductClick} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
