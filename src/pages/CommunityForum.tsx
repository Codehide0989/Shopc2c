import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { ForumPost, User, AppSettings } from '../types';
import { MessageSquare, ThumbsUp, Plus, Search, User as UserIcon, Tag } from 'lucide-react';

interface CommunityForumProps {
    onNavigate: (view: string, id?: string) => void;
    user: User | null;
    settings: AppSettings;
    onLogout?: () => void;
}

const CommunityForum: React.FC<CommunityForumProps> = ({ onNavigate, user, settings }) => {
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        const data = await db.getForumPosts();
        setPosts(data);
        setLoading(false);
    };

    const handleLike = async (post: ForumPost) => {
        if (!user) {
            onNavigate('login');
            return;
        }
        // Optimistic Update
        const isLiked = post.likedBy?.includes(user.userId);
        const updatedPosts = posts.map(p => {
            if (p.id === post.id) {
                return {
                    ...p,
                    likes: isLiked ? p.likes - 1 : p.likes + 1,
                    likedBy: isLiked
                        ? p.likedBy?.filter(id => id !== user.userId)
                        : [...(p.likedBy || []), user.userId]
                };
            }
            return p;
        });
        setPosts(updatedPosts);

        try {
            await db.toggleLikeForumPost(post.id, user.userId);
        } catch (err) {
            console.error(err);
            // Revert on failure
            loadPosts();
        }
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-6 pt-24 relative overflow-hidden font-sans">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-violet-900/20 via-blue-900/10 to-transparent pointer-events-none z-0"></div>
            <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                Community Hub
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4 tracking-tight">
                            Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400">Conversation</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                            Connect with other creators, share your workflows, ask for help, and discover new techniques.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            if (!user) {
                                onNavigate('login');
                                return;
                            }
                            onNavigate('community-create');
                        }}
                        className="group relative px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all hover:-translate-y-1 active:scale-95 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <span className="relative flex items-center gap-2 z-10">
                            <Plus size={20} className="transition-transform group-hover:rotate-90" />
                            Start Discussion
                        </span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-12 group max-w-3xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-fuchsia-500 rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
                    <div className="relative bg-[#13131a]/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center p-2 focus-within:border-white/20 transition-all shadow-2xl">
                        <Search className="ml-4 text-gray-500 group-focus-within:text-white transition-colors" size={24} />
                        <input
                            type="text"
                            placeholder="Search for topics, tags, or questions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none text-white px-4 py-4 focus:ring-0 outline-none text-lg placeholder:text-gray-600 font-medium"
                        />
                        <div className="hidden md:flex gap-2 pr-2">
                            <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-500 border border-white/5">⌘K</span>
                        </div>
                    </div>
                </div>

                {/* Posts Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-gray-900/50 rounded-3xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-[#13131a]/60 backdrop-blur-xl rounded-3xl border border-white/5 border-dashed relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-50"></div>
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(59,130,246,0.1)] ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
                            <MessageSquare size={40} className="text-blue-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-3 relative z-10">No discussions found</h3>
                        <p className="text-gray-400 max-w-md text-center text-lg relative z-10 font-light">
                            We couldn't find anything matching "<span className="text-white font-medium">{searchTerm}</span>". <br className="hidden md:block" />
                            Be the first to start this conversation!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredPosts.map((post, idx) => (
                            <div
                                key={post.id}
                                onClick={() => onNavigate('community-post', post.id)}
                                className="group relative bg-[#13131a]/80 backdrop-blur-xl border border-white/5 hover:border-blue-500/30 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.1)] hover:-translate-y-1 overflow-hidden"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                {/* Hover Glow Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                {/* Top Glow Line */}
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>

                                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                    {/* Vote Counter - Responsive */}
                                    <div className="flex md:flex-col items-center justify-between md:justify-start gap-4 md:gap-2 rounded-2xl p-3 border border-white/5 bg-gray-900/30 md:min-w-[70px]">
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleLike(post);
                                            }}
                                            className={`flex md:flex-col items-center gap-2 p-2 rounded-xl transition-all ${post.likedBy?.includes(user?.userId || '')
                                                ? 'text-blue-400 bg-blue-500/10'
                                                : 'text-gray-500 hover:text-blue-400 hover:bg-white/5'
                                                }`}
                                        >
                                            <ThumbsUp size={18} className={post.likedBy?.includes(user?.userId || '') ? 'fill-blue-400/20' : ''} />
                                            <span className={`font-bold text-sm ${post.likedBy?.includes(user?.userId || '') ? 'text-blue-100' : 'text-gray-400'}`}>
                                                {post.likes}
                                            </span>
                                        </div>

                                        <div className="h-4 w-[1px] md:w-4 md:h-[1px] bg-white/10"></div>

                                        <div className="flex md:flex-col items-center gap-2 text-gray-500 p-2">
                                            <MessageSquare size={18} />
                                            <span className="font-bold text-sm">{post.replies?.length || 0}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-3">
                                            {post.tags.slice(0, 3).map((tag, i) => (
                                                <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/5 text-blue-400 border border-blue-500/10 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                                    <Tag size={10} />
                                                    {tag}
                                                </div>
                                            ))}
                                            <span className="text-gray-600 text-[10px] font-mono uppercase tracking-widest">
                                                {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>

                                        <h3 className="text-xl md:text-2xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                                            {post.title}
                                        </h3>
                                        <p className="text-gray-300 line-clamp-2 mb-6 leading-relaxed text-sm md:text-base font-normal">
                                            {post.content}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 mt-auto border-t border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white shadow-lg ring-2 ring-gray-900">
                                                    {post.author.username[0].toUpperCase()}
                                                </div>
                                                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                                                    {post.author.username}
                                                </span>
                                            </div>

                                            <button className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                                View Discussion <i className="fa-solid fa-arrow-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile View Link (Always visible on small screens) */}
                                <div className="mt-4 pt-4 border-t border-white/5 flex sm:hidden justify-end">
                                    <span className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                        View Discussion <i className="fa-solid fa-arrow-right"></i>
                                    </span>
                                </div>
                            </div>

                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityForum;
