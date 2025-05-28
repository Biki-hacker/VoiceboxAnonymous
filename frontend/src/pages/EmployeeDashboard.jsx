// src/pages/EmployeeDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { api } from '../api/axios';
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
  FaceSmileIcon as EmojiHappyIcon,
  FaceFrownIcon as EmojiSadIcon,
  XCircleIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  XMarkIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/solid';
import PostCreation from '../components/PostCreation';

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

  // Fetch reaction status on mount and when postId/commentId/type changes
  useEffect(() => {
    const fetchReactionStatus = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const endpoint = commentId 
          ? `/posts/${postId}/comments/${commentId}/reactions`
          : `/posts/${postId}/reactions`;

        const response = await api.get(endpoint, {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storedToken}` 
          }
        });

        // Update local state with server data
        if (response.data?.success && response.data?.data) {
          const reactionData = response.data.data[type];
          if (reactionData) {
            setIsReacted(reactionData.hasReacted);
            setCurrentCount(reactionData.count);
          }
        }
      } catch (error) {
        console.error('Error fetching reaction status:', error);
      }
    };

    fetchReactionStatus();
  }, [postId, commentId, type]);

  const handleReaction = async () => {
    if (isLoading) return;
    
    const wasReacted = isReacted;
    const newIsReacted = !wasReacted;
    
    // Optimistic UI updates
    setIsLoading(true);
    setIsReacted(newIsReacted);
    setCurrentCount(prev => newIsReacted ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      const storedToken = localStorage.getItem('token');
      const endpoint = commentId 
        ? `/posts/${postId}/comments/${commentId}/reactions`
        : `/posts/${postId}/reactions`;

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
        
        // Update local storage to persist the reaction state
        toggleReaction(commentId || postId, type);
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      // Revert optimistic updates on error
      setIsReacted(wasReacted);
      setCurrentCount(count);
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
      const response = await api.get(`/posts/${orgId}?postId=${postId}`);
      
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
      
      console.log('Posting comment to post:', postId);
      const response = await api.post(
        `/posts/${postId}/comments`,
        { 
          text: commentText  // Only send the text, let backend handle the rest
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
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Comment</h3>
          <p className="text-gray-600 mb-6">Are you sure you want to delete this comment? This action cannot be undone.</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancelDelete}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : 'Delete'}
            </button>
          </div>
        </div>
      </div>
      )}
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
        const isAdmin = comment.createdByRole === 'admin' || (comment.author && comment.author.role === 'admin');
        
        // Get the author ID from various possible locations in the comment object
        const authorId = (
          comment.author?._id || // Case: author is an object with _id
          comment.author ||      // Case: author is the ID string
          comment.createdBy ||   // Case: using createdBy field
          comment.authorId       // Case: using authorId field
        )?.toString().trim();    // Ensure we're comparing strings and remove any whitespace
        
        // Check if the current user is the author (compare string values)
        const isAuthor = authorId === currentUserId?.toString().trim();
        
        // Debug log to help identify the issue
        console.log('Comment author check:', {
          commentId: comment._id,
          authorId,
          currentUserId,
          isAuthor,
          authorType: typeof comment.author,
          authorValue: comment.author,
          localStorage: {
            userId: localStorage.getItem('userId'),
            email: localStorage.getItem('email'),
            role: localStorage.getItem('role')
          },
          comment: {
            ...comment,
            // Make sure we don't log sensitive data
            author: comment.author?._id || comment.author,
            reactions: 'Object' // Just indicate it's an object to avoid large logs
          }
        });
        
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

// --- Media Viewer Modal Component ---
const MediaViewer = ({ mediaUrl, mediaType, onClose }) => {
  const modalRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close modal when clicking outside the content
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.log);
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="relative w-full h-full flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
          aria-label="Close media viewer"
        >
          <XCircleIcon className="h-8 w-8" />
        </button>
        {/* Fullscreen button removed as per user request */}
        
        <div 
          ref={modalRef} 
          className="relative max-w-full max-h-full flex items-center justify-center"
        >
          {mediaType === 'image' ? (
            <img
              src={mediaUrl}
              alt="Full size media"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={mediaUrl}
              className="max-w-full max-h-[90vh]"
              controls
              autoPlay
              controlsList="nodownload"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useTheme();
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [organizationId, setOrganizationId] = useState("");
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

  // --- Authentication Effect ---
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const storedEmail = localStorage.getItem('email');
        const storedRole = localStorage.getItem('role');
        const storedToken = localStorage.getItem('token');
        const storedOrgId = localStorage.getItem('orgId');

        if (!storedEmail || !storedRole || !storedToken || !storedOrgId || storedRole !== 'employee') {
          navigate('/signin', { state: { message: 'Employee access required. Please sign in.' } });
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
          fetchPosts(); // Fetch posts after successful authentication
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

  // --- Fetch Posts ---
  const fetchPosts = async () => {
    if (!organizationId) return;

    setLoading(prev => ({ ...prev, posts: true }));
    setError(null);

    try {
      const storedToken = localStorage.getItem('token');
      
      // Use the correct endpoint format with organization ID as URL parameter
      const response = await api.get(`/posts/${organizationId}`, {
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

      // Create the post with the uploaded media URLs
      const response = await api.post('/posts', {
        content: postData.content.trim(),
        postType: postData.postType,
        mediaUrls,
        region: postData.region || '',
        department: postData.department || '',
        orgId: organizationId,
        isAnonymous: true
      });

      console.log('Post created successfully:', response.data);

      // Clean up object URLs after successful post
      postData.media.forEach(media => {
        if (media.preview) URL.revokeObjectURL(media.preview);
      });

      // Fetch fresh posts to ensure we have the latest data
      await fetchPosts();
      
      // Switch back to dashboard view
      setViewMode('dashboard');
      
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
      description: "Share your feedback, complaints, or suggestions. Tag region & department if needed.",
      buttonText: "Create Post",
      onClick: () => setViewMode('create'),
      icon: PencilSquareIcon,
      bgColorClass: "bg-blue-50 dark:bg-blue-900/30",
      accentColorClass: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "View Posts",
      description: "Browse all anonymous posts within your organization",
      buttonText: "View Posts",
      onClick: () => {
        fetchPosts();
        setViewMode('view');
      },
      icon: EyeIcon,
      bgColorClass: "bg-indigo-50 dark:bg-indigo-900/30",
      accentColorClass: "text-indigo-600 dark:text-indigo-400"
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

  const user = {
    name: "Anonymous Employee"
  };

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
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Posts</h2>
            </div>
            {posts.length === 0 ? (
              <p className="text-gray-600 dark:text-slate-300">No posts found.</p>
            ) : (
              <div className="space-y-4">
                {posts.map((post, i) => (
                  <motion.div
                    key={post._id}
                    className="bg-white dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 hover:shadow-md dark:hover:shadow-slate-700/50 transition-shadow duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
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
                      </div>
                      <button
                        onClick={() => handleCommentDelete(post._id, post.comments[0]._id)}
                        className="text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-500 transition-colors p-1 -mr-1 -mt-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete Post"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
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
                Welcome, {user.name} 👋
              </h2>
              <p className="text-gray-600 dark:text-slate-400 mt-1">
                Here are your available actions. Your contributions are valued.
              </p>
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
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col z-50 md:hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white">
                  <BuildingOfficeIcon className="h-6 w-6" />
                </div>
                <span className="font-semibold text-gray-800 dark:text-white">VoiceBox</span>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-2">
              <div className="space-y-1">
                {actions.map((action) => (
                  <button
                    key={action.title}
                    onClick={() => {
                      action.onClick();
                      setIsMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <action.icon className="h-5 w-5 mr-3" />
                    {action.title}
                  </button>
                ))}
              </div>
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-slate-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {user.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileSidebarOpen(false);
                    }}
                    className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-700/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Logout"
                  >
                    <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-20 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex-col items-center py-6 space-y-6 flex-shrink-0 shadow-sm">
        <div className="p-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white">
          <BuildingOfficeIcon className="h-7 w-7 md:h-8" />
        </div>
        <nav className="flex flex-col space-y-5 items-center">
          {actions.slice(0, 2).map(action => (
            <button
              key={action.title}
              onClick={action.onClick}
              title={action.title}
              className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <action.icon className="h-6 w-6" />
            </button>
          ))}
        </nav>
        <div className="mt-auto flex flex-col items-center space-y-5">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-700/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6" />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="mr-2 p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 md:hidden"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
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
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300 hidden sm:block">
                {user.name}
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
    </div>
  );
};

export default EmployeeDashboard;