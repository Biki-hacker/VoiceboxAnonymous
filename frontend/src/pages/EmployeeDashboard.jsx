// src/pages/EmployeeDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  HandThumbUpIcon,
  HeartIcon,
  FaceSmileIcon,
  XCircleIcon,
  ChatBubbleLeftIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

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
  const [isReacted, setIsReacted] = useState(hasReacted(commentId || postId, type));
  const [currentCount, setCurrentCount] = useState(count);

  const handleReaction = async () => {
    try {
      const endpoint = commentId 
        ? `/posts/${postId}/comment/${commentId}/react`
        : `/posts/${postId}/react`;

      const response = await api.post(endpoint, { type });
      
      // Update counts based on response
      if (commentId) {
        setCurrentCount(response.data.comments.find(c => c._id === commentId).reactions[type].count);
      } else {
        setCurrentCount(response.data.reactions[type].count);
      }
      
      toggleReaction(commentId || postId, type);
      setIsReacted(!isReacted);
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const getIcon = () => {
    switch(type) {
      case 'like': return <HandThumbUpIcon className="h-5 w-5" />;
      case 'love': return <HeartIcon className="h-5 w-5 text-red-500" />;
      case 'laugh': return <FaceSmileIcon className="h-5 w-5 text-yellow-500" />;
      case 'angry': return <XCircleIcon className="h-5 w-5 text-orange-500" />;
      default: return <HandThumbUpIcon className="h-5 w-5" />;
    }
  };

  return (
    <button
      onClick={handleReaction}
      className={`flex items-center gap-1 px-2 py-1 rounded-full ${
        isReacted ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-slate-700'
      }`}
    >
      {getIcon()}
      <span className="text-sm">{currentCount}</span>
    </button>
  );
};

// --- Comment Section Component ---
const CommentSection = ({ postId, comments = [] }) => {
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState(comments || []);
  const [error, setError] = useState(null);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const storedToken = localStorage.getItem('token');
      const response = await api.post(`/posts/${postId}/comment`, 
        { text: newComment },
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );
      
      if (response.data && response.data.comments) {
        setLocalComments([...localComments, response.data.comments.slice(-1)[0]]);
        setNewComment('');
        setError(null);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setError(error.response?.data?.message || 'Failed to post comment');
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      const storedToken = localStorage.getItem('token');
      await api.delete(`/posts/${postId}/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      setLocalComments(localComments.filter(c => c._id !== commentId));
      setError(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  return (
    <div className="mt-4 space-y-4">
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
          placeholder="Write a comment..."
          className="flex-1 p-2 rounded bg-gray-100 dark:bg-slate-700 dark:text-white"
        />
        <button
          onClick={handleCommentSubmit}
          disabled={!newComment.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Post
        </button>
      </div>

      {localComments.map(comment => (
        <div key={comment._id} className="flex gap-3 items-start">
          <div className="flex-1 bg-gray-100 dark:bg-slate-700 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium dark:text-white">
                {comment.createdBy || 'Anonymous'}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-800 dark:text-slate-200">{comment.text}</p>
            {comment.reactions && Object.entries(comment.reactions).length > 0 && (
              <div className="flex gap-2 mt-2">
                {Object.entries(comment.reactions).map(([type, {count}]) => (
                  <ReactionButton
                    key={type}
                    type={type}
                    count={count || 0}
                    postId={postId}
                    commentId={comment._id}
                  />
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => handleCommentDelete(comment._id)}
            className="p-1 text-red-500 hover:text-red-600"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
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

// --- Main Dashboard Component ---
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useTheme();
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [viewMode, setViewMode] = useState('dashboard');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState({ posts: false, create: false });
  const [error, setError] = useState(null);
  const [newPost, setNewPost] = useState({
    postType: 'feedback',
    content: '',
    mediaUrls: [],
    region: '',
    department: '',
    isAnonymous: false
  });
  const [uploadProgress, setUploadProgress] = useState(0);

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

        if (response.data.success) {
          if (!response.data.verified) {
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
      const response = await api.get(`/posts/${organizationId}`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      setPosts(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.response?.data?.message || 'Failed to fetch posts. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  };

  // --- Handle File Upload ---
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(prev => ({ ...prev, create: true }));
    setUploadProgress(0);

    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);

          const response = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              setUploadProgress(progress);
            }
          });

          return response.data.url;
        })
      );

      setNewPost(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, ...uploadedUrls]
      }));
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err.response?.data?.message || 'Failed to upload files. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
      setUploadProgress(0);
    }
  };

  // --- Handle Create Post ---
  const handleCreatePost = async () => {
    if (!newPost.content.trim()) {
      setError('Post content is required');
      return;
    }

    setLoading(prev => ({ ...prev, create: true }));
    setError(null);

    try {
      const response = await api.post('/posts', {
        ...newPost,
        orgId: organizationId
      });

      setPosts(prev => [response.data, ...prev]);
      setNewPost({
        postType: 'feedback',
        content: '',
        mediaUrls: [],
        region: '',
        department: '',
        isAnonymous: false
      });
      setViewMode('dashboard');
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.response?.data?.message || 'Failed to create post. Please try again.');
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
  const handleCommentSubmit = async (postId, text) => {
    if (!text.trim()) return;

    try {
      const response = await api.post(`/posts/${postId}/comment`, { text });
      setPosts(prev => prev.map(post => 
        post._id === postId ? response.data : post
      ));
    } catch (err) {
      console.error('Error posting comment:', err);
      setError(err.response?.data?.message || 'Failed to post comment. Please try again.');
    }
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
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-xl font-bold mb-4 dark:text-white">Create New Post</h2>
            <select
              value={newPost.postType}
              onChange={(e) => setNewPost({ ...newPost, postType: e.target.value })}
              className="w-full p-2 mb-4 rounded bg-gray-100 dark:bg-slate-700 dark:text-white"
            >
              {['feedback', 'complaint', 'suggestion', 'public'].map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="Write your post content..."
              className="w-full p-2 mb-4 rounded bg-gray-100 dark:bg-slate-700 h-32 dark:text-white"
            />
            <input
              type="text"
              placeholder="Region (optional)"
              value={newPost.region}
              onChange={(e) => setNewPost({ ...newPost, region: e.target.value })}
              className="w-full p-2 mb-4 rounded bg-gray-100 dark:bg-slate-700 dark:text-white"
            />
            <input
              type="text"
              placeholder="Department (optional)"
              value={newPost.department}
              onChange={(e) => setNewPost({ ...newPost, department: e.target.value })}
              className="w-full p-2 mb-4 rounded bg-gray-100 dark:bg-slate-700 dark:text-white"
            />
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={newPost.isAnonymous}
                onChange={(e) => setNewPost({ ...newPost, isAnonymous: e.target.checked })}
                className="mr-2"
              />
              <span className="dark:text-white">Post Anonymously</span>
            </label>
            <div className="mb-4">
              <label className="block mb-2 dark:text-white">
                Upload Media:
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="mt-2 block w-full"
                  disabled={loading.create}
                  accept="image/*,video/*"
                />
              </label>
              {loading.create && (
                <p className="text-gray-500 dark:text-slate-400">
                  Uploading... ({uploadProgress.toFixed(2)}% complete)
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 mt-2">
                {newPost.mediaUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt="Media preview"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setNewPost(prev => ({
                        ...prev,
                        mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
                      }))}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircleIcon className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setViewMode('dashboard')}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit Post
              </button>
            </div>
          </motion.div>
        );

      case 'view':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-white">Posts</h2>
              <button
                onClick={() => setViewMode('dashboard')}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Back to Dashboard
              </button>
            </div>
            {posts.length === 0 ? (
              <p className="dark:text-white">No posts found.</p>
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
                      <span className={`inline-block px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium tracking-wide ${
                        post.postType === 'feedback' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' :
                        post.postType === 'complaint' ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300' :
                        post.postType === 'suggestion' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' :
                        'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                      }`}>
                        {post.postType}
                      </span>
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
                    <div className="text-xs text-gray-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-700 pt-1.5 sm:pt-2 mt-1.5 sm:mt-2 flex flex-wrap gap-x-2 gap-y-1">
                      <span>By: {post.createdBy || 'Anonymous'}</span>
                      <span>|</span>
                      <span>{new Date(post.createdAt).toLocaleString()}</span>
                      <span className="hidden sm:inline">|</span>
                      <span className="block sm:inline mt-1 sm:mt-0">Region: {post.region || 'N/A'}</span>
                      <span className="hidden sm:inline">|</span>
                      <span className="block sm:inline">Dept: {post.department || 'N/A'}</span>
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
                    {post.comments && post.comments.length > 0 && (
                      <CommentSection postId={post._id} comments={post.comments} />
                    )}
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

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'dark' : ''} font-sans antialiased`}>
      <aside className="w-16 md:w-20 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col items-center py-6 space-y-6 flex-shrink-0 shadow-sm">
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
            <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Employee Dashboard</h1>
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
    </div>
  );
};

export default EmployeeDashboard;