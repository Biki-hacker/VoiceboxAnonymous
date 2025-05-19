// src/pages/EmployeeDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/axios';
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
  PlusCircleIcon,
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

// --- ActionCard Component ---
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

// --- EmployeeDashboard Component ---
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useTheme();
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'create', 'view'
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    postType: 'feedback',
    content: '',
    mediaUrls: [],
    region: '',
    department: '',
    isAnonymous: true
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    const storedOrgId = localStorage.getItem('orgId');
    if (!storedEmail || !storedOrgId) {
      navigate('/signin');
    }
    setEmployeeEmail(storedEmail);
  }, [navigate]);

  const fetchPosts = async () => {
    try {
      const orgId = localStorage.getItem('orgId');
      const response = await api.get(`/posts/${orgId}`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleCreatePost = async () => {
    try {
      const orgId = localStorage.getItem('orgId');
      const response = await api.post('/posts', {
        ...newPost,
        orgId
      });
      if (response.data) {
        setViewMode('dashboard');
        setNewPost({
          postType: 'feedback',
          content: '',
          mediaUrls: [],
          region: '',
          department: '',
          isAnonymous: true
        });
        await fetchPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    setIsUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map(file => uploadMedia(file))
      );
      setNewPost(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, ...urls]
      }));
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/signin');
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
      title: "View My Posts",
      description: "Review and manage the posts you've previously submitted.",
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
              className="w-full p-2 mb-4 rounded bg-gray-100 dark:bg-slate-700"
            >
              {['feedback', 'complaint', 'suggestion', 'public'].map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="Write your post content..."
              className="w-full p-2 mb-4 rounded bg-gray-100 dark:bg-slate-700 h-32"
            />
            <input
              type="text"
              placeholder="Region (optional)"
              value={newPost.region}
              onChange={(e) => setNewPost({ ...newPost, region: e.target.value })}
              className="w-full p-2 mb-4 rounded bg-gray-100 dark:bg-slate-700"
            />
            <input
              type="text"
              placeholder="Department (optional)"
              value={newPost.department}
              onChange={(e) => setNewPost({ ...newPost, department: e.target.value })}
              className="w-full p-2 mb-4 rounded bg-gray-100 dark:bg-slate-700"
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
                  disabled={isUploading}
                />
              </label>
              {isUploading && <p className="text-gray-500">Uploading...</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {newPost.mediaUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt="Media preview"
                    className="h-20 w-20 object-cover rounded"
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setViewMode('dashboard')}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                className="px-4 py-2 bg-blue-600 text-white rounded"
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
              <h2 className="text-xl font-bold dark:text-white">Your Posts</h2>
              <button
                onClick={() => setViewMode('dashboard')}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Back to Dashboard
              </button>
            </div>
            {posts.length === 0 ? (
              <p className="dark:text-white">No posts found.</p>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post._id} className="border-b pb-4 dark:border-slate-700">
                    <h3 className="font-semibold dark:text-white">
                      {post.postType} • {new Date(post.createdAt).toLocaleDateString()}
                    </h3>
                    <p className="dark:text-white mt-2">{post.content}</p>
                    {post.mediaUrls.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {post.mediaUrls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt="Post media"
                            className="h-20 w-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
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
      {/* Sidebar */}
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

      {/* Main Content Area */}
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