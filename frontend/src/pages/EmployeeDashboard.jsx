// src/pages/EmployeeDashboard.jsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { encryptContent } from '../utils/crypto';
import { decryptContent } from '../utils/crypto';
import { Helmet } from 'react-helmet';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { Fragment } from 'react';
import { api } from '../utils/axios';  // Consolidated axios instance
import { uploadMedia } from '../utils/uploadMedia';
import { hasReacted, toggleReaction } from '../utils/reactions';
import {
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftOnRectangleIcon,
  PencilSquareIcon,
  EyeIcon,
  CheckBadgeIcon,
  BuildingOfficeIcon,
  HandThumbUpIcon as ThumbUpIcon,
  HeartIcon,
  CheckIcon as CheckIconOutline,
  FaceSmileIcon as EmojiHappyIcon,
  FaceFrownIcon as EmojiSadIcon,
  XCircleIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  XMarkIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  Bars3Icon,
  ExclamationTriangleIcon,
  TagIcon,
  MapPinIcon,
  BuildingLibraryIcon,
  ChevronUpDownIcon,
  HomeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/solid';
import Sidebar from '../components/Sidebar';
import PostCreation from '../components/PostCreation';
import DeletionConfirmation from '../components/DeletionConfirmation';

// --- Organization Access Modal Component ---
const OrgAccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Access Restricted</h3>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Probably the admin edited the employee email list or deleted the organization.
            Please contact your organization administrator for assistance.
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Re-verify the organization access if anything changed.
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Theme Hook ---
const useTheme = () => {
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return [theme, toggleTheme];
};

// --- Custom Select Component ---
const CustomSelect = ({ value, onChange, options, label, icon: Icon, disabled = false }) => {
  const selectedOption = options.find(opt => opt.value === value) || (options.length > 0 ? options[0] : {label: 'Select', value: ''});
  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      {({ open }) => (
        <div className="relative w-full sm:w-40">
          <Listbox.Label className="flex items-center text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
            {Icon && <Icon className="h-4 w-4 mr-1 text-gray-400 dark:text-slate-500" />}
            {label}
          </Listbox.Label>
          <Listbox.Button className={`relative w-full cursor-default rounded-md py-3 pl-3 pr-10 text-left text-sm bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <span className="block truncate text-gray-900 dark:text-slate-100">{selectedOption.label || 'Select'}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-slate-400" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition show={open} as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option 
                  key={option.value} 
                  className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-slate-100'}`} 
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                        {option.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                          <CheckIconOutline className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
};

// --- Theme Toggle Button ---
const ThemeToggle = ({ theme, toggleTheme }) => (
  <button
    onClick={toggleTheme}
    className="relative inline-flex items-center justify-center w-10 h-10 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900 transition-all duration-200"
    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={theme === 'dark' ? 'moon' : 'sun'}
        initial={{ y: -20, opacity: 0, rotate: -90 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        exit={{ y: 20, opacity: 0, rotate: 90 }}
        transition={{ duration: 0.2 }}
      >
        {theme === 'dark' ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-blue-500" />}
      </motion.div>
    </AnimatePresence>
  </button>
);

// --- Reaction Button Component ---
const ReactionButton = ({ type, count, postId, commentId = null }) => {
  const [isReacted, setIsReacted] = useState(false);
  const [currentCount, setCurrentCount] = useState(count);
  const [isLoading, setIsLoading] = useState(false);
  const orgId = localStorage.getItem('orgId');

  // Helper function to build the API endpoint
  const buildEndpoint = (basePath, includeOrgId = true) => {
    if (includeOrgId && orgId) {
      return commentId 
        ? `${basePath}/org/${orgId}/${postId}/comments/${commentId}/reactions`
        : `${basePath}/org/${orgId}/${postId}/reactions`;
    }
    return commentId 
      ? `${basePath}/${postId}/comments/${commentId}/reactions`
      : `${basePath}/${postId}/reactions`;
  };

  // Fetch reaction status on mount and when postId/commentId/type changes
  useEffect(() => {
    const fetchReactionStatus = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) return;
      
      try {
        // Try with orgId first if available
        const endpoint = buildEndpoint('/posts', true);
        const response = await api.get(endpoint, {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storedToken}` 
          }
        });

        if (response.data?.success && response.data?.data) {
          const reactionData = response.data.data[type];
          if (reactionData) {
            setIsReacted(reactionData.hasReacted);
            setCurrentCount(reactionData.count);
          }
        }
      } catch (error) {
        // If we have an orgId and got a 404, try without orgId
        if (orgId && error.response?.status === 404) {
          try {
            const fallbackEndpoint = buildEndpoint('/posts', false);
            const fallbackResponse = await api.get(fallbackEndpoint, {
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${storedToken}` 
              }
            });

            if (fallbackResponse.data?.success && fallbackResponse.data?.data) {
              const reactionData = fallbackResponse.data.data[type];
              if (reactionData) {
                setIsReacted(reactionData.hasReacted);
                setCurrentCount(reactionData.count);
              }
            }
          } catch (fallbackError) {
            console.error('Error fetching reaction status from fallback endpoint:', fallbackError);
          }
        } else {
          console.error('Error fetching reaction status:', error);
        }
      }
    };

    fetchReactionStatus();
  }, [postId, commentId, type, orgId]);

  const handleReaction = async () => {
    if (isLoading) return;
    
    const wasReacted = isReacted;
    const newIsReacted = !wasReacted;
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
      console.error('No authentication token found');
      return;
    }
    
    // Optimistic UI updates
    setIsLoading(true);
    setIsReacted(newIsReacted);
    setCurrentCount(prev => newIsReacted ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      // First try with orgId if available
      const endpoint = buildEndpoint('/posts', true);
      
      const response = await api.post(
        endpoint, 
        { type },
        { 
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storedToken}` 
          } 
        }
      );
      
      // Update with server response
      if (response.data?.success && response.data?.reaction) {
        setIsReacted(response.data.reaction.hasReacted);
        setCurrentCount(response.data.reaction.count);
        return;
      }
    } catch (error) {
      // If we have an orgId and got a 404, try without orgId
      if (orgId && error.response?.status === 404) {
        try {
          const fallbackEndpoint = buildEndpoint('/posts', false);
          const fallbackResponse = await api.post(
            fallbackEndpoint,
            { type },
            { 
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${storedToken}` 
              } 
            }
          );

          if (fallbackResponse.data?.success && fallbackResponse.data?.reaction) {
            setIsReacted(fallbackResponse.data.reaction.hasReacted);
            setCurrentCount(fallbackResponse.data.reaction.count);
            return;
          }
        } catch (fallbackError) {
          console.error('Error updating reaction via fallback endpoint:', fallbackError);
          throw fallbackError;
        }
      } else {
        console.error('Error updating reaction:', error);
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    const baseClasses = "h-5 w-5";
    switch(type) {
      case 'like': 
        return <ThumbUpIcon className={`${baseClasses} text-gray-700 dark:text-slate-200`} />;
      case 'love': 
        return <HeartIcon className={`${baseClasses} text-red-500 dark:text-red-400`} />;
      case 'laugh': 
        return <EmojiHappyIcon className={`${baseClasses} text-yellow-500 dark:text-yellow-400`} />;
      case 'angry': 
        return <XCircleIcon className={`${baseClasses} text-orange-500 dark:text-orange-400`} />;
      default: 
        return <ThumbUpIcon className={`${baseClasses} text-gray-700 dark:text-slate-200`} />;
    }
  };

  return (
    <button
      onClick={handleReaction}
      className={`flex items-center gap-1 px-2 py-1 rounded-full ${
        isReacted ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-slate-700'
      }`}
      title={isReacted ? `You reacted with ${type}` : `React with ${type}`}
    >
      {getIcon()}
      <span className="text-sm text-gray-800 dark:text-slate-200">{currentCount}</span>
    </button>
  );
};

// --- Comment Section Component ---
const CommentSection = ({ postId, comments: initialComments = [], onCommentAdded }) => {
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState(initialComments || []);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // Update local comments when initialComments prop changes
  useEffect(() => {
    setLocalComments(initialComments || []);
  }, [initialComments]);

  // Function to fetch the post with its comments
  const fetchPostWithComments = async () => {
    const storedToken = localStorage.getItem('token');
    const orgId = localStorage.getItem('orgId');
    
    if (!storedToken || !orgId) {
      console.error('Authentication token or organization ID not found');
      return;
    }
    
    if (!postId) {
      console.error('No post ID provided');
      return;
    }
    
    console.log('Fetching post with comments. Post ID:', postId, 'Org ID:', orgId);
    
    try {
      // Get the specific post with comments and author info populated
      const response = await api.get(`/posts/org/${orgId}/posts/${postId}`);
      
      console.log('Received post data:', response.data);
      
      if (!response.data) {
        console.error('No data received from server');
        return;
      }
      
      const post = response.data;
      
      if (!post) {
        console.error('Post not found');
        return;
      }
      
      // Process comments to ensure they have proper author info
      const updatedComments = Array.isArray(post.comments)
        ? post.comments.map(comment => ({
            ...comment,
            // Ensure we have author info and default to empty object if not available
            author: comment.author || { _id: comment.author, role: 'user' },
            // For backward compatibility, check createdByRole first, then fall back to author.role
            createdByRole: comment.createdByRole || (comment.author?.role || 'user')
          }))
        : [];
      
      console.log('Updated comments with author info:', updatedComments);
      setLocalComments(updatedComments);
      
      if (onCommentAdded) {
        onCommentAdded(updatedComments);
      }
    } catch (error) {
      console.error('Error fetching post with comments:', error);
      setError('Failed to fetch post. Please try again.');
    }
  };

  const handleCommentSubmit = async () => {
    const commentText = newComment.trim();
    if (!commentText || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    // Clear input immediately for better UX
    setNewComment('');

    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        throw new Error('No authentication token found');
      }
      
      const orgId = localStorage.getItem('orgId');
      if (!orgId) {
        throw new Error('Organization ID not found');
      }
      
      console.log('Posting comment to post:', postId, 'in org:', orgId);
      
      // Encrypt the comment text before sending to the backend
      const encryptedComment = encryptContent(commentText);
      
      const response = await api.post(
        `/posts/${postId}/comments`, 
        { 
          text: encryptedComment  // Send the encrypted comment text
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedToken}`
          }
        }
      );
      
      console.log('Comment posted successfully, response:', response.data);
      
      // If the response includes the updated post with comments, use that
      if (response.data && response.data.post && response.data.post.comments) {
        const updatedComments = response.data.post.comments.map(comment => ({
          ...comment,
          // Ensure we have the author info
          author: comment.author || {
            _id: 'unknown',
            name: 'Unknown User',
            email: 'unknown@example.com',
            role: comment.createdByRole || 'user'
          },
          // Ensure we have a createdByRole
          createdByRole: comment.createdByRole || 'user'
        }));
        
        setLocalComments(updatedComments);
        if (onCommentAdded) {
          onCommentAdded(updatedComments);
        }
      } else {
        // Fallback to fetching the updated comments from the backend
        await fetchPostWithComments();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to post comment';
      console.error('Error details:', errorMessage);
      setError(errorMessage);
      // Restore the comment text so user can try again
      setNewComment(commentText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteDialog(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setCommentToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete || isLoading) return;
    
    setIsLoading(true);
    setShowDeleteDialog(false);
    
    try {
      const storedToken = localStorage.getItem('token');
      const orgId = localStorage.getItem('orgId');
      if (!orgId) {
        throw new Error('Organization ID not found');
      }
      
      await api.delete(
        `/posts/${postId}/comments/${commentToDelete}`,  
        { 
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storedToken}` 
          } 
        }
      );
      
      // Optimistic update
      const updatedComments = localComments.filter(c => c._id !== commentToDelete);
      setLocalComments(updatedComments);
      setError(null);
      
      // Notify parent component about the deleted comment
      if (onCommentAdded) {
        onCommentAdded(updatedComments);
      }
      
      // Comment deleted successfully, no need to show a message
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(error.response?.data?.message || 'Failed to delete comment');
      // Error already handled by error state
    } finally {
      setIsLoading(false);
      setCommentToDelete(null);
    }
  };
  
  // For backward compatibility
  const handleCommentDelete = handleDeleteClick;
  
  const renderDeleteButton = (commentId) => {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteClick(commentId);
        }}
        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        disabled={isLoading}
        title="Delete comment"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    );
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Delete Confirmation Dialog */}
      <DeletionConfirmation
        isOpen={showDeleteDialog}
        onClose={handleCancelDelete}
        title="Delete Comment"
        itemType="comment"
        itemPreview={commentToDelete ? localComments.find(c => c._id === commentToDelete)?.text : ''}
        isDeleting={isLoading}
        onConfirm={handleConfirmDelete}
        confirmButtonText={isLoading ? 'Deleting...' : 'Delete'}
      />
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
          placeholder="Write a comment..."
          disabled={isSubmitting}
          className="flex-1 p-2 rounded bg-gray-100 text-gray-900 dark:bg-slate-700 dark:text-white disabled:opacity-50"
        />
        <button
          onClick={handleCommentSubmit}
          disabled={!newComment.trim() || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Posting...
            </>
          ) : (
            'Post'
          )}
        </button>
      </div>

      {localComments.map(comment => {
        const currentUserId = localStorage.getItem('userId');
        const currentUserRole = localStorage.getItem('role') || 'user';
        
        // Get the author ID from various possible locations in the comment object
        let authorId = '';
        // Check if author is an object with _id
        if (comment.author && typeof comment.author === 'object' && comment.author._id) {
          authorId = comment.author._id.toString().trim();
        } 
        // Check if author is a direct ID string
        else if (typeof comment.author === 'string') {
          authorId = comment.author.trim();
        }
        // Fallback to other possible ID fields
        else if (comment.createdBy) {
          authorId = comment.createdBy.toString().trim();
        } else if (comment.authorId) {
          authorId = comment.authorId.toString().trim();
        }
        
        // Check if the current user is the author (compare string values)
        const normalizedCurrentUserId = currentUserId ? currentUserId.toString().trim() : '';
        const isAuthor = authorId && normalizedCurrentUserId && 
                        authorId === normalizedCurrentUserId;
        
        // Check if user is admin (either from role or comment's createdByRole)
        const isAdmin = currentUserRole === 'admin' || 
                       comment.createdByRole === 'admin' || 
                       (comment.author && comment.author.role === 'admin');
        
        return (
          <div key={comment._id} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium dark:text-white">
                  {comment.author?.name || <span className="text-gray-800 dark:text-slate-200">Anonymous</span>}
                </span>
                <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${
                  isAdmin 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  {isAdmin ? 'Admin' : 'User'}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              {isAuthor && (
                renderDeleteButton(comment._id)
              )}
            </div>
            
            <p className="text-gray-800 dark:text-slate-200 mb-3">{comment.text}</p>
            
            {/* Use the same ReactionButton component as posts */}
            <div className="flex gap-2">
              {['like', 'love', 'laugh', 'angry'].map((type) => (
                <ReactionButton
                  key={type}
                  type={type}
                  postId={postId}
                  commentId={comment._id}
                  count={comment.reactions?.[type]?.count || 0}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Action Card Component ---
const ActionCard = ({
  title,
  description,
  buttonText,
  onClick,
  icon: Icon,
  bgColorClass = "bg-slate-50 dark:bg-slate-800/60",
  accentColorClass = "text-blue-600 dark:text-blue-400"
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className={`p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ${bgColorClass} border border-transparent hover:border-blue-500/30 dark:hover:border-blue-500/50 flex flex-col justify-between`}
  >
    <div>
      {Icon && <Icon className={`h-8 w-8 mb-3 ${accentColorClass}`} />}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">{description}</p>
    </div>
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full mt-auto px-4 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200
                  ${buttonText === "Logout" 
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                  }`}
    >
      {buttonText}
    </motion.button>
  </motion.div>
);

// --- Import MediaViewer Component ---
import MediaViewer from '../components/MediaViewer';

// --- Main Dashboard Component ---
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(true); // Track if email is verified in organization
  const [viewMode, setViewMode] = useState('dashboard');
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [viewingMedia, setViewingMedia] = useState({ isOpen: false, url: null, type: null });
  const [loading, setLoading] = useState({ posts: false, create: false });
  const [error, setError] = useState(null);
  const [newPost, setNewPost] = useState({
    postType: 'feedback',
    content: '',
    mediaUrls: [], // Will store objects with file, preview, url, isUploading, progress
    region: '',
    department: ''
  });
  
  // Clean up object URLs when component unmounts or mediaUrls changes
  useEffect(() => {
    const mediaUrls = newPost.mediaUrls;
    return () => {
      mediaUrls.forEach(media => {
        if (media?.preview) {
          URL.revokeObjectURL(media.preview);
        }
      });
    };
  }, [newPost.mediaUrls]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showDeletePostDialog, setShowDeletePostDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [showOrgAccessModal, setShowOrgAccessModal] = useState(false);
  
  // Post filters
  const [selectedPostType, setSelectedPostType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const ws = useRef(null); // WebSocket reference
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000'; // WebSocket URL

  // --- Fetch Organization Details ---
  const fetchOrganizationDetails = async (orgId) => {
    try {
      const response = await api.get(`/organizations/${orgId}`);
      if (response.data && response.data.name) {
        setOrganizationName(response.data.name);
        localStorage.setItem('organizationName', response.data.name);
      }
    } catch (error) {
      console.error('Error fetching organization details:', error);
      // Always show this message on any error
      setOrganizationName('Probably the admin edited the employee email list or deleted the organization');
    }
  };

  // --- Check if email is in organization's verified emails ---
  const verifyEmailInOrganization = async (email, orgId) => {
    try {
      const response = await api.get(`/organizations/${orgId}/verify-email`, {
        params: { email }
      });
      
      if (response.data?.success && response.data?.data?.isVerified) {
        setIsEmailVerified(true);
        return true;
      } else {
        setIsEmailVerified(false);
        setOrganizationName('Probably the admin edited the employee email list or deleted the organization');
        return false;
      }
    } catch (error) {
      console.error('Error verifying email with organization:', error);
      setIsEmailVerified(false);
      setOrganizationName('Probably the admin edited the employee email list or deleted the organization');
      return false;
    }
  };

  // --- Authentication Effect ---
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const storedEmail = localStorage.getItem('email');
        const storedRole = localStorage.getItem('role');
        const storedToken = localStorage.getItem('token');
        const storedOrgId = localStorage.getItem('orgId')?.trim(); // Trim any whitespace from orgId

        if (!storedEmail || !storedRole || !storedToken || !storedOrgId || storedRole !== 'employee') {
          navigate('/signin', { state: { message: 'Employee access required. Please sign in.' } });
          return;
        }
        
        // First verify the email is still in the organization's verified list
        const isEmailValid = await verifyEmailInOrganization(storedEmail, storedOrgId);
        if (!isEmailValid) {
          // Don't proceed further if email is not in organization
          return;
        }

        // Verify token and check verification status
        const response = await api.get('/auth/verify-status', {
          params: { email: storedEmail },
          headers: { Authorization: `Bearer ${storedToken}` }
        });

        console.log('Verification status response:', response.data); // Debug log

        if (response.data.success) {
          // Check the verified status from the nested data object
          const isVerified = response.data.data?.verified;
          console.log('Is user verified?', isVerified); // Debug log
          
          if (!isVerified) {
            // If not verified, redirect to verification page
            navigate('/employee/verify', { 
              state: { 
                message: 'Please complete your verification first.',
                email: storedEmail,
                orgId: storedOrgId
              } 
            });
            return;
          }
          
          setEmployeeEmail(storedEmail);
          setOrganizationId(storedOrgId);
          // Fetch organization details and posts in parallel
          await Promise.all([
            fetchOrganizationDetails(storedOrgId),
            fetchPosts()
          ]);
        } else {
          localStorage.clear();
          navigate('/signin', { state: { message: 'Session expired. Please sign in again.' } });
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.clear();
        navigate('/signin', { state: { message: 'Authentication failed. Please sign in again.' } });
      }
    };

    verifyAuth();
  }, [navigate]);

  // --- Helper function to process and decrypt WebSocket messages ---
  const processWebSocketMessage = useCallback(async (message) => {
    try {
      const data = JSON.parse(message.data);
      
      // Skip if not for current organization
      if (data.organization !== organizationId) return null;

      // Create a deep copy of the message to avoid mutating the original
      const processedMessage = JSON.parse(JSON.stringify(data));
      
      // Handle different message types
      switch (processedMessage.type) {
        case 'POST_CREATED':
        case 'POST_UPDATED':
          // Decrypt post content
          if (processedMessage.payload.post?.content) {
            processedMessage.payload.post.content = await decryptContent(processedMessage.payload.post.content);
          }
          // Decrypt comments in post if they exist
          if (Array.isArray(processedMessage.payload.post?.comments)) {
            for (const comment of processedMessage.payload.post.comments) {
              if (comment.content) {
                comment.content = await decryptContent(comment.content);
              }
            }
          }
          break;
          
        case 'COMMENT_CREATED':
        case 'COMMENT_UPDATED':
          if (processedMessage.payload.comment?.content) {
            processedMessage.payload.comment.content = await decryptContent(processedMessage.payload.comment.content);
          }
          break;
          
        // No need to decrypt for DELETE or REACTION_UPDATE events
        case 'POST_DELETED':
        case 'COMMENT_DELETED':
        case 'REACTION_UPDATED':
        default:
          break;
      }
      
      return processedMessage;
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      return null;
    }
  }, [organizationId]);

  // --- WebSocket Effect for Real-time Updates ---
  useEffect(() => {
    if (!organizationId) return;
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log('EmployeeDashboard: No organizationId, closing WebSocket.');
      ws.current.close();
    }

    if (ws.current && ws.current.readyState !== WebSocket.CLOSED && ws.current.readyState !== WebSocket.CLOSING) {
        // Initialize WebSocket connection when organizationId is available
    } else {
        // Use WebSocket URL from environment variable with fallback
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
        console.log(`Connecting to WebSocket at ${wsUrl}`);
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('WebSocket connection established');
        };

        ws.current.onclose = (event) => {
            console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
            // Attempt to reconnect after 3 seconds
            setTimeout(() => {
                if (organizationId) {
                    console.log('Attempting to reconnect WebSocket...');
                    ws.current = new WebSocket(wsUrl);
                }
            }, 3000);
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.current.onmessage = async (message) => {
            try {
                // Process and decrypt the message
                const processedMessage = await processWebSocketMessage(message);
                if (!processedMessage) return;

                // Skip if this message is not for the current organization
                const orgId = processedMessage.payload.organizationId || 
                              processedMessage.payload.organization;
                if (!orgId || orgId !== organizationId) {
                    console.debug('EmployeeDashboard: WebSocket message for different organization, ignoring.');
                    return;
                }


                // Process message based on type
                switch (processedMessage.type) {
                    case 'POST_CREATED':
                        if (!processedMessage.payload._id || !processedMessage.payload.createdAt) {
                            console.warn('EmployeeDashboard: Invalid POST_CREATED payload:', processedMessage.payload);
                            return;
                        }
                        setPosts(prevPosts => [processedMessage.payload, ...prevPosts]);
                        break;

                    case 'POST_UPDATED':
                        if (!processedMessage.payload._id) {
                            console.warn('EmployeeDashboard: Invalid POST_UPDATED payload:', processedMessage.payload);
                            return;
                        }
                        setPosts(prevPosts =>
                            prevPosts.map(post =>
                                post._id === processedMessage.payload._id ? processedMessage.payload : post
                            )
                        );
                        break;

                    case 'POST_DELETED':
                        if (!processedMessage.payload.postId) {
                            console.warn('EmployeeDashboard: Invalid POST_DELETED payload:', processedMessage.payload);
                            return;
                        }
                        setPosts(prevPosts =>
                            prevPosts.filter(post => post._id !== processedMessage.payload.postId)
                        );
                        break;
                    case 'COMMENT_CREATED':
                        if (!processedMessage.payload.postId || !processedMessage.payload.comment?._id) {
                            console.warn('EmployeeDashboard: Invalid COMMENT_CREATED payload:', processedMessage.payload);
                            return;
                        }
                        setPosts(prevPosts => {
                            return prevPosts.map(post => {
                                if (post._id === processedMessage.payload.postId) {
                                    // Check if comment already exists to prevent duplicates
                                    const commentExists = post.comments?.some(
                                        c => c._id === processedMessage.payload.comment._id
                                    );
                                    
                                    if (commentExists) {
                                        console.log('Comment already exists, skipping duplicate');
                                        return post;
                                    }

                                    return {
                                        ...post,
                                        comments: [
                                            processedMessage.payload.comment,
                                            ...(post.comments || [])
                                        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
                                        commentCount: (post.commentCount || 0) + 1
                                    };
                                }
                                return post;
                            });
                        });
                        break;

                    case 'COMMENT_UPDATED':
                        if (!processedMessage.payload.postId || !processedMessage.payload.comment?._id) {
                            console.warn('EmployeeDashboard: Invalid COMMENT_UPDATED payload:', processedMessage.payload);
                            return;
                        }
                        setPosts(prevPosts => {
                            return prevPosts.map(post => {
                                if (post._id === processedMessage.payload.postId) {
                                    const existingComment = post.comments?.find(c => c._id === processedMessage.payload.comment._id);
                                    if (!existingComment) {
                                        console.warn('EmployeeDashboard: Comment not found for update:', processedMessage.payload.comment._id);
                                        return post;
                                    }
                                    return {
                                        ...post,
                                        comments: (post.comments || [])
                                            .map(c => c._id === processedMessage.payload.comment._id 
                                                ? { ...c, ...processedMessage.payload.comment }
                                                : c
                                            )
                                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                    };
                                }
                                return post;
                            });
                        });
                        break;

                    case 'COMMENT_DELETED':
                        if (!processedMessage.payload.postId || !processedMessage.payload.commentId) {
                            console.warn('EmployeeDashboard: Invalid COMMENT_DELETED payload:', processedMessage.payload);
                            return;
                        }
                        setPosts(prevPosts => {
                            return prevPosts.map(post => {
                                if (post._id === processedMessage.payload.postId) {
                                    return {
                                        ...post,
                                        comments: (post.comments || []).filter(c => c._id !== processedMessage.payload.commentId),
                                        commentCount: Math.max(0, (post.commentCount || 0) - 1)
                                    };
                                }
                                return post;
                            });
                        });
                        break;

                    case 'REACTION_UPDATED':
                        if (!processedMessage.payload.entityType || !processedMessage.payload.entityId) {
                            console.warn('EmployeeDashboard: Invalid REACTION_UPDATED payload:', processedMessage.payload);
                            return;
                        }
                        
                        // Use reactions if available, otherwise fall back to reactionsSummary
                        const reactionsData = processedMessage.payload.reactions || processedMessage.payload.reactionsSummary;
                        if (!reactionsData) {
                            console.warn('EmployeeDashboard: Missing reactions data in payload:', processedMessage.payload);
                            return;
                        }
                        
                        // Get the current user ID for hasReacted check
                        const currentUserId = user?._id;
                        
                        // Process reactions to ensure they have the correct format
                        const processedReactions = {};
                        Object.entries(reactionsData).forEach(([reactionType, reaction]) => {
                            if (!reaction) {
                                processedReactions[reactionType] = { count: 0, users: [], hasReacted: false };
                                return;
                            }
                            
                            const userList = Array.isArray(reaction.users) ? 
                                reaction.users : [];
                                
                            processedReactions[reactionType] = {
                                count: reaction.count || 0,
                                users: userList,
                                hasReacted: currentUserId ? 
                                    userList.some(id => id === currentUserId || id.toString() === currentUserId) : 
                                    false
                            };
                        });
                        
                        console.log('Processing REACTION_UPDATED:', {
                            entityType: processedMessage.payload.entityType,
                            entityId: processedMessage.payload.entityId,
                            postId: processedMessage.payload.postId,
                            reactions: processedReactions
                        });
                        
                        setPosts(prevPosts => {
                            return prevPosts.map(post => {
                                // Handle post reactions
                                if (processedMessage.payload.entityType === 'post' && post._id === processedMessage.payload.entityId) {
                                    console.log(`Updating reactions for post ${post._id}`);
                                    return { 
                                        ...post, 
                                        reactions: {
                                            ...post.reactions, // Keep existing reactions
                                            ...processedReactions // Update with new reaction data
                                        },
                                        updatedAt: processedMessage.payload.updatedAt || new Date().toISOString()
                                    };
                                } 
                                // Handle comment reactions
                                else if (processedMessage.payload.entityType === 'comment' && post._id === processedMessage.payload.postId) {
                                    console.log(`Checking comments in post ${post._id} for comment ${processedMessage.payload.entityId}`);
                                    const updatedComments = (post.comments || []).map(comment => {
                                        if (comment._id === processedMessage.payload.entityId) {
                                            console.log(`Updating reactions for comment ${comment._id}`);
                                            return { 
                                                ...comment,
                                                reactions: {
                                                    ...comment.reactions, // Keep existing reactions
                                                    ...processedReactions // Update with new reaction data
                                                },
                                                updatedAt: processedMessage.payload.updatedAt || new Date().toISOString()
                                            };
                                        }
                                        return comment;
                                    });
                                    
                                    return {
                                        ...post,
                                        comments: updatedComments
                                    };
                                }
                                return post;
                            });
                        });
                        break;
                    default:
                        console.log('EmployeeDashboard: Unhandled WebSocket message type:', message.type);
                }
            } catch (error) {
                console.error('EmployeeDashboard: Failed to parse WebSocket message or update state:', error);
            }
        };

        ws.current.onerror = (error) => {
            console.error('EmployeeDashboard: WebSocket error:', error);
        };

        ws.current.onclose = (event) => {
            console.log('EmployeeDashboard: WebSocket disconnected.', event.code, event.reason);
        };
    }

    // Cleanup on component unmount or when organizationId changes
    return () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            console.log('EmployeeDashboard: Closing WebSocket connection.');
            ws.current.close();
        }
    };
  }, [organizationId, setPosts]); // Dependencies for the WebSocket effect


  // --- Fetch Posts ---
  const fetchPosts = async () => {
    // Don't fetch posts if not verified or no organization ID
    if (!isEmailVerified || !organizationId) {
      setPosts([]); // Clear any existing posts
      return;
    }

    setLoading(prev => ({ ...prev, posts: true }));
    setError(null);

    try {
      const storedToken = localStorage.getItem('token');
      
      // Ensure organizationId is trimmed before making the API call
      const trimmedOrgId = organizationId.trim();
      
      // Use the correct endpoint format with organization ID as URL parameter
      const response = await api.get(`/posts/org/${trimmedOrgId}`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        }
      });
      
      // Handle successful response
      let postsData = [];
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        postsData = response.data;
      } else if (response.data && Array.isArray(response.data.posts)) {
        postsData = response.data.posts;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        postsData = response.data.data;
      } else {
        console.warn('Unexpected response format, using empty array');
      }

      // Sort posts by creation date (newest first)
      const sortedPosts = [...postsData].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      
      setPosts(sortedPosts);
      
    } catch (err) {
      console.error('Error fetching posts:', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      
      // Set a more user-friendly error message
      let errorMessage = 'Failed to fetch posts. Please try again later.';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Session expired. Please sign in again.';
          // Optionally redirect to login
          navigate('/signin');
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      setError(errorMessage);
      setPosts([]); // Ensure posts is always an array
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  };

  // --- Handle File Upload ---
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Reset file input
    e.target.value = '';
    
    setLoading(prev => ({ ...prev, create: true }));
    setError(null);

    try {
      // Filter out files that are too large (>10MB)
      const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
      
      if (validFiles.length < files.length) {
        setError('Some files were too large (max 10MB) and were not uploaded.');
      }

      if (validFiles.length === 0) {
        setLoading(prev => ({ ...prev, create: false }));
        return;
      }

      // Create preview URLs for immediate display
      const previewFiles = validFiles.map(file => ({
        id: URL.createObjectURL(file), // Use URL as unique ID
        file,
        preview: URL.createObjectURL(file),
        isUploading: true,
        progress: 0,
        error: null
      }));

      // Add to mediaUrls with preview
      setNewPost(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, ...previewFiles]
      }));

      // Upload files one by one to track progress for each
      for (const item of previewFiles) {
        try {
          const url = await uploadMedia(item.file, (progress) => {
            setNewPost(prev => ({
              ...prev,
              mediaUrls: prev.mediaUrls.map(m => 
                m.id === item.id ? { ...m, progress } : m
              )
            }));
          });

          // Update with final URL and mark as uploaded
          setNewPost(prev => ({
            ...prev,
            mediaUrls: prev.mediaUrls.map(m => 
              m.id === item.id 
                ? { ...m, url, isUploading: false, progress: 100 }
                : m
            )
          }));
        } catch (err) {
          console.error('Error uploading file:', err);
          
          // Mark the upload as failed
          setNewPost(prev => ({
            ...prev,
            mediaUrls: prev.mediaUrls.map(m => 
              m.id === item.id 
                ? { 
                    ...m, 
                    isUploading: false, 
                    error: 'Upload failed',
                    progress: 0
                  } 
                : m
            )
          }));
          
          setError('Failed to upload some files. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error processing files:', err);
      setError('Failed to process files. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // --- Handle Create Post ---
  const handleCreatePost = async (postData) => {
    if (!postData.content.trim() && (!postData.media || postData.media.length === 0)) {
      setError('Post content or media is required');
      return;
    }

    setLoading(prev => ({ ...prev, create: true }));
    setError(null);

    try {
      // First, upload all media files if any
      let mediaUrls = [];
      
      if (postData.media && postData.media.length > 0) {
        try {
          // Upload each media file using the uploadMedia utility
          for (const mediaItem of postData.media) {
            const fileUrl = await uploadMedia(mediaItem.file, (progress) => {
              console.log(`Upload progress for ${mediaItem.file.name}: ${progress}%`);
            });
            if (fileUrl) {
              mediaUrls.push(fileUrl);
            }
          }
        } catch (uploadError) {
          console.error('Error uploading media:', uploadError);
          setError(`Failed to upload media: ${uploadError.message}`);
          throw uploadError;
        }
      }

      // Ensure organizationId is trimmed before making the API call
      const trimmedOrgId = organizationId.trim();
      
      // Encrypt the post content before sending to the backend
      const encryptedContent = encryptContent(postData.content.trim());
      
      // Create the post with the encrypted content and uploaded media URLs
      const response = await api.post('/posts', {
        content: encryptedContent,
        postType: postData.postType,
        mediaUrls,
        region: postData.region || '',
        department: postData.department || '',
        orgId: trimmedOrgId,
        isAnonymous: true
      });

      console.log('Post created successfully:', response.data);

      // Clean up object URLs after successful post
      postData.media.forEach(media => {
        if (media.preview) URL.revokeObjectURL(media.preview);
      });

      // Fetch fresh posts to ensure we have the latest data
      await fetchPosts();
      
      // Switch to view mode to show the posts list
      setViewMode('view');
      
      // Scroll to the top of the posts list
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      return response.data; // Return the created post data
    } catch (err) {
      console.error('Error creating post:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = 'Failed to create post. Please try again.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw err; // Re-throw to allow the PostCreation component to handle the error
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  // --- Handle Logout ---
  const handleLogout = () => {
    localStorage.clear();
    navigate('/signin');
  };



  // --- Handle Comment Submit ---
  // This function is no longer needed as CommentSection handles its own submission
  const handleCommentSubmit = async (postId, text) => {
    console.log('Comment submission is now handled by the CommentSection component');
  };

  // --- Handle Post Delete ---
  const handlePostDelete = async (postId) => {
    const post = posts.find(p => p._id === postId);
    if (!post) return;
    
    setPostToDelete(post);
    setShowDeletePostDialog(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      setIsDeletingPost(true);
      await api.delete(`/posts/${postToDelete._id}`);
      setPosts(prev => prev.filter(post => post._id !== postToDelete._id));
      setShowDeletePostDialog(false);
      setPostToDelete(null);
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(err.response?.data?.message || 'Failed to delete post. Please try again.');
    } finally {
      setIsDeletingPost(false);
    }
  };

  const cancelDeletePost = () => {
    setShowDeletePostDialog(false);
    setPostToDelete(null);
  };

  // --- Handle Comment Delete ---
  const handleCommentDelete = async (postId, commentId) => {
    try {
      await api.delete(`/posts/${postId}/comment/${commentId}`);
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: post.comments.filter(c => c._id !== commentId)
          };
        }
        return post;
      }));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err.response?.data?.message || 'Failed to delete comment. Please try again.');
    }
  };

  const actions = [
    {
      title: "Create New Post",
      description: isEmailVerified 
        ? "Share your feedback, complaints, or suggestions. Tag region & department if needed."
        : "Please verify your email with the organization to create posts.",
      buttonText: "Create Post",
      onClick: isEmailVerified ? () => setViewMode('create') : () => setShowOrgAccessModal(true),
      icon: PencilSquareIcon,
      bgColorClass: isEmailVerified 
        ? "bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40" 
        : "bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed opacity-70 hover:opacity-100 transition-opacity",
      accentColorClass: isEmailVerified 
        ? "text-blue-600 dark:text-blue-400" 
        : "text-gray-500 dark:text-gray-400"
    },
    {
      title: "View Posts",
      description: isEmailVerified 
        ? "Browse all anonymous posts within your organization"
        : "Please verify your email with the organization to view posts.",
      buttonText: "View Posts",
      onClick: isEmailVerified 
        ? () => {
            fetchPosts();
            setViewMode('view');
          }
        : () => setShowOrgAccessModal(true),
      icon: EyeIcon,
      bgColorClass: isEmailVerified 
        ? "bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/40" 
        : "bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed opacity-70 hover:opacity-100 transition-opacity",
      accentColorClass: isEmailVerified 
        ? "text-indigo-600 dark:text-indigo-400" 
        : "text-gray-500 dark:text-gray-400"
    },
    {
      title: "Organization Verification",
      description: "Re-verify or update your organizational details if you've changed roles or departments.",
      buttonText: "Verify Details",
      onClick: () => navigate('/employee/verify'),
      icon: CheckBadgeIcon,
      bgColorClass: "bg-emerald-50 dark:bg-emerald-900/30",
      accentColorClass: "text-emerald-600 dark:text-emerald-400"
    }
  ];

  // Navigation items for the sidebar
  const navItems = [
    { 
      name: 'Create Post', 
      icon: PencilSquareIcon, 
      action: isEmailVerified 
        ? () => setViewMode('create')
        : () => setShowOrgAccessModal(true),
      current: viewMode === 'create',
      disabled: !isEmailVerified
    },
    { 
      name: 'View Posts', 
      icon: EyeIcon, 
      action: isEmailVerified 
        ? () => {
            fetchPosts();
            setViewMode('view');
          }
        : () => setShowOrgAccessModal(true),
      current: viewMode === 'view',
      disabled: !isEmailVerified
    },
    { 
      name: 'Verify Details', 
      icon: CheckBadgeIcon, 
      action: () => navigate('/employee/verify'),
      current: false
    }
  ];

  const user = {
    name: localStorage.getItem('email') || "Anonymous Employee"
  };

  // Filter posts based on selected filters
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Filter by post type
      if (selectedPostType !== 'all' && post.postType !== selectedPostType) {
        return false;
      }
      
      // Filter by region
      if (selectedRegion !== 'all' && post.region !== selectedRegion) {
        return false;
      }
      
      // Filter by department
      if (selectedDepartment !== 'all' && post.department !== selectedDepartment) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery && !post.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [posts, selectedPostType, selectedRegion, selectedDepartment, searchQuery]);

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto"
          >
            <PostCreation
              onSend={handleCreatePost}
              onCancel={() => setViewMode('dashboard')}
              showRegionDepartment={true}
              initialRegion={newPost.region}
              initialDepartment={newPost.department}
              postTypes={['feedback', 'complaint', 'suggestion', 'public']}
              initialPostType={newPost.postType}
              onPostTypeChange={(type) => setNewPost(prev => ({ ...prev, postType: type }))}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"
              buttonText={loading.create ? 'Posting...' : 'Post'}
              disabled={loading.create}
            />
          </motion.div>
        );

      case 'view':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"
          >
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Posts</h2>
              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                <CustomSelect 
                  label="Type" 
                  value={selectedPostType} 
                  onChange={setSelectedPostType} 
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'feedback', label: 'Feedback' },
                    { value: 'complaint', label: 'Complaint' },
                    { value: 'suggestion', label: 'Suggestion' },
                    { value: 'public', label: 'Public' }
                  ]} 
                  icon={TagIcon} 
                />
                <CustomSelect 
                  label="Region" 
                  value={selectedRegion} 
                  onChange={setSelectedRegion} 
                  options={[
                    { value: 'all', label: 'All Regions' },
                    ...Array.from(new Set(posts.map(post => post.region).filter(Boolean))).map(region => ({
                      value: region,
                      label: region
                    }))
                  ]} 
                  icon={MapPinIcon}
                />
                <CustomSelect 
                  label="Department" 
                  value={selectedDepartment} 
                  onChange={setSelectedDepartment} 
                  options={[
                    { value: 'all', label: 'All Departments' },
                    ...Array.from(new Set(posts.map(post => post.department).filter(Boolean))).map(department => ({
                      value: department,
                      label: department
                    }))
                  ]} 
                  icon={BuildingLibraryIcon}
                />
              </div>
            </div>
            {filteredPosts.length === 0 ? (
              <p className="text-gray-600 dark:text-slate-300">No posts found.</p>
            ) : (
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <p className="text-gray-600 dark:text-slate-300">No posts found.</p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Showing {filteredPosts.length} of {posts.length} posts
                  </p>
                )}
                {filteredPosts.map((post) => (
                  <motion.div
                    key={post._id}
                    className="bg-white dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 hover:shadow-md dark:hover:shadow-slate-700/50 transition-shadow duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 }}
                  >
                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium tracking-wide ${
                          post.postType === 'feedback' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' :
                          post.postType === 'complaint' ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300' :
                          post.postType === 'suggestion' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' :
                          'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                        }`}>
                          {post.postType}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          post.createdByRole === 'admin' || (post.author && post.author.role === 'admin')
                            ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          {post.createdByRole === 'admin' || (post.author && post.author.role === 'admin') ? 'Admin' : 'User'}
                        </span>
                        {/* Debug info - can be removed after verification */}
                        <div className="hidden">
                          {console.log('Post debug:', {
                            postId: post._id,
                            postAuthor: post.author,
                            currentUserId: localStorage.getItem('userId'),
                            isAuthor: post.author && (post.author._id === localStorage.getItem('userId') || post.author.id === localStorage.getItem('userId'))
                          })}
                        </div>
                      </div>
                      {post.author && (post.author._id === localStorage.getItem('userId') || post.author.id === localStorage.getItem('userId')) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePostDelete(post._id);
                          }}
                          className="text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-500 transition-colors p-1 -mr-1 -mt-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete Post"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 dark:text-slate-200 mb-2 sm:mb-3 whitespace-pre-wrap break-words">
                      {post.content}
                    </p>
                    
                    {/* Media Display */}
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {post.mediaUrls.map((media, idx) => {
                          // Handle both string and object formats
                          const mediaUrl = typeof media === 'string' ? media : (media.url || media.preview);
                          
                          if (!mediaUrl) return null;
                          
                          // Determine if it's an image or video
                          const isImage = typeof mediaUrl === 'string' && 
                                        mediaUrl.match(/\.(jpe?g|png|gif|webp)$/i);
                          
                          const isVideo = typeof mediaUrl === 'string' && 
                                        mediaUrl.match(/\.(mp4|webm|ogg)$/i);
                          
                          const handleMediaClick = (e) => {
                            e.stopPropagation();
                            setViewingMedia({
                              isOpen: true,
                              url: mediaUrl,
                              type: isImage ? 'image' : 'video'
                            });
                          };
                          
                          return isImage ? (
                            <div 
                              key={`${post._id}-media-${idx}`} 
                              className="relative group cursor-pointer"
                              onClick={handleMediaClick}
                            >
                              <img
                                src={mediaUrl}
                                alt={`Media ${idx + 1}`}
                                className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity"
                                onError={(e) => {
                                  console.error('Error loading image:', mediaUrl);
                                  e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black bg-opacity-50 rounded-full p-2">
                                  <ArrowsPointingOutIcon className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            </div>
                          ) : isVideo ? (
                            <div 
                              key={`${post._id}-media-${idx}`} 
                              className="relative group cursor-pointer"
                              onClick={handleMediaClick}
                            >
                              <video
                                src={mediaUrl}
                                className="w-full h-32 object-cover rounded-lg"
                                onError={(e) => {
                                  console.error('Error loading video:', mediaUrl);
                                  e.target.parentElement.innerHTML = `
                                    <div class="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                      <span class="text-gray-500">Video not available</span>
                                    </div>
                                  `;
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <div className="bg-black bg-opacity-50 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                    <div className="text-xs text-gray-600 dark:text-slate-300 border-t border-gray-100 dark:border-slate-700 pt-1.5 sm:pt-2 mt-1.5 sm:mt-2 flex flex-wrap gap-x-2 gap-y-1 items-center">
                      <span className="text-gray-700 dark:text-slate-200">By: {post.createdByRole === 'admin' || (post.author && post.author.role === 'admin') ? 'Admin' : (post.createdBy || 'User')}</span>
                      {(post.createdByRole === 'admin' || (post.author && post.author.role === 'admin')) && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                          Admin
                        </span>
                      )}
                      <span className="text-gray-400 dark:text-slate-500">|</span>
                      <span className="text-gray-600 dark:text-slate-300">{new Date(post.createdAt).toLocaleString()}</span>
                      <span className="hidden sm:inline text-gray-400 dark:text-slate-500">|</span>
                      <span className="block sm:inline mt-1 sm:mt-0 text-gray-600 dark:text-slate-300">Region: {post.region || 'N/A'}</span>
                      <span className="hidden sm:inline text-gray-400 dark:text-slate-500">|</span>
                      <span className="block sm:inline text-gray-600 dark:text-slate-300">Dept: {post.department || 'N/A'}</span>
                    </div>
                    {post.reactions && Object.entries(post.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(post.reactions).map(([type, {count}]) => (
                          <ReactionButton
                            key={type}
                            type={type}
                            count={count || 0}
                            postId={post._id}
                          />
                        ))}
                      </div>
                    )}
                    <div className="mt-3">
                      <CommentSection 
                        postId={post._id} 
                        comments={post.comments || []} 
                        onCommentAdded={(updatedComments) => {
                          // Update the posts state with the new comments
                          setPosts(prevPosts => 
                            prevPosts.map(p => 
                              p._id === post._id 
                                ? { ...p, comments: updatedComments } 
                                : p
                            )
                          );
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        );

      default:
        return (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100">
                Welcome to VoiceBox 👋
              </h2>
              <p className="text-gray-600 dark:text-slate-400 mt-1">
                Here are your available actions. Your contributions are valued.
              </p>
              <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-slate-400">
                <span className="font-medium">Current Organization:</span>
                <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200">
                  {organizationName || 'Loading...'}
                </span>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {actions.map((action) => (
                <ActionCard
                  key={action.title}
                  {...action}
                />
              ))}
            </div>
          </>
        );
    }
  };

  // Generate structured data for the dashboard
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Employee Dashboard - VoiceBox",
    "description": "Employee feedback and communication platform for anonymous and transparent workplace feedback.",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "publisher": {
      "@type": "Organization",
      "name": "VoiceBox"
    }
  };

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark' : ''} font-sans antialiased`} itemScope itemType="http://schema.org/WebApplication">
      {/* Organization Access Modal */}
      <OrgAccessModal 
        isOpen={showOrgAccessModal} 
        onClose={() => setShowOrgAccessModal(false)} 
      />
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Employee Dashboard | VoiceBox</title>
        <meta name="description" content="Access your VoiceBox employee dashboard to submit feedback, view posts, and engage with your workplace community." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Employee Dashboard | VoiceBox" />
        <meta property="og:description" content="Access your VoiceBox employee dashboard to submit feedback, view posts, and engage with your workplace community." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Employee Dashboard | VoiceBox" />
        <meta name="twitter:description" content="Access your VoiceBox employee dashboard to submit feedback, view posts, and engage with your workplace community." />
        <link rel="canonical" href={window.location.href} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      {/* Sidebar */}
      <Sidebar
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        sidebarNavItems={navItems}
        logo={BuildingOfficeIcon}
        title="VoiceBox"
        userEmail={localStorage.getItem('email')}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={() => {
          localStorage.clear();
          navigate('/signin');
        }}
        viewMode={viewMode}
        isAdmin={false}
        additionalHeaderContent={!isEmailVerified ? (
          <div className="fixed top-14 left-0 right-0 z-20">
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {organizationName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="mr-2 p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 md:hidden"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              aria-label="Toggle menu"
            >
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            {(viewMode === 'create' || viewMode === 'view') ? (
              <button
                onClick={() => setViewMode('dashboard')}
                className="flex items-center text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
            ) : (
              <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                Employee Dashboard
              </h1>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-slate-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300 truncate max-w-[200px]" title={localStorage.getItem('email') || ''}>
                {localStorage.getItem('email') || ''}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {renderContent()}
        </main>
      </div>
      
      {/* Media Viewer Modal */}
      {viewingMedia.isOpen && (
        <MediaViewer
          mediaUrl={viewingMedia.url}
          mediaType={viewingMedia.type}
          onClose={() => setViewingMedia({ isOpen: false, url: null, type: null })}
        />
      )}

      {/* Delete Post Confirmation Dialog */}
      <DeletionConfirmation
        isOpen={showDeletePostDialog}
        onClose={cancelDeletePost}
        title="Delete Post"
        itemType="post"
        itemPreview={postToDelete?.content}
        isDeleting={isDeletingPost}
        onConfirm={confirmDeletePost}
        confirmButtonText={isDeletingPost ? 'Deleting...' : 'Delete'}
      />
    </div>
  );
};

export default EmployeeDashboard;