//  src/pages/EmployeeDashboard.jsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { Fragment } from 'react';
import { api } from '../utils/axios';
import { uploadMedia } from '../utils/uploadMedia';
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
  HomeIcon,
  DocumentTextIcon,
  NoSymbolIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { ArrowsPointingOutIcon, HandThumbUpIcon as HandThumbUpIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import Sidebar from '../components/Sidebar';
import PostCreation from '../components/PostCreation';
import DeletionConfirmation from '../components/DeletionConfirmation';
import PostEditModal from '../components/PostEditModal';

// Import common components and hooks
import useTheme from '../hooks/useTheme';
import useWebSocket from '../hooks/useWebSocket';
import CustomSelect from '../components/common/CustomSelect';
import ThemeToggle from '../components/common/ThemeToggle';
import CommentSection from '../components/common/CommentSection';
import ReactionButton from '../components/common/ReactionButton';
import Modal from '../components/common/Modal';

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
  
  // Post editing state
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);
  
  // Post filters
  const [selectedPostType, setSelectedPostType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  // --- Effect to fetch posts when authentication is complete and user is in view mode ---
  useEffect(() => {
    if (isEmailVerified && organizationId && viewMode === 'view' && posts.length === 0) {
      fetchPosts();
    }
  }, [isEmailVerified, organizationId, viewMode]);

  // --- WebSocket Effect for Real-time Updates ---
  const handleWebSocketMessage = (message) => {
    try {
      // message is already parsed by the hook
      console.log('WebSocket message received:', message);
      if (!message || !message.type || !message.payload) {
        console.warn('Invalid WebSocket message format:', message);
        return;
      }
      
      // Validate message structure
      if (!message || typeof message !== 'object') {
        console.warn('EmployeeDashboard: Invalid message format:', message);
        return;
      }
      if (!message.payload || typeof message.payload !== 'object') {
        console.warn('EmployeeDashboard: Message missing payload:', message);
        return;
      }

      // Check organization ID for all message types
      const orgId = message.payload.organizationId || message.payload.organization;
      if (!orgId || orgId !== organizationId) {
        console.debug('EmployeeDashboard: WebSocket message for different organization, ignoring.');
        return;
      }

      switch (message.type) {
        case 'POST_CREATED':
          if (!message.payload._id || !message.payload.createdAt) {
            console.warn('EmployeeDashboard: Invalid POST_CREATED payload:', message.payload);
            return;
          }
          setPosts(prevPosts => [message.payload, ...prevPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
          break;
        case 'POST_UPDATED':
          if (!message.payload._id) {
            console.warn('EmployeeDashboard: Invalid POST_UPDATED payload:', message.payload);
            return;
          }
          setPosts(prevPosts => prevPosts.map(p => (p._id === message.payload._id ? { 
            ...p, 
            ...message.payload,
            comments: p.comments || [] // Preserve existing decrypted comments
          } : p)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
          break;
        case 'POST_DELETED':
          if (!message.payload.postId) {
            console.warn('EmployeeDashboard: Invalid POST_DELETED payload:', message.payload);
            return;
          }
          setPosts(prevPosts => prevPosts.filter(p => p._id !== message.payload.postId));
          break;
        case 'COMMENT_CREATED':
          if (!message.payload.postId || !message.payload.comment?._id) {
            console.warn('EmployeeDashboard: Invalid COMMENT_CREATED payload:', message.payload);
            return;
          }
          console.log('EmployeeDashboard: Processing COMMENT_CREATED for post:', message.payload.postId, 'comment:', message.payload.comment._id);
          setPosts(prevPosts => {
            // Check if the post exists in the current list
            const postExists = prevPosts.some(post => post._id === message.payload.postId);
            
            if (postExists) {
              // Update existing post with new comment
              return prevPosts.map(post => {
                if (post._id === message.payload.postId) {
                  const commentExists = post.comments?.some(c => c._id === message.payload.comment._id);
                  if (commentExists) {
                    console.log('Comment already exists, skipping duplicate');
                    return post;
                  }
                  console.log('Adding comment to existing post');
                  // Check if we already have a comment with the same text (local comment)
                  const hasLocalComment = post.comments?.some(c => 
                    c.text === message.payload.comment.text || 
                    c.content === message.payload.comment.text
                  );
                  if (hasLocalComment) {
                    console.log('Local comment already exists, skipping WebSocket comment');
                    return post;
                  }
                  return {
                    ...post,
                    comments: [message.payload.comment, ...(post.comments || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
                    commentCount: (post.commentCount || 0) + 1
                  };
                }
                return post;
              });
            } else {
              // Post doesn't exist in current list, add it with the comment
              // This creates a minimal post object with just the comment
              console.log('Creating new post with comment');
              const newPost = {
                _id: message.payload.postId,
                comments: [message.payload.comment],
                commentCount: 1,
                createdAt: message.payload.comment.createdAt || new Date().toISOString(),
                // Add other required fields with defaults
                content: '[Post not loaded]',
                postType: 'feedback',
                author: message.payload.comment.author,
                createdByRole: message.payload.comment.createdByRole || 'user'
              };
              return [newPost, ...prevPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
          });
          break;
        case 'COMMENT_UPDATED':
          if (!message.payload.postId || !message.payload.comment?._id) {
            console.warn('EmployeeDashboard: Invalid COMMENT_UPDATED payload:', message.payload);
            return;
          }
          setPosts(prevPosts => {
            return prevPosts.map(post => {
              if (post._id === message.payload.postId) {
                const existingComment = post.comments?.find(c => c._id === message.payload.comment._id);
                if (!existingComment) {
                  console.warn('EmployeeDashboard: Comment not found for update:', message.payload.comment._id);
                  return post;
                }
                return {
                  ...post,
                  comments: (post.comments || []).map(c => c._id === message.payload.comment._id ? { ...c, ...message.payload.comment } : c).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                };
              }
              return post;
            });
          });
          break;
        case 'COMMENT_DELETED':
          if (!message.payload.postId || !message.payload.commentId) {
            console.warn('EmployeeDashboard: Invalid COMMENT_DELETED payload:', message.payload);
            return;
          }
          setPosts(prevPosts => {
            return prevPosts.map(post => {
              if (post._id === message.payload.postId) {
                return {
                  ...post,
                  comments: (post.comments || []).filter(c => c._id !== message.payload.commentId),
                  commentCount: Math.max(0, (post.commentCount || 0) - 1)
                };
              }
              return post;
            });
          });
          break;
        case 'REACTION_UPDATED':
          if (!message.payload.entityType || !message.payload.entityId) {
            console.warn('EmployeeDashboard: Invalid REACTION_UPDATED payload:', message.payload);
            return;
          }
          const reactionsSummary = message.payload.reactionsSummary || message.payload.reactions;
          if (!reactionsSummary) {
            console.warn('EmployeeDashboard: Missing reactions data in payload:', message.payload);
            return;
          }
          setPosts(prevPosts => {
            return prevPosts.map(post => {
              if (message.payload.entityType === 'post' && post._id === message.payload.entityId) {
                return { ...post, reactions: reactionsSummary, updatedAt: message.payload.updatedAt || new Date().toISOString() };
              } else if (message.payload.entityType === 'comment' && post._id === message.payload.postId) {
                const updatedComments = (post.comments || []).map(comment => {
                  if (comment._id === message.payload.entityId) {
                    return { ...comment, reactions: reactionsSummary, updatedAt: message.payload.updatedAt || new Date().toISOString() };
                  }
                  return comment;
                });
                return { ...post, comments: updatedComments };
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

  const { sendMessage } = useWebSocket(
    WS_URL,
    handleWebSocketMessage,
    () => { 
      console.log('WebSocket connected');
      // Send authentication message if we have the required data
      const storedToken = localStorage.getItem('token');
      if (storedToken && organizationId) {
        return {
          type: 'AUTH',
          token: storedToken,
          organizationId: organizationId,
          role: 'employee'
        };
      }
      return null;
    },
    (error) => { console.error('WebSocket error:', error); },
    [organizationId]
  );

  // --- Fetch Posts ---
  const fetchPosts = async () => {
    setLoading(prev => ({ ...prev, posts: true }));
    setError(null);

    try {
      const storedToken = localStorage.getItem('token');
      const storedOrgId = localStorage.getItem('orgId')?.trim();
      
      // If we don't have the required data, try to get it from localStorage
      const orgIdToUse = organizationId || storedOrgId;
      const isVerified = isEmailVerified !== false; // Only block if explicitly false
      
      if (!orgIdToUse) {
        setError('Organization ID not found. Please try refreshing the page.');
        setPosts([]);
        return;
      }
      
      if (!storedToken) {
        setError('Authentication token not found. Please sign in again.');
        navigate('/signin');
        return;
      }
      
      // Use the correct endpoint format with organization ID as URL parameter
      const response = await api.get(`/posts/org/${orgIdToUse}`, {
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
      
      // Create the post with the uploaded media URLs
      const response = await api.post('/posts', {
        content: postData.content.trim(),
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

  // --- Handle Post Edit ---
  const handlePostEdit = (post) => {
    setPostToEdit(post);
    setShowEditPostModal(true);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? { ...post, ...updatedPost, comments: post.comments || [], author: post.author } : post
    ));
    setShowEditPostModal(false);
    setPostToEdit(null);
  };

  // Helper function to check if post has been edited (excluding pinning)
  const isPostEdited = (post) => {
    // Only show edited if updatedAt is different from createdAt AND it's not just a pinning change
    if (post.updatedAt === post.createdAt) {
      return false;
    }
    
    // If the post has been pinned/unpinned but the content hasn't changed, don't show as edited
    // We can't easily detect this on the frontend, so we'll use a different approach
    // For now, we'll show edited only if there's a significant time difference (more than 1 minute)
    const timeDiff = new Date(post.updatedAt) - new Date(post.createdAt);
    return timeDiff > 60000; // More than 1 minute difference
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
      buttonText: loading.posts ? "Loading..." : "View Posts",
      onClick: isEmailVerified 
        ? async () => {
            try {
              await fetchPosts();
              setViewMode('view');
            } catch (error) {
              console.error('Error fetching posts:', error);
              setError('Failed to fetch posts. Please try again.');
            }
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
        ? async () => {
            try {
              await fetchPosts();
              setViewMode('view');
            } catch (error) {
              console.error('Error fetching posts:', error);
              setError('Failed to fetch posts. Please try again.');
            }
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
    const filtered = posts.filter(post => {
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

    // Sort posts: pinned first, then by creation date (newest first)
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
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
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Posts</h2>
                <button
                  onClick={fetchPosts}
                  disabled={loading.posts}
                  className="h-10 min-w-[110px] px-3 flex items-center justify-center rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                >
                  {loading.posts ? (
                    <span className="flex items-center"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>Refreshing...</span>
                  ) : (
                    <span className="flex items-center"><ArrowPathIcon className="h-5 w-5 mr-2" />Refresh</span>
                  )}
                </button>
              </div>
              <div className="flex flex-col gap-y-2">
                {/* Row 1: Search */}
                <div className="w-full">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-11 pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg !bg-white dark:!bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {/* Row 2: Type (full width) */}
                <div className="w-full flex flex-col">
                  <label htmlFor="type-select" className="text-xs font-medium text-gray-400 dark:text-slate-400 mb-1">Type</label>
                  <CustomSelect
                    id="type-select"
                    className="h-11 w-full"
                    label=""
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
                </div>
                {/* Row 3: Region + Department */}
                <div className="flex flex-col md:flex-row gap-2 md:gap-x-4">
                  <div className="w-full md:w-1/2 flex flex-col">
                    <label htmlFor="region-select" className="text-xs font-medium text-gray-400 dark:text-slate-400 mb-1">Region</label>
                    <CustomSelect
                      id="region-select"
                      className="h-11 w-full"
                      label=""
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
                  </div>
                  <div className="w-full md:w-1/2 flex flex-col">
                    <label htmlFor="department-select" className="text-xs font-medium text-gray-400 dark:text-slate-400 mb-1">Department</label>
                    <CustomSelect
                      id="department-select"
                      className="h-11 w-full"
                      label=""
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
              </div>
            </div>
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}
            {loading.posts ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-slate-300">Loading posts...</span>
              </div>
            ) : filteredPosts.length === 0 ? (
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
                        {/* Pinned tag */}
                        {post.isPinned && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 mr-2">
                            <PaperClipIcon className="h-4 w-4 mr-1 text-yellow-500" /> Pinned
                          </span>
                        )}
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium tracking-wide ${
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
                      <div className="flex space-x-1">
                        {/* Pin/unpin button for admin only */}
                        {localStorage.getItem('role') === 'admin' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const response = await api.post(`/posts/${post._id}/pin`);
                                // Use the API response to update local state correctly
                                const updatedPost = response.data.post;
                                if (updatedPost) {
                                  setPosts(prevPosts => 
                                    prevPosts.map(p => 
                                      p._id === post._id 
                                        ? { ...p, isPinned: updatedPost.isPinned }
                                        : p
                                    )
                                  );
                                }
                              } catch (err) {
                                setError('Failed to pin/unpin post.');
                              }
                            }}
                            className={`ml-2 text-yellow-600 hover:text-yellow-800 p-1 rounded-full ${post.isPinned ? 'bg-yellow-50' : ''}`}
                            title={post.isPinned ? 'Unpin Post' : 'Pin Post'}
                          >
                            <PaperClipIcon className="h-5 w-5" />
                          </button>
                        )}
                        {post.author && (post.author._id === localStorage.getItem('userId') || post.author.id === localStorage.getItem('userId')) && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePostEdit(post);
                              }}
                              className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-500 transition-colors p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="Edit Post"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePostDelete(post._id);
                              }}
                              className="text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete Post"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
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
                      <span className="text-gray-600 dark:text-slate-300">{new Date(post.createdAt).toLocaleString()}{isPostEdited(post) && ' (edited)'}</span>
                      <span className="hidden sm:inline text-gray-400 dark:text-slate-500">|</span>
                      <span className="block sm:inline mt-1 sm:mt-0 text-gray-600 dark:text-slate-300">Region: {post.region || 'N/A'}</span>
                      <span className="hidden sm:inline text-gray-400 dark:text-slate-500">|</span>
                      <span className="block sm:inline text-gray-600 dark:text-slate-300">Dept: {post.department || 'N/A'}</span>
                    </div>
                    {post.reactions && Object.entries(post.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(post.reactions).map(([type, reactionData]) => {
                          // Get the current user's reaction status
                          const currentUserId = localStorage.getItem('userId');
                          const hasReacted = reactionData.users && reactionData.users.includes(currentUserId);
                          
                          return (
                            <ReactionButton
                              key={type}
                              type={type}
                              count={reactionData.count || 0}
                              postId={post._id}
                              onReactionUpdate={(reactionData) => {
                                // Update the post's reactions locally with single selection behavior
                                setPosts(prevPosts => 
                                  prevPosts.map(p => {
                                    if (p._id === post._id) {
                                      // Create a new reactions object with all reaction types
                                      const updatedReactions = {};
                                      Object.keys(p.reactions || {}).forEach(reactionType => {
                                        if (reactionType === reactionData.type) {
                                          // Update the clicked reaction type
                                          updatedReactions[reactionType] = {
                                            count: reactionData.count || 0,
                                            users: reactionData.isReacted 
                                              ? [...(p.reactions[reactionType]?.users || []), currentUserId].filter((v, i, a) => a.indexOf(v) === i)
                                              : (p.reactions[reactionType]?.users || []).filter(id => id !== currentUserId)
                                          };
                                        } else {
                                          // For other reaction types, remove current user if they were added
                                          const filteredUsers = (p.reactions[reactionType]?.users || []).filter(id => id !== currentUserId);
                                          updatedReactions[reactionType] = {
                                            count: filteredUsers.length,
                                            users: filteredUsers
                                          };
                                        }
                                      });
                                      
                                      return {
                                        ...p,
                                        reactions: updatedReactions
                                      };
                                    }
                                    return p;
                                  })
                                );
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-3">
                      <CommentSection 
                        postId={post._id} 
                        comments={post.comments || []} 
                        onCommentAdded={(newComment) => {
                          // Update the posts state with the new comment
                          console.log('EmployeeDashboard: onCommentAdded called with:', newComment);
                          setPosts(prevPosts => 
                            prevPosts.map(p => 
                              p._id === post._id 
                                ? { 
                                    ...p, 
                                    comments: [newComment, ...(p.comments || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
                                    commentCount: (p.commentCount || 0) + 1
                                  } 
                                : p
                            )
                          );
                        }}
                        onCommentDeleted={(deletedComment) => {
                          // Update the posts state to remove the deleted comment
                          console.log('EmployeeDashboard: onCommentDeleted called with:', deletedComment);
                          setPosts(prevPosts => 
                            prevPosts.map(p => 
                              p._id === post._id 
                                ? { 
                                    ...p, 
                                    comments: (p.comments || []).filter(c => c._id !== deletedComment._id),
                                    commentCount: Math.max(0, (p.commentCount || 0) - 1)
                                  } 
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

      {/* Post Edit Modal */}
      <PostEditModal
        isOpen={showEditPostModal}
        onClose={() => {
          setShowEditPostModal(false);
          setPostToEdit(null);
        }}
        post={postToEdit}
        onPostUpdated={handlePostUpdated}
      />
    </div>
  );
};

export default EmployeeDashboard;