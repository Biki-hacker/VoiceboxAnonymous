import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  PaperAirplaneIcon, 
  UserCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import ReactionButton from './ReactionButton';
import DeletionConfirmation from '../DeletionConfirmation';
import CommentEditModal from './CommentEditModal';

const CommentSection = ({ 
  postId, 
  comments: initialComments = [], 
  organizationId,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  className = ''
}) => {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingComment, setDeletingComment] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [commentToEdit, setCommentToEdit] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [pinningComment, setPinningComment] = useState(null);
  const [pinError, setPinError] = useState(null);
  const commentInputRef = useRef(null);
  const { user } = useAuth();

  // Update local comments when initialComments prop changes
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      // Create new comment
      const response = await api.post(`/posts/${postId}/comments`, {
        text: newComment
      });
      const newCommentData = response.data.comment || response.data;
      const updatedComments = [newCommentData, ...comments];
      setComments(updatedComments);
      if (onCommentAdded) {
        onCommentAdded(newCommentData);
      }
      setNewComment('');
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment) => {
    setCommentToEdit(comment);
    setEditModalOpen(true);
    setEditError(null);
  };

  const handleSaveEdit = async (text) => {
    if (!commentToEdit) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      const response = await api.put(`/posts/${postId}/comments/${commentToEdit._id}`, {
        text
      });
      const updatedComment = response.data.comment || response.data;
      const updatedComments = comments.map(comment => 
        comment._id === updatedComment._id ? updatedComment : comment
      );
      setComments(updatedComments);
      setEditModalOpen(false);
      setCommentToEdit(null);
      if (onCommentUpdated) {
        onCommentUpdated(updatedComment);
      }
    } catch (error) {
      setEditError(error.response?.data?.message || 'Failed to update comment.');
      console.error('Error editing comment:', error);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!deletingComment || isDeleting) return;
    try {
      setIsDeleting(true);
      await api.delete(`/posts/${postId}/comments/${deletingComment._id}`);
      const updatedComments = comments.filter(c => c._id !== deletingComment._id);
      setComments(updatedComments);
      setDeletingComment(null);
      if (onCommentDeleted) {
        onCommentDeleted(deletingComment);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReactionUpdate = async (reactionData) => {
    try {
      const { type, postId, commentId, isReacted, count } = reactionData;
      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          // Create a new reactions object with all reaction types
          const updatedReactions = {};
          Object.keys(comment.reactions || {}).forEach(reactionType => {
            if (reactionType === type) {
              // Update the clicked reaction type
              updatedReactions[reactionType] = {
                count: count || 0,
                hasReacted: isReacted || false
              };
            } else {
              // For other reaction types, ensure they are not selected
              updatedReactions[reactionType] = {
                count: comment.reactions[reactionType]?.count || 0,
                hasReacted: false
              };
            }
          });
          
          return {
            ...comment,
            reactions: updatedReactions
          };
        }
        return comment;
      }));
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const formatDate = (dateString) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Helper function to check if comment has been edited (excluding pinning)
  const isCommentEdited = (comment) => {
    // Only show edited if updatedAt is different from createdAt AND it's not just a pinning change
    if (comment.updatedAt === comment.createdAt) {
      return false;
    }
    
    // If the comment has been pinned/unpinned but the text hasn't changed, don't show as edited
    // We can't easily detect this on the frontend, so we'll use a different approach
    // For now, we'll show edited only if there's a significant time difference (more than 1 minute)
    const timeDiff = new Date(comment.updatedAt) - new Date(comment.createdAt);
    return timeDiff > 60000; // More than 1 minute difference
  };

  const isCurrentUserComment = (comment) => {
    const currentUserId = localStorage.getItem('userId');
    // Handle both cases: author as string ID or author as object with _id
    const authorId = typeof comment.author === 'string' ? comment.author : comment.author?._id;
    return currentUserId && (authorId === currentUserId || comment.userId === currentUserId);
  };

  const canEditComment = (comment) => {
    return isCurrentUserComment(comment);
  };

  const canDeleteComment = (comment) => {
    const currentUserId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('role');
    return currentUserId && (isCurrentUserComment(comment) || userRole === 'admin');
  };

  // Sort comments so pinned comment is first
  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmitComment} className="flex items-start space-x-2">
        <div className="flex-shrink-0">
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
        </div>
        <div className="flex-1 relative">
          <input
            ref={commentInputRef}
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>

      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
        {/* Pin Error Display */}
        {pinError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-700 dark:text-red-300">{pinError}</span>
              </div>
              <button
                onClick={() => setPinError(null)}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
        
        <AnimatePresence>
          {Array.isArray(sortedComments) && sortedComments.map((comment) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex space-x-2 group"
            >
              <div className="flex-shrink-0">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        {/* Pinned tag */}
                        {comment.isPinned && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 mr-2">
                            <PaperClipIcon className="h-4 w-4 mr-1 text-yellow-500" /> Pinned
                          </span>
                        )}
                        {(comment.createdByRole === 'admin' || (comment.author && comment.author.role === 'admin')) ? (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] rounded-full font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300">
                            Admin
                          </span>
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {comment.author?.name || comment.userName || 'User'}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                        {isCommentEdited(comment) && ' (edited)'}
                      </p>
                    </div>
                    {(canEditComment(comment) || canDeleteComment(comment) || localStorage.getItem('role') === 'admin') && (
                      <div className="flex space-x-1">
                        {canEditComment(comment) && (
                          <button
                            onClick={() => handleEditComment(comment)}
                            className="text-gray-500 hover:text-blue-500 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600"
                            title="Edit comment"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        )}
                        {/* Pin/unpin button for admin only */}
                        {localStorage.getItem('role') === 'admin' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setPinError(null);
                              setPinningComment(comment._id);
                              
                              try {
                                // Optimistic update - immediately show the change
                                setComments(prevComments => 
                                  prevComments.map(c => 
                                    c._id === comment._id 
                                      ? { ...c, isPinned: !c.isPinned }
                                      : c
                                  )
                                );
                                
                                const response = await api.post(`/posts/${postId}/comments/${comment._id}/pin`);
                                const updatedComment = response.data.comment;
                                
                                if (updatedComment) {
                                  // Update with actual backend state
                                  setComments(prevComments => 
                                    prevComments.map(c => 
                                      c._id === comment._id 
                                        ? { ...c, isPinned: updatedComment.isPinned }
                                        : c
                                    )
                                  );
                                }
                              } catch (err) {
                                // Revert optimistic update on error
                                setComments(prevComments => 
                                  prevComments.map(c => 
                                    c._id === comment._id 
                                      ? { ...c, isPinned: comment.isPinned }
                                      : c
                                  )
                                );
                                setPinError(err.response?.data?.message || 'Failed to pin/unpin comment');
                                console.error('Error pinning/unpinning comment:', err);
                              } finally {
                                setPinningComment(null);
                              }
                            }}
                            disabled={pinningComment === comment._id}
                            className={`text-gray-500 hover:text-yellow-600 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-200 ${
                              comment.isPinned ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' : ''
                            } ${
                              pinningComment === comment._id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title={comment.isPinned ? 'Unpin Comment' : 'Pin Comment'}
                          >
                            {pinningComment === comment._id ? (
                              <svg className="animate-spin h-4 w-4 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <PaperClipIcon className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        {canDeleteComment(comment) && (
                          <button
                            onClick={() => setDeletingComment(comment)}
                            className="text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600"
                            title="Delete comment"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                    {(() => {
                      const commentText = comment.text || comment.content;
                      if (typeof commentText === 'string' && commentText.trim()) {
                        return commentText;
                      } else if (commentText && typeof commentText === 'object' && commentText.isEncrypted) {
                        return '[Encrypted comment]';
                      } else {
                        return '[Invalid comment]';
                      }
                    })()}
                  </p>
                  {/* Comment Reactions */}
                  <div className="mt-2 flex items-center space-x-2">
                    <ReactionButton
                      type="like"
                      count={comment.reactions?.like || 0}
                      postId={postId}
                      commentId={comment._id}
                      onReactionUpdate={handleReactionUpdate}
                      size="sm"
                    />
                    <ReactionButton
                      type="love"
                      count={comment.reactions?.love || 0}
                      postId={postId}
                      commentId={comment._id}
                      onReactionUpdate={handleReactionUpdate}
                      size="sm"
                    />
                    <ReactionButton
                      type="laugh"
                      count={comment.reactions?.laugh || 0}
                      postId={postId}
                      commentId={comment._id}
                      onReactionUpdate={handleReactionUpdate}
                      size="sm"
                    />
                    <ReactionButton
                      type="angry"
                      count={comment.reactions?.angry || 0}
                      postId={postId}
                      commentId={comment._id}
                      onReactionUpdate={handleReactionUpdate}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {(!Array.isArray(sortedComments) || sortedComments.length === 0) && (
          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeletionConfirmation
        isOpen={!!deletingComment}
        onClose={() => setDeletingComment(null)}
        onConfirm={handleDeleteComment}
        title="Delete Comment"
        itemType="comment"
        itemPreview={deletingComment ? (deletingComment.text || deletingComment.content) : ''}
        confirmButtonText="Delete"
        isDeleting={isDeleting}
      />
      {/* Edit Comment Modal */}
      <CommentEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setCommentToEdit(null);
        }}
        comment={commentToEdit}
        onSave={handleSaveEdit}
        isSubmitting={editSubmitting}
        error={editError}
      />
    </div>
  );
};

export default CommentSection;
