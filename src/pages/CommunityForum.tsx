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

const CommunityForum: React.FC<CommunityForumProps> = ({ onNavigate, user }) => {
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
                        onClick={() => onNavigate('community-create')}
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
                    <div className="flex flex-col items-center justify-center py-32 bg-gray-900/20 backdrop-blur-sm rounded-3xl border border-gray-800/50 border-dashed">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mb-8 shadow-inner ring-1 ring-white/10">
                            <MessageSquare size={40} className="text-gray-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">No discussions found</h3>
                        <p className="text-gray-500 max-w-md text-center text-lg">
                            We couldn't find anything matching "{searchTerm}". <br className="hidden md:block" />
                            Why not start a new topic?
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredPosts.map((post, idx) => (
                            <div
                                key={post.id}
                                onClick={() => onNavigate('community-post', post.id)}
                                className="group relative bg-[#13131a] border border-white/5 hover:border-white/10 rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 overflow-hidden"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                {/* Hover Glow */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                <div className="flex flex-col md:flex-row gap-6 md:items-start relative z-10">
                                    {/* Vote Counter (Visual Only for now) */}
                                    <div className="hidden md:flex flex-col items-center gap-1 bg-white/5 rounded-xl p-2 border border-white/5 min-w-[60px]">
                                        <ThumbsUp size={18} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                                        <span className="font-bold text-white">{post.likes}</span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-4">
                                            {post.tags.map((tag, i) => (
                                                <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold uppercase tracking-wider rounded-lg border border-blue-500/20 transition-colors">
                                                    #{tag}
                                                </span>
                                            ))}
                                            <span className="text-gray-600 text-xs">•</span>
                                            <span className="text-gray-500 text-xs font-medium">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                        </div>

                                        <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                                            {post.title}
                                        </h3>
                                        <p className="text-gray-400 line-clamp-2 mb-6 leading-relaxed text-base font-light border-l-2 border-gray-800 pl-4">
                                            {post.content}
                                        </p>

                                        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                                                    {post.author.username[0].toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                                                    {post.author.username}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                                                    <MessageSquare size={16} />
                                                    <span className="font-medium">{post.replies?.length || 0} <span className="hidden sm:inline">Comments</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
