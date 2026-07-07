import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { ArrowLeft, MessageSquare, ThumbsUp, Plus, Send, User, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';

const DiscussionForum = ({ problemId }) => {
    const { user } = useSelector((state) => state.auth);
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeThread, setActiveThread] = useState(null);
    const [replies, setReplies] = useState([]);
    const [repliesLoading, setRepliesLoading] = useState(false);
    
    // Form states
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [replyContent, setReplyContent] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    // Fetch main threads
    const fetchThreads = async () => {
        setLoading(true);
        try {
            const { data } = await axiosClient.get(`/discussion/problem/${problemId}`);
            setThreads(data);
        } catch (error) {
            console.error('Error fetching discussions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThreads();
    }, [problemId]);

    // Fetch replies for a selected thread
    const handleThreadClick = async (thread) => {
        setActiveThread(thread);
        setRepliesLoading(true);
        try {
            const { data } = await axiosClient.get(`/discussion/replies/${thread._id}`);
            setReplies(data);
        } catch (error) {
            console.error('Error fetching replies:', error);
        } finally {
            setRepliesLoading(false);
        }
    };

    // Post a new thread
    const handleCreateThread = async (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) return;
        setSubmitLoading(true);
        try {
            const { data } = await axiosClient.post('/discussion/create', {
                problemId,
                title: newTitle,
                content: newContent
            });
            setThreads([
                { ...data, replyCount: 0 },
                ...threads
            ]);
            setNewTitle('');
            setNewContent('');
            setShowCreateForm(false);
        } catch (error) {
            console.error('Error creating discussion:', error);
        } finally {
            setSubmitLoading(false);
        }
    };

    // Post a reply
    const handleCreateReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setSubmitLoading(true);
        try {
            const { data } = await axiosClient.post('/discussion/create', {
                problemId,
                content: replyContent,
                parentId: activeThread._id
            });
            setReplies([...replies, data]);
            setReplyContent('');
            
            // Increment replyCount in threads list
            setThreads(threads.map(t => 
                t._id === activeThread._id ? { ...t, replyCount: t.replyCount + 1 } : t
            ));
        } catch (error) {
            console.error('Error creating reply:', error);
        } finally {
            setSubmitLoading(false);
        }
    };

    // Handle upvote
    const handleUpvote = async (e, item, isReply = false) => {
        e.stopPropagation(); // prevent clicking row when in threads list
        if (!user) return;
        
        try {
            const { data } = await axiosClient.post(`/discussion/upvote/${item._id}`);
            
            if (isReply) {
                setReplies(replies.map(r => r._id === item._id ? { ...r, upvotes: data.upvotes } : r));
            } else {
                setThreads(threads.map(t => t._id === item._id ? { ...t, upvotes: data.upvotes } : t));
                if (activeThread && activeThread._id === item._id) {
                    setActiveThread({ ...activeThread, upvotes: data.upvotes });
                }
            }
        } catch (error) {
            console.error('Error upvoting:', error);
        }
    };

    const hasUpvoted = (upvotesArray) => {
        return user && upvotesArray?.includes(user._id);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm text-gray-500">Loading discussions...</span>
            </div>
        );
    }

    return (
        <div className="w-full text-slate-200">
            {/* THREAD DETAIL VIEW */}
            {activeThread ? (
                <div className="space-y-6">
                    {/* Header with Back button */}
                    <button 
                        onClick={() => { setActiveThread(null); setReplies([]); }}
                        className="flex items-center gap-2 btn btn-ghost btn-sm text-xs font-semibold px-2 hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Forum
                    </button>

                    {/* Main post */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-100">{activeThread.title}</h3>
                                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                    <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded">
                                        <User className="h-3 w-3" />
                                        <span>{activeThread.userId?.firstName}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{new Date(activeThread.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            
                            {/* Upvote */}
                            <button
                                onClick={(e) => handleUpvote(e, activeThread)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                    hasUpvoted(activeThread.upvotes)
                                        ? 'bg-violet-600/20 border-violet-500 text-violet-400'
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                                }`}
                            >
                                <ThumbsUp className="h-3.5 w-3.5" />
                                <span>{activeThread.upvotes?.length || 0}</span>
                            </button>
                        </div>

                        <p className="text-slate-350 text-sm whitespace-pre-wrap leading-relaxed border-t border-slate-800/40 pt-4">
                            {activeThread.content}
                        </p>
                    </div>

                    {/* Replies Section */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider pl-1">
                            Comments & Replies ({replies.length})
                        </h4>

                        {repliesLoading ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                            </div>
                        ) : replies.length === 0 ? (
                            <div className="text-center py-8 bg-slate-950/20 border border-slate-900 rounded-xl text-slate-500 text-sm">
                                No comments yet. Be the first to reply!
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {replies.map((reply) => (
                                    <div key={reply._id} className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 flex gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <span className="font-bold text-slate-200">{reply.userId?.firstName}</span>
                                                <span>•</span>
                                                <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap">
                                                {reply.content}
                                            </p>
                                        </div>
                                        
                                        <div className="shrink-0 flex items-start">
                                            <button
                                                onClick={(e) => handleUpvote(e, reply, true)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                                                    hasUpvoted(reply.upvotes)
                                                        ? 'bg-violet-600/20 border-violet-500 text-violet-400'
                                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                                                }`}
                                            >
                                                <ThumbsUp className="h-3 w-3" />
                                                <span>{reply.upvotes?.length || 0}</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Reply Form */}
                        <form onSubmit={handleCreateReply} className="flex gap-2 items-start mt-4">
                            <textarea
                                placeholder="Type your reply or solution code here..."
                                rows="3"
                                className="textarea textarea-bordered w-full bg-slate-900 border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-sm text-slate-200 placeholder-slate-500 resize-y"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={submitLoading || !replyContent.trim()}
                                className="btn btn-primary h-auto min-h-[50px] px-4 rounded-xl bg-violet-600 border-none hover:bg-violet-700 shadow-lg text-white"
                            >
                                {submitLoading ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                /* THREADS LIST VIEW */
                <div className="space-y-4">
                    {/* Create Thread Trigger / Toggle */}
                    <div className="flex justify-between items-center pl-1">
                        <h3 className="font-bold text-slate-100">Discussions Forum</h3>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="btn btn-sm btn-primary bg-violet-600 border-none hover:bg-violet-700 text-white rounded-xl gap-1"
                        >
                            {showCreateForm ? 'Cancel' : (
                                <>
                                    <Plus className="h-4 w-4" />
                                    New Post
                                </>
                            )}
                        </button>
                    </div>

                    {/* New Post Form */}
                    {showCreateForm && (
                        <form onSubmit={handleCreateThread} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
                            <h4 className="font-bold text-sm text-slate-200">Create a New Thread</h4>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Enter thread title (e.g. Optimized JS solution using 2-pointers)"
                                    className="input input-bordered w-full bg-slate-950 border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-sm text-slate-200 placeholder-slate-500"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                />
                                <textarea
                                    placeholder="Explain your approach, ask questions, or share code blocks here..."
                                    rows="5"
                                    className="textarea textarea-bordered w-full bg-slate-950 border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl text-sm text-slate-200 placeholder-slate-500 resize-y"
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitLoading || !newTitle.trim() || !newContent.trim()}
                                    className="btn btn-sm btn-primary bg-violet-600 border-none hover:bg-violet-700 text-white rounded-lg px-4"
                                >
                                    {submitLoading ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                        'Post Thread'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* List of threads */}
                    {threads.length === 0 ? (
                        <div className="text-center py-16 bg-slate-900/20 border border-slate-800 rounded-2xl p-12 shadow-inner">
                            <MessageSquare className="h-12 w-12 mx-auto text-slate-700 mb-3" />
                            <h4 className="text-slate-400 font-bold">No discussions yet</h4>
                            <p className="text-slate-500 text-xs mt-1">
                                Have questions or a cool solution to share? Start a new thread!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {threads.map((thread) => (
                                <div
                                    key={thread._id}
                                    onClick={() => handleThreadClick(thread)}
                                    className="bg-slate-900/40 border border-slate-850 hover:border-slate-700/60 p-4 rounded-xl flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/60 transition-all duration-200"
                                >
                                    <div className="flex-1 space-y-2">
                                        <h4 className="font-bold text-slate-200 hover:text-violet-400 transition-colors text-sm line-clamp-1">
                                            {thread.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="font-semibold text-slate-350">{thread.userId?.firstName}</span>
                                            <span>•</span>
                                            <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 font-semibold text-slate-400 bg-slate-850 px-2 py-0.5 rounded">
                                                <MessageSquare className="h-3 w-3" />
                                                {thread.replyCount} replies
                                            </span>
                                        </div>
                                    </div>

                                    {/* Upvotes */}
                                    <div className="shrink-0">
                                        <button
                                            onClick={(e) => handleUpvote(e, thread)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                                hasUpvoted(thread.upvotes)
                                                    ? 'bg-violet-600/20 border-violet-500 text-violet-400 shadow-[0_0_10px_rgba(109,40,217,0.15)]'
                                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                                            }`}
                                        >
                                            <ThumbsUp className="h-3 w-3" />
                                            <span>{thread.upvotes?.length || 0}</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DiscussionForum;
