"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { scriptsApi, Comment } from "@/lib/api/scripts";
import { getStorageUrl } from "@/lib/utils/image";
import { useUser } from "@/hooks/useUser";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { formatRelativeTime } from "@/lib/utils/date";
import { useAuth } from "@/contexts/AuthContext";

interface CommentSectionProps {
    scriptId: string;
    onCountChange?: (count: number) => void;
}

export function CommentSection({ scriptId, onCountChange }: CommentSectionProps) {
    const { openAuthModal } = useAuth();
    const { user, isLoading: isAuthLoading } = useUser();
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const lastCountRef = useRef<number | null>(null);

    // Fetch comments
    useEffect(() => {
        const fetchComments = async () => {
            try {
                setIsLoading(true);
                const data = await scriptsApi.getComments(scriptId);
                setComments(data);
                lastCountRef.current = data.length;
            } catch (err) {
                // error silently handled
            } finally {
                setIsLoading(false);
            }
        };

        if (scriptId) {
            fetchComments();
        }
    }, [scriptId]);


    // Notify parent of count change
    useEffect(() => {
        if (lastCountRef.current !== comments.length) {
            onCountChange?.(comments.length);
            lastCountRef.current = comments.length;
        }
    }, [comments.length, onCountChange]);

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        try {
            setIsSubmitting(true);
            setError(null);
            const comment = await scriptsApi.postComment(scriptId, newComment);

            // Add to list optimistically or refetch
            // Since API returns the new comment, we can prepend it
            // However, the API returns the comment object which might need mapping if not consistent
            // But postComment in scripts.ts returns the mapped object if we did it right?
            // Actually postComment returns raw data. Let's assume basic fields are there.
            // We might need to construct the full Comment object with user details
            const newCommentObj: Comment = {
                ...comment,
                username: user.username || "You",
                displayName: user.displayName || user.username || "You",
                avatarUrl: user.avatarUrl,
                replyCount: 0,
                isPinned: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            setComments((prev) => [newCommentObj, ...prev]);
            setNewComment("");
        } catch (err: any) {
            // error silently handled
            setError(err.message || "Failed to post comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle delete request
    const handleDeleteClick = (commentId: string) => {
        setCommentToDelete(commentId);
        setIsDeleteModalOpen(true);
    };

    // Confirm delete
    const handleConfirmDelete = async () => {
        if (!commentToDelete) return;

        try {
            setIsDeleting(true);
            await scriptsApi.deleteComment(scriptId, commentToDelete);
            setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
            setIsDeleteModalOpen(false);
            setCommentToDelete(null);
        } catch (err: any) {
            // error silently handled
            // Optional: set error state?
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return <div className="py-8 text-center text-sm text-offgray-500">Loading comments...</div>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-offgray-100 flex items-center gap-2">
                Comments
                <span className="text-sm font-medium text-offgray-500">({comments.length})</span>
            </h3>

            {/* Input */}
            {user ? (
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/[0.06] border border-white/[0.1] flex-shrink-0">
                        {user.avatarUrl ? (
                            <Image src={getStorageUrl(user.avatarUrl)} alt={user.username} width={32} height={32} className="object-cover w-full h-full" unoptimized />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-medium text-offgray-300">
                                {user.username?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full bg-surface-panel border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-offgray-100 placeholder:text-offgray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none min-h-[80px]"
                        />
                        <div className="flex justify-between items-center">
                            {error && <span className="text-xs text-red-400">{error}</span>}
                            <div className="flex-1" />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || isSubmitting}
                                className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? "Posting..." : "Comment"}
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="bg-surface-panel/50 border border-white/[0.06] rounded-xl p-4 text-center">
                    <p className="text-sm text-offgray-400">
                        Please <button onClick={() => openAuthModal('login')} className="text-emerald-400 hover:underline font-medium focus:outline-none">log in</button> to leave a comment.
                    </p>
                </div>
            )}

            {/* List */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-offgray-600 text-sm">
                        No comments yet. Be the first to share your thoughts!
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/[0.06] border border-white/[0.1] flex-shrink-0">
                                {comment.avatarUrl ? (
                                    <Image src={getStorageUrl(comment.avatarUrl)} alt={comment.username} width={32} height={32} className="object-cover w-full h-full" unoptimized />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-medium text-offgray-300">
                                        {comment.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Link href={`/p/${comment.username}`} className="text-xs font-bold text-offgray-200 hover:text-white transition-colors">
                                        @{comment.username}
                                    </Link>
                                    <span className="text-[10px] text-offgray-600">
                                        {formatRelativeTime(comment.createdAt)}
                                    </span>
                                    {comment.isPinned && (
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-medium">Pinned</span>
                                    )}
                                </div>
                                <p className="text-sm text-offgray-400 whitespace-pre-wrap leading-relaxed">
                                    {comment.content}
                                </p>
                                <div className="flex items-center gap-4 pt-1">
                                    {/* <button className="flex items-center gap-1 text-[10px] font-medium text-offgray-600 hover:text-offgray-300 transition-colors">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                                        Like
                                    </button> */}
                                    <button className="text-[10px] font-medium text-offgray-600 hover:text-offgray-300 transition-colors">
                                        Reply
                                    </button>
                                    {user && (user.id === comment.userId || user.roles?.includes('admin') || user.roles?.includes('moderator')) && (
                                        <button
                                            onClick={() => handleDeleteClick(comment.id)}
                                            className="text-[10px] font-medium text-red-500/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Comment"
                message="Are you sure you want to delete this comment? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}

