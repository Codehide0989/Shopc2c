import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { ForumPost, User } from '../types';
import { ArrowLeft, Send, MessageSquare, User as UserIcon, Calendar, Clock, Tag, Lock } from 'lucide-react';

interface ForumPostDetailProps {
    postId: string;
    onNavigate: (view: string) => void;
    user: User | null;
}

const ForumPostDetail: React.FC<ForumPostDetailProps> = ({ postId, onNavigate, user }) => {
    const [post, setPost] = useState<ForumPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadPost();
    }, [postId]);

    const loadPost = async () => {
        setLoading(true);
        const data = await db.getForumPost(postId);
        setPost(data);
        setLoading(false);
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        // Guest allowed to reply

        setSubmitting(true);
        try {
            await db.addForumReply(postId, {
                content: replyContent,
                author: user ? {
                    userId: user.userId,
                    username: user.username
                } : undefined
            });
            setReplyContent('');
            loadPost(); // Refresh to show new reply
        } catch (err: any) {
            setError(err.message || "Failed to post reply.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-950 text-white p-6 pt-24 text-center">
                <h2 className="text-2xl font-bold mb-4">Post not found</h2>
                <button
                    onClick={() => onNavigate('community')}
                    className="text-blue-400 hover:text-blue-300"
                >
                    Back to Forum
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 pt-24 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none z-0"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                <button
                    onClick={() => onNavigate('community')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Forum
                </button>

                {/* Main Post */}
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl overflow-hidden shadow-2xl mb-8">
                    <div className="p-8">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm rounded-full border border-blue-500/20 flex items-center gap-1">
                                    <Tag size={12} /> {tag}
                                </span>
                            ))}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-6 leading-tight">{post.title}</h1>

                        <div className="flex items-center gap-4 text-gray-400 text-sm mb-8 pb-8 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <UserIcon size={16} className="text-blue-500" />
                                <span className="text-white font-medium">{post.author.username}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                <span>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                            {post.content}
                        </div>

                        {post.images && post.images.length > 0 && (
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {post.images.map((img, idx) => (
                                    <img key={idx} src={img} alt={`Attachment ${idx + 1}`} className="rounded-2xl border border-gray-800 w-full object-cover shadow-lg hover:scale-[1.02] transition-transform duration-500" />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Replies Section */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <MessageSquare className="text-blue-500" />
                        Replies ({post.replies?.length || 0})
                    </h3>

                    {post.replies && post.replies.map((reply) => (
                        <div key={reply.id} className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 hover:bg-gray-900/50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold">
                                        {reply.author.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">{reply.author.username}</div>
                                        <div className="text-xs text-gray-500">{new Date(reply.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-gray-300 leading-relaxed">{reply.content}</p>
                        </div>
                    ))}

                    {(!post.replies || post.replies.length === 0) && (
                        <div className="text-center py-12 text-gray-500 bg-gray-900/20 rounded-2xl border border-dashed border-gray-800">
                            <p>No replies yet. Be the first to start the conversation!</p>
                        </div>
                    )}
                </div>

                {/* Reply Form */}
                <div className="mt-8 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 md:p-8">
                    <h3 className="text-xl font-bold mb-6">Leave a Reply</h3>

                    {error && (
                        <div className="mb-4 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}

                    {/* Reply Form is now available for everyone */}
                    <form onSubmit={handleReply}>
                        <div className="mb-4">
                            <textarea
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y placeholder:text-gray-600"
                                placeholder={user ? "Write your reply here..." : "Write your reply as Guest..."}
                                required
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting || !replyContent.trim()}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform active:scale-95"
                            >
                                {submitting ? 'Posting...' : <><Send size={18} /> Post Reply</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForumPostDetail;
