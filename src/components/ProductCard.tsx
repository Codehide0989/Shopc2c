import React, { useState, useEffect } from "react";
import { Product } from "../types";
import { db } from "../services/db";

interface ProductCardProps {
    product: Product;
    onClick: (p: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
    const [rating, setRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);

    useEffect(() => {
        const updateRating = async () => {
            const reviews = await db.getPublicReviews(product.id);
            if (reviews.length > 0) {
                const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
                setRating(avg);
            } else {
                setRating(0);
            }
            setReviewCount(reviews.length);
        };

        updateRating();
        const interval = setInterval(updateRating, 2000);
        return () => clearInterval(interval);
    }, [product.id]);

    return (
        <div
            onClick={() => onClick(product)}
            className="group relative bg-[#0a0a0a]/50 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden hover:border-violet-500/50 transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)] cursor-pointer hover:-translate-y-2"
        >
            {/* Image Container */}
            <div className="aspect-[4/3] overflow-hidden relative">
                <img
                    src={product.imageUrl}
                    alt={product.title}
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800"; }}
                    className="w-full h-full object-cover object-center transform group-hover:scale-110 transition duration-700 ease-out"
                    loading="lazy"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full border border-white/10 uppercase font-bold tracking-wider shadow-xl">
                        {product.type}
                    </span>
                    {product.priceInr === 0 && (
                        <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full uppercase font-bold tracking-wider shadow-lg shadow-emerald-500/20 border border-emerald-400/20">
                            Free
                        </span>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="p-6 relative">
                {/* Category & Rating */}
                <div className="flex justify-between items-center mb-3">
                    <div className="text-xs font-bold tracking-wider text-violet-400 uppercase bg-violet-500/10 px-2 py-1 rounded-md border border-violet-500/20">
                        {product.category}
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-full border border-white/5">
                        <div className="flex text-yellow-400 text-[10px] gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <i key={i} className={`fa-solid fa-star ${i < Math.round(rating) ? "" : "text-gray-700"}`}></i>
                            ))}
                        </div>
                        {reviewCount > 0 && (
                            <span className="text-[10px] text-gray-400 font-medium">({reviewCount})</span>
                        )}
                    </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-display font-bold text-white mb-2 leading-tight group-hover:text-violet-400 transition-colors duration-300">
                    {product.title}
                </h3>
                <p className="text-gray-300 text-sm line-clamp-2 mb-6 h-10 font-normal leading-relaxed">
                    {product.description}
                </p>

                {/* Footer / Price / Action */}
                <div className="flex items-center justify-between pt-5 border-t border-white/5">
                    <div>
                        {product.priceInr === 0 ? (
                            <div className="flex flex-col">
                                <span className="text-emerald-400 font-bold text-lg">Free</span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Download</span>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-lg">₹{product.priceInr}</span>
                                <span className="text-[10px] text-gray-500">or {product.priceOwo} Owo</span>
                            </div>
                        )}
                    </div>

                    <button className="group/btn relative h-10 w-10 rounded-full bg-white text-black flex items-center justify-center overflow-hidden hover:bg-violet-500 hover:text-white transition-all duration-300 shadow-lg shadow-white/5 hover:shadow-violet-500/30">
                        <i className="fa-solid fa-arrow-right -rotate-45 group-hover/btn:rotate-0 transition-transform duration-300"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
