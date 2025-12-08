import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { ArrowLeft, Send, AlertCircle, Lock } from 'lucide-react';
import { User, AppSettings } from '../types';

interface CreateForumPostProps {
    onNavigate: (view: string) => void;
    user: User | null;
    settings: AppSettings;
}

const CreateForumPost: React.FC<CreateForumPostProps> = ({ onNavigate, user, settings }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) {
            onNavigate('login');
            return;
        }
    }, [user, onNavigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (settings.forumCreationEnabled === false && user?.role !== 'admin' && user?.role !== 'staff') {
            alert("Forum post creation is currently disabled by administrators.");
            return;
        }

        if (!user) {
            setError("You must be logged in to create a post.");
            return;
        }

        const tagList = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

        if (tagList.length === 0) {
            setError("At least one tag is required (e.g., help, discussion).");
            return;
        }

        setSubmitting(true);
        try {
            await db.createForumPost({
                title,
                content,
                tags: tagList,
                author: user ? {
                    userId: user.userId,
                    username: user.username
                } : undefined, // Check backend handles undefined author as guest
                images
            });
            alert("Post submitted! It is now pending approval.");
            onNavigate('community');
        } catch (err: any) {
            setError(err.message || "Failed to create post.");
        } finally {
            setSubmitting(false);
        }
    };

    // Guest Allowed - Login Check Removed

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 pt-24 flex items-center justify-center relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none z-0"></div>

            <div className="w-full max-w-2xl relative z-10">
                <button
                    onClick={() => onNavigate('community')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Forum
                </button>

                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 mb-2">Create Discussion</h1>
                        <p className="text-gray-400">Share your thoughts, ask questions, or help others.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600"
                                placeholder="What's specific topic?"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Content</label>
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-3 h-40 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none placeholder:text-gray-600"
                                placeholder="Describe your topic in detail..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Tags (comma separated)</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600"
                                placeholder="e.g., help, bug, suggestion"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-2">At least one tag is required.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Images (Optional URLs)</label>
                            <div className="space-y-3">
                                {images.map((img, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={img}
                                            onChange={e => {
                                                const newImages = [...images];
                                                newImages[idx] = e.target.value;
                                                setImages(newImages);
                                            }}
                                            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600 text-sm"
                                            placeholder="https://example.com/image.png"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                            className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                        >
                                            <ArrowLeft size={18} className="rotate-180" /> {/* Reuse icon for delete or use X text if no icon available */}
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setImages(prev => [...prev, ''])}
                                    className="text-sm text-blue-400 font-bold hover:text-blue-300 transition-colors"
                                >
                                    + Add Image URL
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.98]"
                        >
                            {submitting ? 'Submitting...' : (
                                <>
                                    <Send size={18} />
                                    Submit for Approval
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateForumPost;
