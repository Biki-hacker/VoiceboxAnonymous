import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PaperAirplaneIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../../utils/axios';
import ReactionButton from './ReactionButton';
import MediaViewer from '../MediaViewer';

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
  const [editingComment, setEditingComment] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [deletingComment, setDeletingComment] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingMedia, setViewingMedia] = useState({ isOpen: false, url: '', type: 'image' });
  const commentInputRef = useRef(null);
  const { currentUser } = useAuth();

  // Update local comments when initialComments prop changes
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      if (editingComment) {
        // Update existing comment
        const response = await api.put(`/api/posts/${postId}/comments/${editingComment._id}`, {
          content: newComment
        });
        
        const updatedComment = response.data;
        const updatedComments = comments.map(comment => 
          comment._id === updatedComment._id ? updatedComment : comment
        );
        
        setComments(updatedComments);
        setEditingComment(null);
        
        if (onCommentUpdated) {
          onCommentUpdated(updatedComment);
        }
      } else {
        // Create new comment
        const response = await api.post(`/api/posts/${postId}/comments`, {
          content: newComment,
          organizationId
        });
        
        const newCommentData = response.data;
        const updatedComments = [newCommentData, ...comments];
        
        setComments(updatedComments);
        
        if (onCommentAdded) {
          onCommentAdded(newCommentData);
        }
      }
      
      setNewComment('');
      commentInputRef.current.focus();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setNewComment(comment.content);
    commentInputRef.current.focus();
  };

  const handleDeleteComment = async () => {
    if (!deletingComment || isDeleting) return;

    try {
      setIsDeleting(true);
      
      await api.delete(`/api/posts/${postId}/comments/${deletingComment._id}`);
      
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

  const handleReactionUpdate = (reactionData) => {
    const { commentId, type, isReacted, count } = reactionData;
    
    setComments(prevComments => 
      prevComments.map(comment => {
        if (comment._id === commentId) {
          const reactions = { ...comment.reactions };
          reactions[type] = count;
          
          return {
            ...comment,
            reactions,
            userReaction: isReacted ? type : null
          };
        }
        return comment;
      })
    );
  };

  const formatDate = (dateString) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const isCurrentUserComment = (comment) => {
    return currentUser && comment.userId === currentUser._id;
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
        {editingComment && (
          <button
            type="button"
            onClick={() => {
              setEditingComment(null);
              setNewComment('');
            }}
            className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </form>

      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence>
          {comments.map((comment) => (
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
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.userName || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                        {comment.updatedAt !== comment.createdAt && ' (edited)'}
                      </p>
                    </div>
                    {isCurrentUserComment(comment) && (
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditComment(comment)}
                          className="text-gray-500 hover:text-blue-500 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600"
                          title="Edit comment"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingComment(comment)}
                          className="text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600"
                          title="Delete comment"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                    {comment.content}
                  </p>
                  
                  {/* Comment Media */}
                  {comment.media && comment.media.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {comment.media.map((media, idx) => (
                        <div 
                          key={idx} 
                          className="relative group cursor-pointer"
                          onClick={() => setViewingMedia({
                            isOpen: true,
                            url: media.url,
                            type: media.type
                          })}
                        >
                          {media.type.startsWith('image/') ? (
                            <img 
                              src={media.url} 
                              alt="Comment media"
                              className="h-20 w-20 object-cover rounded-md border border-gray-200 dark:border-slate-600"
                            />
                          ) : (
                            <div className="h-20 w-20 bg-gray-100 dark:bg-slate-600 rounded-md flex items-center justify-center">
                              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-md transition-all duration-200 flex items-center justify-center">
                            <ArrowsPointingOutIcon className="h-5 w-5 text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Comment Reactions */}
                  <div className="mt-2 flex items-center space-x-2">
                    <ReactionButton
                      type="like"
                      count={comment.reactions?.like || 0}
                      postId={postId}
                      commentId={comment._id}
                      organizationId={organizationId}
                      onReactionUpdate={handleReactionUpdate}
                      size="sm"
                    />
                    <ReactionButton
                      type="love"
                      count={comment.reactions?.love || 0}
                      postId={postId}
                      commentId={comment._id}
                      organizationId={organizationId}
                      onReactionUpdate={handleReactionUpdate}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {comments.length === 0 && (
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
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        isDeleting={isDeleting}
      />
      
      {/* Media Viewer Modal */}
      <MediaViewer
        isOpen={viewingMedia.isOpen}
        onClose={() => setViewingMedia({ ...viewingMedia, isOpen: false })}
        url={viewingMedia.url}
        type={viewingMedia.type}
      />
    </div>
  );
};

export default CommentSection;
