import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  PaperAirplaneIcon, 
  UserCircleIcon,
  PencilSquareIcon,
  TrashIcon
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
            className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
        <AnimatePresence>
          {Array.isArray(comments) && comments.map((comment) => (
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
                        {comment.updatedAt !== comment.createdAt && ' (edited)'}
                      </p>
                    </div>
                    {(canEditComment(comment) || canDeleteComment(comment)) && (
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
                    {typeof (comment.text || comment.content) === 'string'
                      ? (comment.text || comment.content)
                      : '[Encrypted or invalid comment]'}
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
        {(!Array.isArray(comments) || comments.length === 0) && (
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
