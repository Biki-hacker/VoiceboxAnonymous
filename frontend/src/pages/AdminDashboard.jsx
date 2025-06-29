// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet';
import { api } from '../utils/axios';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { uploadMedia } from '../utils/uploadMedia';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BuildingOffice2Icon, CreditCardIcon, PlusIcon, ArrowLeftOnRectangleIcon, ArrowUpTrayIcon,
    UserCircleIcon, UserGroupIcon, ChevronRightIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon,
    TagIcon, MapPinIcon, BuildingLibraryIcon, NoSymbolIcon, ExclamationCircleIcon,
    ExclamationTriangleIcon, Cog8ToothIcon, Bars3Icon, FolderOpenIcon, ArrowsPointingOutIcon,
    ClipboardDocumentIcon, PaperClipIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import PostCreation from '../components/PostCreation';
import DeletionConfirmation from '../components/DeletionConfirmation';
import PostEditModal from '../components/PostEditModal';

// Import common components and hooks
import useTheme from '../hooks/useTheme';
import useWebSocket from '../hooks/useWebSocket';
import Modal from '../components/common/Modal';
import CustomSelect from '../components/common/CustomSelect';
import CommentSection from '../components/common/CommentSection';
import ReactionButton from '../components/common/ReactionButton';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Helper Components ---
const NothingToShow = ({ message = "Nothing to show" }) => (
    <div className="text-center py-8 px-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg my-4 border border-gray-200 dark:border-slate-700"> 
        <NoSymbolIcon className="h-10 w-10 text-gray-400 dark:text-slate-500 mx-auto mb-3" /> 
        <p className="text-sm text-gray-500 dark:text-slate-400">{message}</p> 
    </div>
);

const DashboardCard = ({ children, className = "" }) => (
    <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3, ease: "easeOut" }} 
        className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden ${className}`}
    > 
        {children} 
    </motion.div>
);

// --- Main Dashboard Component ---
const AdminDashboard = () => {
    // Structured data for the admin dashboard
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Voicebox Anonymous - Admin Dashboard",
        "description": "Admin dashboard for managing organizations, posts, and user feedback on Voicebox Anonymous platform.",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "url": window.location.href,
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [stats, setStats] = useState([]);
    const [posts, setPosts] = useState([]);
    const [selectedType, setSelectedType] = useState('all');
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState({ orgList: true, orgDetails: false, modal: false, deleteOrg: {} });
    const [error, setError] = useState({ page: null, modal: null });
    const navigate = useNavigate();
    const { user, logout, authToken } = useAuth();
    const [userData, setUserData] = useState(null);
    const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
    const [isEditParamsModalOpen, setIsEditParamsModalOpen] = useState(false);
    const [isManageOrgModalOpen, setIsManageOrgModalOpen] = useState(false);
    const [orgToDelete, setOrgToDelete] = useState(null);
    const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
    const [isEditEmailsModalOpen, setIsEditEmailsModalOpen] = useState(false);
    const [emailsInput, setEmailsInput] = useState('');
    const [isUpdatingEmails, setIsUpdatingEmails] = useState(false);
    const [newOrgName, setNewOrgName] = useState("");
    const [verificationParamsInput, setVerificationParamsInput] = useState("");
    const [deleteOrgNameConfirm, setDeleteOrgNameConfirm] = useState("");
    const [deletePasswordConfirm, setDeletePasswordConfirm] = useState("");
    const [theme, toggleTheme, setTheme] = useTheme();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [initialOrgSelectedFlag, setInitialOrgSelectedFlag] = useState(false);
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'createPost'
    // Track posting state with useRef to prevent unnecessary re-renders
    const isPostingRef = useRef(false);
    const [isPosting, setIsPosting] = useState(false);
    const [viewingMedia, setViewingMedia] = useState({
        isOpen: false,
        url: '',
        type: 'image' // 'image' or 'video'
    });
    const [createPostView, setCreatePostView] = useState(false);
    const [isSubmittingPost, setIsSubmittingPost] = useState(false);
    const [postError, setPostError] = useState('');
    const [postSuccess, setPostSuccess] = useState('');
    const [showDeletePostDialog, setShowDeletePostDialog] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);
    const [deletingComment, setDeletingComment] = useState(null);
    // Post editing state
    const [showEditPostModal, setShowEditPostModal] = useState(false);
    const [postToEdit, setPostToEdit] = useState(null);
    const [pinningPost, setPinningPost] = useState(null); // Track which post is being pinned/unpinned
    const selectedOrgRef = useRef(selectedOrg); // Ref for current selectedOrg
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000'; // WebSocket URL
    
    // --- Add media error handling state ---
    const [mediaErrors, setMediaErrors] = useState({});
    
    // Helper functions for post permissions
    const isCurrentUserPost = (post) => {
        if (!post) return false;
        const currentUserId = localStorage.getItem('userId');
        // Handle both cases: author as string ID or author as object with _id
        const authorId = typeof post.author === 'string' ? post.author : post.author?._id;
        return currentUserId && authorId === currentUserId;
    };

    const canEditPost = (post) => {
        return isCurrentUserPost(post);
    };

    const canDeletePost = (post) => {
        if (!post) return false;
        const currentUserId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('role');
        // Handle both cases: author as string ID or author as object with _id
        const authorId = typeof post.author === 'string' ? post.author : post.author?._id;
        return currentUserId && (authorId === currentUserId || userRole === 'admin');
    };

    // Helper function to deduplicate comments by ID
    const deduplicateComments = (comments) => {
        if (!Array.isArray(comments)) return [];
        const seen = new Set();
        return comments.filter(comment => {
            if (!comment || !comment._id) return false;
            if (seen.has(comment._id)) return false;
            seen.add(comment._id);
            return true;
        });
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

    // WebSocket message handler
    const handleWebSocketMessage = useCallback((message) => {
        console.log('AdminDashboard: WebSocket message received:', message);
        const currentSelectedOrgId = selectedOrgRef.current?._id;
        
        if (!currentSelectedOrgId) {
            console.log('AdminDashboard: No organization selected, ignoring WebSocket message.');
            return;
        }

        try {
            const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
            
            switch (parsedMessage.type) {
                case 'POST_CREATED': {
                    // Support both formats: payload.post or payload directly
                    const postObj = parsedMessage.payload.post || parsedMessage.payload;
                    if (
                        parsedMessage.payload.organization === currentSelectedOrgId &&
                        postObj?._id
                    ) {
                        setPosts(prev => [postObj, ...prev]);
                    }
                    break;
                }
                case 'POST_UPDATED': {
                    // Support both formats: payload.post or payload directly
                    const postObj = parsedMessage.payload.post || parsedMessage.payload;
                    if (
                        parsedMessage.payload.organization === currentSelectedOrgId &&
                        postObj?._id
                    ) {
                        setPosts(prev =>
                            prev.map(p =>
                                p?._id === postObj._id
                                    ? {
                                        ...postObj,
                                        comments: deduplicateComments(p.comments || [])
                                    }
                                    : p
                            ).filter(Boolean)
                        );
                    }
                    break;
                }
                case 'POST_DELETED':
                    if (parsedMessage.payload?.organizationId === currentSelectedOrgId && parsedMessage.payload?.postId) {
                        setPosts(prev => prev.filter(p => p?._id !== parsedMessage.payload.postId));
                    }
                    break;
                case 'COMMENT_CREATED':
                    if (parsedMessage.payload?.organizationId === currentSelectedOrgId && parsedMessage.payload?.postId && parsedMessage.payload?.comment?._id) {
                        setPosts(prev => 
                            prev.map(p => 
                                p?._id === parsedMessage.payload.postId 
                                    ? { 
                                        ...p,
                                        comments: deduplicateComments([...(p.comments || []), parsedMessage.payload.comment])
                                    } 
                                    : p
                            ).filter(Boolean) // Remove any undefined posts
                        );
                    }
                    break;
                case 'COMMENT_UPDATED':
                    if (parsedMessage.payload?.organizationId === currentSelectedOrgId && parsedMessage.payload?.postId && parsedMessage.payload?.comment?._id) {
                        setPosts(prev => 
                            prev.map(p => 
                                p?._id === parsedMessage.payload.postId 
                                    ? { 
                                        ...p,
                                        comments: p.comments?.map(c => {
                                            if (c?._id === parsedMessage.payload.comment._id) {
                                                // Only update if the comment text is different or if we're updating other fields
                                                const currentText = typeof c.text === 'string' ? c.text : (c.content || '');
                                                const newText = typeof parsedMessage.payload.comment.text === 'string' 
                                                    ? parsedMessage.payload.comment.text 
                                                    : (parsedMessage.payload.comment.content || '');
                                                
                                                // If the text is the same, don't update to prevent duplicates
                                                if (currentText === newText && !parsedMessage.payload.comment.updatedAt) {
                                                    return c;
                                                }
                                                
                                                return parsedMessage.payload.comment;
                                            }
                                            return c;
                                        }).filter(Boolean) || []
                                    } 
                                    : p
                            ).filter(Boolean) // Remove any undefined posts
                        );
                    }
                    break;
                case 'COMMENT_DELETED':
                    if (parsedMessage.payload?.organizationId === currentSelectedOrgId && parsedMessage.payload?.postId && parsedMessage.payload?.commentId) {
                        setPosts(prev => 
                            prev.map(p => 
                                p?._id === parsedMessage.payload.postId 
                                    ? { 
                                        ...p,
                                        comments: p.comments?.filter(c => c?._id !== parsedMessage.payload.commentId) || []
                                    } 
                                    : p
                            ).filter(Boolean) // Remove any undefined posts
                        );
                    }
                    break;
                case 'REACTION_UPDATED':
                    if (parsedMessage.payload?.organizationId === currentSelectedOrgId) {
                        const { entityType, entityId, postId, reactionsSummary } = parsedMessage.payload;
                        
                        if (postId && reactionsSummary) {
                            setPosts(prev => 
                                prev.map(post => {
                                    if (post?._id !== postId) return post;
                                    
                                    if (entityType === 'post') {
                                        return {
                                            ...post,
                                            reactions: reactionsSummary
                                        };
                                    } else if (entityType === 'comment' && entityId) {
                                        // Handle comment reactions
                                        return {
                                            ...post,
                                            comments: post.comments?.map(comment => 
                                                comment?._id === entityId 
                                                    ? { ...comment, reactions: reactionsSummary }
                                                    : comment
                                            ).filter(Boolean) || []
                                        };
                                    }
                                    return post;
                                }).filter(Boolean) // Remove any undefined posts
                            );
                        }
                    }
                    break;
                default:
                    console.log('AdminDashboard: Unhandled WebSocket message type:', parsedMessage.type);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    }, [setPosts, posts]);

    // Initialize WebSocket connection using the shared hook
    const { sendMessage } = useWebSocket(
        WS_URL,
        handleWebSocketMessage,
        () => {
            console.log('WebSocket connected');
            // Send authentication message if we have the required data
            if (authToken && selectedOrg?._id) {
                return {
                    type: 'AUTH',
                    token: authToken,
                    organizationId: selectedOrg._id,
                    role: 'admin'
                };
            }
            return null;
        },
        (error) => {
            console.error('WebSocket error:', error);
        },
        [authToken, selectedOrg?._id]
    );

    // Update selectedOrgRef when selectedOrg changes
    useEffect(() => {
        selectedOrgRef.current = selectedOrg;
        
        // Re-authenticate with WebSocket if organization changes
        if (authToken && selectedOrg?._id) {
            sendMessage({
                type: 'AUTH',
                token: authToken,
                organizationId: selectedOrg._id,
                role: 'admin'
            });
        }
    }, [selectedOrg, authToken, sendMessage]);

    // --- Post Deletion Handlers ---
    const handleDeletePost = async (postId) => {
        if (!selectedOrg || !postId) return;
        let isMounted = true;
        try {
            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
                throw new Error('No authentication token found');
            }
            const response = await api.delete(`/posts/${postId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${storedToken}`
                },
                data: { organizationId: selectedOrg._id }
            });
            if (isMounted) {
                setPosts(prev => prev.filter(p => p._id !== postId));
                setShowDeletePostDialog(false);
                setPostToDelete(null);
                setPostSuccess('Post deleted successfully');
                setTimeout(() => setPostSuccess(''), 3000);
            }
            if (selectedOrg?._id) {
                const statsRes = await api.get(`/posts/stats/${selectedOrg._id}`);
                if (isMounted) setStats(statsRes.data);
            }
            return response;
        } catch (error) {
            console.error('Error deleting post:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete post.';
            if (isMounted) setPostError(errorMessage);
            throw error;
        } finally {
            if (isMounted) setIsDeletingPost(false);
        }
        return () => { isMounted = false; };
    };

    const confirmDeletePost = (post) => {
        setPostToDelete(post);
        setShowDeletePostDialog(true);
    };

    const handleCancelDeletePost = () => {
        setShowDeletePostDialog(false);
        setPostToDelete(null);
    };
    
    const handleConfirmDeletePost = async () => {
        if (!postToDelete) return;
        
        try {
            setIsDeletingPost(true);
            await handleDeletePost(postToDelete._id);
        } catch (error) {
            console.error('Error in delete confirmation:', error);
            setPostError('Failed to delete post. Please try again.');
            setTimeout(() => setPostError(''), 3000);
        } finally {
            setIsDeletingPost(false);
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

    // --- Authentication Effect ---
    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const storedEmail = localStorage.getItem('email');
                const storedRole = localStorage.getItem('role');
                const storedToken = localStorage.getItem('token');

                if (!storedEmail || !storedRole || !storedToken || storedRole !== 'admin') {
                    navigate('/signin', { state: { message: 'Admin access required. Please sign in.' } });
                    return;
                }

                // Verify token with backend
                const response = await api.get('/auth/verify-status', {
                    params: { email: storedEmail },
                    headers: { Authorization: `Bearer ${storedToken}` }
                });

                if (response.data.success) {
                    setUserData({ email: storedEmail, role: storedRole });
                } else {
                    localStorage.clear();
                    navigate('/signin', { state: { message: 'Session expired. Please log in again.' } });
                }
            } catch (error) {
                console.error('Auth verification failed:', error);
                localStorage.clear();
                navigate('/signin', { state: { message: 'Authentication failed. Please sign in again.' } });
            }
        };

        verifyAuth();
    }, [navigate]);

    /**
     * Selects an organization and fetches its related data
     * @param {Object|null} org - The organization to select, or null to clear selection
     */
    const selectOrganization = useCallback(async (org) => {
        if (!org || !org._id) {
            setSelectedOrg(null);
            setPosts([]);
            setStats([]);
            setLoading(prev => ({ ...prev, orgDetails: false, posts: false, stats: false }));
            return;
        }
        setSelectedOrg(org);
        setLoading(prev => ({ ...prev, orgDetails: true, posts: true, stats: true }));
        setError(prev => ({ ...prev, page: null }));
        setPosts([]);
        setStats([]);
        try {
            const [statsRes, postsRes] = await Promise.all([
                api.get(`/posts/stats/${org._id}`, { validateStatus: status => status < 500 }).catch(() => ({ data: null })),
                api.get(`/posts/org/${org._id}`, { validateStatus: status => status < 500 }).catch(() => ({ data: [] }))
            ]);
            setStats(Array.isArray(statsRes?.data) ? statsRes.data : []);
            if (Array.isArray(postsRes?.data)) {
                const sortedPosts = [...postsRes.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setPosts(sortedPosts);
            } else {
                setPosts([]);
            }
        } catch (err) {
            let errorMessage = `Failed to load details for ${org?.name || 'the organization'}.`;
            if (err.response) {
                if (err.response.status === 401) errorMessage = 'Your session has expired. Please log in again.';
                else if (err.response.status === 403) errorMessage = 'You do not have permission to view this organization.';
                else if (err.response.status === 404) { setError(prev => ({ ...prev, page: null })); return; }
                else if (err.response.data?.message) errorMessage = err.response.data.message;
            } else if (err.request) errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            else if (err.message) errorMessage = err.message;
            setError(prev => ({ ...prev, page: errorMessage }));
            setPosts([]);
            setStats([]);
        } finally {
            setLoading(prev => ({ ...prev, orgDetails: false, posts: false, stats: false }));
        }
    }, [setSelectedOrg, setPosts, setStats, setLoading, setError]);

    /**
     * Fetches organizations for the currently authenticated admin user
     * @returns {Promise<void>}
     */
    const fetchOrganizationsList = useCallback(async () => {
        if (!userData) return;
        setLoading(prev => ({ ...prev, orgList: true }));
        setError(prev => ({ ...prev, page: null }));
        try {
            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
                setError(prev => ({ ...prev, page: 'No authentication token found. Please log in again.' }));
                return;
            }
            const response = await api.get('/organizations/by-admin', {
                headers: { 'Authorization': `Bearer ${storedToken}`, 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
                validateStatus: status => status < 500
            });
            if (!response.data) throw new Error('No data received from server');
            if (!response.data.success) throw new Error(response.data.message || 'Failed to fetch organizations');
            const orgs = Array.isArray(response.data.data) ? response.data.data : [];
            setOrganizations(orgs);
            // Only auto-select if not already selected
            if ((!selectedOrg || !orgs.find(o => o._id === selectedOrg._id)) && orgs.length > 0) {
                selectOrganization(orgs[0]);
            } else if (orgs.length === 0) {
                setSelectedOrg(null);
                setPosts([]);
                setStats([]);
            }
        } catch (err) {
            let errorMessage = 'Failed to load organizations. Please try again.';
            if (err.response) {
                if (err.response.status === 401) errorMessage = 'Your session has expired. Please log in again.';
                else if (err.response.status === 403) errorMessage = 'You do not have permission to view organizations.';
                else if (err.response.data?.message) errorMessage = err.response.data.message;
            } else if (err.request) errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            else if (err.message) errorMessage = err.message;
            setError(prev => ({ ...prev, page: errorMessage }));
            setOrganizations([]);
            setSelectedOrg(null);
            setPosts([]);
            setStats([]);
        } finally {
            setLoading(prev => ({ ...prev, orgList: false }));
        }
    }, [userData, selectedOrg, selectOrganization]);

    // Only call fetchOrganizationsList when userData changes
    useEffect(() => {
        if (userData) {
            fetchOrganizationsList();
        }
    }, [userData, fetchOrganizationsList]);

    // Effect to keep selectedOrgRef updated
    useEffect(() => {
        selectedOrgRef.current = selectedOrg;
    }, [selectedOrg]);

    // Function to fetch stats, to be reused
    const refreshOrgStats = useCallback(async (orgId) => {
        if (!orgId) return Promise.resolve();
        try {
            const statsRes = await api.get(`/posts/stats/${orgId}`);
            setStats(Array.isArray(statsRes.data) ? statsRes.data : []);
            return statsRes.data;
        } catch (err) {
            console.error(`AdminDashboard: Error refreshing stats for org ${orgId}:`, err);
            throw err;
        }
    }, [api]);

    // --- Effect to handle auto-selection of an organization ---
    useEffect(() => {
        if (loading.orgList) return;

        if (!initialOrgSelectedFlag && organizations.length > 0) {
            selectOrganization(organizations[0]);
            setInitialOrgSelectedFlag(true);
        } else if (initialOrgSelectedFlag && selectedOrg) {
            const currentSelectedStillExists = organizations.find(o => o._id === selectedOrg._id);
            if (!currentSelectedStillExists && organizations.length > 0) {
                selectOrganization(organizations[0]);
            } else if (!currentSelectedStillExists && organizations.length === 0) {
                selectOrganization(null);
            }
        } else if (organizations.length === 0 && selectedOrg) {
            selectOrganization(null);
        }
    }, [organizations, loading.orgList, selectedOrg, selectOrganization, initialOrgSelectedFlag]);


    // --- Memoized Data for Filters and Charts ---
    const filteredPosts = useMemo(() => {
        const filtered = posts.filter(post => 
            (selectedType === 'all' || post.postType === selectedType) && 
            (selectedRegion === 'all' || post.region === selectedRegion) && 
            (selectedDepartment === 'all' || post.department === selectedDepartment) &&
            (searchQuery === '' || post.content.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        
        // Sort posts: pinned first, then by creation date (newest first)
        return filtered.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [posts, selectedType, selectedRegion, selectedDepartment, searchQuery]);
    const uniqueRegions = useMemo(() => [...new Set(posts.map(p => p.region).filter(Boolean))], [posts]);
    const uniqueDepartments = useMemo(() => [...new Set(posts.map(p => p.department).filter(Boolean))], [posts]);
    const typeOptions = [ { value: 'all', label: 'All Types' }, { value: 'feedback', label: 'Feedback' }, { value: 'complaint', label: 'Complaint' }, { value: 'suggestion', label: 'Suggestion' }, { value: 'public', label: 'Public' } ];
    const regionOptions = useMemo(() => [ { value: 'all', label: 'All Regions' }, ...uniqueRegions.map(r => ({ value: r, label: r })) ], [uniqueRegions]);
    const departmentOptions = useMemo(() => [ { value: 'all', label: 'All Departments' }, ...uniqueDepartments.map(d => ({ value: d, label: d })) ], [uniqueDepartments]);
    const chartData = useMemo(() => ({ labels: stats.map(s => s._id.charAt(0).toUpperCase() + s._id.slice(1)), datasets: [{ label: 'Post Count', data: stats.map(s => s.count), backgroundColor: theme === 'dark' ? ['#374151','#4B5563','#52525B','#3F3F46','#44403C','#5B21B6'] : ['#BFDBFE','#FECACA','#A5F3FC','#FED7AA','#DDD6FE','#E9D5FF'], borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB', borderWidth: 1, hoverBackgroundColor: theme === 'dark' ? ['#4B5563','#52525B','#71717A','#52525B','#57534E','#6D28D9'] : ['#93C5FD','#FCA5A5','#67E8F9','#FDBA74','#C4B5FD','#D8B4FE'], }], }), [stats, theme]);
    const commonChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
                    padding: 20,
                    font: { size: 12 }
                }
            },
            title: {
                display: true,
                color: theme === 'dark' ? '#F3F4F6' : '#111827',
                font: { size: 16, weight: '600' },
                padding: { bottom: 15 }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                titleColor: '#FFFFFF',
                bodyColor: '#F3F4F6',
                padding: 10,
                cornerRadius: 4
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: theme === 'dark' ? 'rgba(200, 200, 200, 0.1)' : '#E5E7EB'
                },
                ticks: {
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                }
            },
            x: {
                grid: { display: false },
                ticks: {
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                }
            }
        }
    }), [theme]);
    const barChartOptions = useMemo(() => ({ ...commonChartOptions, plugins: { ...commonChartOptions.plugins, title: { ...commonChartOptions.plugins.title, text: 'Post Count by Type' } } }), [commonChartOptions]);
    const pieChartOptions = useMemo(() => ({ ...commonChartOptions, plugins: { ...commonChartOptions.plugins, title: { ...commonChartOptions.plugins.title, text: 'Post Type Distribution' } } }), [commonChartOptions]);

    // --- Modal Action Handlers ---
    const handleOpenAddOrgModal = () => { setNewOrgName(""); setError(prev => ({ ...prev, modal: null })); setIsAddOrgModalOpen(true); };
    const handleConfirmAddOrg = () => {
        if (!newOrgName.trim() || !userData) { setError(prev => ({ ...prev, modal: "Organization name cannot be empty." })); return; }
        setLoading(prev => ({ ...prev, modal: true })); setError(prev => ({ ...prev, modal: null }));
        api.post('/organizations', { name: newOrgName.trim(), adminEmail: userData.email })
            .then(res => {
                const newOrg = res.data;
                fetchOrganizationsList(); // Refresh the list
                selectOrganization(newOrg); // Explicitly select the new org
                setInitialOrgSelectedFlag(true); // Ensure flag is set if this was the first org
                setIsAddOrgModalOpen(false);
            })
            .catch(err => { console.error('Error creating organization:', err); setError(prev => ({ ...prev, modal: err.response?.data?.message || 'Failed to create organization.' })); })
            .finally(() => { setLoading(prev => ({ ...prev, modal: false })); });
    };
    const handleOpenEditParamsModal = () => {
        if (!selectedOrg) return; const currentFields = selectedOrg.verificationFields || []; setVerificationParamsInput(currentFields.join(', ')); setError(prev => ({ ...prev, modal: null })); setIsEditParamsModalOpen(true);
    };

    // --- Admin Emails Management ---
    const [adminEmailsInput, setAdminEmailsInput] = useState('');
    const [isUpdatingAdminEmails, setIsUpdatingAdminEmails] = useState(false);
    const [isEditAdminEmailsModalOpen, setIsEditAdminEmailsModalOpen] = useState(false);
    const adminEmailsButtonRef = useRef(null);
    const employeeEmailsButtonRef = useRef(null);

    const handleOpenEditAdminEmailsModal = (e) => {
        e?.target?.blur();
        const currentEmails = selectedOrg.coAdminEmails?.map(e => e.email) || [];
        setAdminEmailsInput(currentEmails.join(', '));
        setIsEditAdminEmailsModalOpen(true);
    };

    const handleUpdateAdminEmails = async () => {
        if (!selectedOrg) return;

        try {
            setIsUpdatingAdminEmails(true);
            
            // Parse and validate emails
            const emails = adminEmailsInput
                .split(',')
                .map(email => email.trim())
                .filter(Boolean);

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const invalidEmails = emails.filter(email => !emailRegex.test(email));
            
            if (invalidEmails.length > 0) {
                setError(prev => ({ ...prev, modal: `Invalid email format: ${invalidEmails.join(', ')}` }));
                return;
            }

            if (emails.length > 5) {
                setError(prev => ({ ...prev, modal: 'Maximum 5 admin emails allowed' }));
                return;
            }


            // Prepare the request data
            const requestData = {
                emails: emails.map(email => email.trim().toLowerCase())
            };

            const orgId = selectedOrg._id;
            if (!orgId || !/^[0-9a-fA-F]{24}$/.test(orgId)) {
                throw new Error(`Invalid organization ID format: ${orgId}`);
            }

            await api.put(`/organizations/${orgId}/coadmin-emails`, requestData);
            
            // Refresh organization data
            const { data: updatedOrg } = await api.get(`/organizations/${orgId}`);
            setSelectedOrg(updatedOrg);
            setOrganizations(orgs => orgs.map(o => o._id === updatedOrg._id ? updatedOrg : o));
            
            setIsEditAdminEmailsModalOpen(false);
        } catch (error) {
            console.error('Error updating admin emails:', error);
            setError(prev => ({ 
                ...prev, 
                modal: error.response?.data?.message || 'Failed to update admin emails' 
            }));
        } finally {
            setIsUpdatingAdminEmails(false);
        }
    };
    const handleConfirmEditParams = () => {
        if (!selectedOrg) return; const fields = verificationParamsInput.split(',').map(f => f.trim()).filter(Boolean); setLoading(prev => ({ ...prev, modal: true })); setError(prev => ({ ...prev, modal: null }));
        api.patch(`/organizations/${selectedOrg._id}`, { verificationFields: fields })
            .then(() => { const updatedOrg = { ...selectedOrg, verificationFields: fields }; setSelectedOrg(updatedOrg); setOrganizations(orgs => orgs.map(o => o._id === updatedOrg._id ? updatedOrg : o)); setIsEditParamsModalOpen(false); })
            .catch(err => { console.error('Error updating parameters:', err); setError(prev => ({ ...prev, modal: err.response?.data?.message || 'Failed to update parameters.' })); })
            .finally(() => { setLoading(prev => ({ ...prev, modal: false })); });
    };
    const handleOpenEditEmailsModal = (e) => {
        e?.target?.blur();
        const currentEmails = selectedOrg.employeeEmails?.map(e => e.email) || [];
        setEmailsInput(currentEmails.join(', '));
        setIsEditEmailsModalOpen(true);
    };
    const handleUpdateEmployeeEmails = async () => {
        if (!selectedOrg) return;

        try {
            setIsUpdatingEmails(true);
            
            // Parse and validate emails
            const emails = emailsInput
                .split(',')
                .map(email => email.trim())
                .filter(Boolean);

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const invalidEmails = emails.filter(email => !emailRegex.test(email));
            
            if (invalidEmails.length > 0) {
                setError(prev => ({ ...prev, modal: `Invalid email format: ${invalidEmails.join(', ')}` }));
                return;
            }

            if (emails.length > 25) {
                setError(prev => ({ ...prev, modal: 'Maximum 25 employee emails allowed' }));
                return;
            }

            // Verify the organization ID exists and is valid
            if (!selectedOrg?._id) {
                throw new Error('No organization selected or invalid organization ID');
            }

            console.log('Updating emails for organization:', {
                orgId: selectedOrg._id,
                orgName: selectedOrg.name
            });

            // Refresh the organizations list first to ensure we have the latest data
            try {
                console.log('Refreshing organizations list...');
                const { data: orgsData } = await api.get('/organizations/by-admin');
                const updatedOrgs = Array.isArray(orgsData.data) ? orgsData.data : [];
                
                // Update the organizations list
                setOrganizations(updatedOrgs);
                
                // Find the current organization in the updated list
                const currentOrg = updatedOrgs.find(org => org._id === selectedOrg._id);
                
                if (!currentOrg) {
                    throw new Error(`Organization "${selectedOrg.name}" (${selectedOrg._id}) no longer exists or you no longer have access to it`);
                }
                
                // Update the selected organization reference
                setSelectedOrg(currentOrg);
                
                console.log('Refreshed organization data:', currentOrg);
                
            } catch (refreshError) {
                console.error('Error refreshing organizations:', refreshError);
                throw new Error('Failed to refresh organization data. Please try again.');
            }

            // Prepare the request data - backend expects a simple array of email strings
            const requestData = {
                emails: emails.map(email => email.trim().toLowerCase())
            };

            // Verify the organization ID is a valid MongoDB ObjectId
            const orgId = selectedOrg._id;
            if (!orgId || !/^[0-9a-fA-F]{24}$/.test(orgId)) {
                throw new Error(`Invalid organization ID format: ${orgId}`);
            }

            const requestUrl = `/organizations/${orgId}/emails`;
            
            console.log('Sending request to update emails:', {
                method: 'PUT',
                url: requestUrl,
                data: requestData,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                withCredentials: true
            });
            
            // Log the raw request details for debugging
            console.log('Organization ID being sent:', orgId, {
                type: typeof orgId,
                length: orgId?.length,
                value: orgId
            });

            try {
                const response = await api.put(
                    requestUrl,
                    requestData,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        withCredentials: true,
                        validateStatus: (status) => status < 500
                    }
                );

                console.log('Update response:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: response.data,
                    headers: response.headers
                });
                
                if (response.status === 404) {
                    console.error('Organization not found in response:', {
                        organizationId: selectedOrg._id,
                        organizationName: selectedOrg.name,
                        responseData: response.data
                    });
                    throw new Error(`Organization "${selectedOrg.name}" (${selectedOrg._id}) not found. It may have been deleted or you may have lost access.`);
                }

                if (response.data?.success) {
                    // Update local state with the new emails
                    const updatedEmails = requestData.emails.map(email => ({ email }));
                    
                    const updatedOrgs = organizations.map(org => 
                        org._id === selectedOrg._id 
                            ? { ...org, employeeEmails: updatedEmails }
                            : org
                    );
                    
                    setOrganizations(updatedOrgs);
                    setSelectedOrg(prev => ({
                        ...prev,
                        employeeEmails: updatedEmails
                    }));
                    
                    setError(prev => ({ ...prev, modal: null }));
                    setIsEditEmailsModalOpen(false);
                } else {
                    throw new Error(response.data?.message || 'Failed to update emails');
                }
            } catch (err) {
                console.error('Error in email update:', {
                    error: err,
                    response: err.response?.data
                });
                throw err; // Re-throw to be caught by the outer catch
            }
        } catch (err) {
            console.error('Error updating employee emails:', err);
            setError(prev => ({ ...prev, modal: err.response?.data?.message || 'Failed to update employee emails' }));
        } finally {
            setIsUpdatingEmails(false);
        }
    };
    const handleOpenManageOrgModal = () => { setError(prev => ({ ...prev, modal: null })); setIsManageOrgModalOpen(true); };
    const initiateDeleteOrganization = (org) => { setOrgToDelete(org); setDeleteOrgNameConfirm(""); setDeletePasswordConfirm(""); setError(prev => ({ ...prev, modal: null })); setIsManageOrgModalOpen(false); setIsDeleteConfirmModalOpen(true); };
    const handleConfirmDeleteOrg = async () => {
        if (!orgToDelete || !userData) return; setError(prev => ({ ...prev, modal: null }));
        if (deleteOrgNameConfirm !== orgToDelete.name) { setError(prev => ({ ...prev, modal: `Incorrect organization name. Please type "${orgToDelete.name}".` })); return; }
        if (!deletePasswordConfirm) { setError(prev => ({ ...prev, modal: "Password is required." })); return; }
        setLoading(prev => ({ ...prev, deleteOrg: { ...prev.deleteOrg, [orgToDelete._id]: true } }));
        let passwordVerified = false;
        try {
            const { error: passwordVerifyError } = await supabase.auth.signInWithPassword({ email: userData.email, password: deletePasswordConfirm });
            if (passwordVerifyError) throw new Error("PASSWORD_VERIFICATION_FAILED: " + passwordVerifyError.message);
            passwordVerified = true;
            await api.delete(`/organizations/${orgToDelete._id}`);
            fetchOrganizationsList(); // Refresh list
            if (selectedOrg?._id === orgToDelete._id) {
                setInitialOrgSelectedFlag(false); // Allow auto-selection of new first org or null
            }
            setIsDeleteConfirmModalOpen(false);
            setOrgToDelete(null);
        } catch (err) {
            console.error('Error during organization deletion process:', err);
            if (err.message?.startsWith("PASSWORD_VERIFICATION_FAILED")) { setError(prev => ({ ...prev, modal: 'Incorrect password.' })); }
            else if (passwordVerified && err.response) { setError(prev => ({ ...prev, modal: err.response.data?.message || 'Failed to delete organization.' })); }
            else if (passwordVerified && !err.response) { setError(prev => ({ ...prev, modal: 'Network error during deletion.' }));}
            else { setError(prev => ({ ...prev, modal: 'An unexpected error occurred.' }));}
        } finally {
            setLoading(prev => ({ ...prev, deleteOrg: { ...prev.deleteOrg, [orgToDelete?._id]: false } }));
            setDeletePasswordConfirm("");
        }
    };
    // Post deletion is now handled by the handleDeletePost function above
    // which uses a modal dialog for confirmation
    
    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

        // State for Co-admin Orgs Modal
    const [isCoAdminOrgsModalOpen, setIsCoAdminOrgsModalOpen] = useState(false);
    const [coAdminOrgs, setCoAdminOrgs] = useState([]);
    const [loadingCoAdminOrgs, setLoadingCoAdminOrgs] = useState(false);
    const [selectedCoAdminOrg, setSelectedCoAdminOrg] = useState(null);
    
    // Handler for opening Co-admin Orgs modal
    const handleOpenCoAdminOrgsModal = async () => {
        setIsCoAdminOrgsModalOpen(true);
        setLoadingCoAdminOrgs(true);
        setError(prev => ({ ...prev, coAdminOrgs: null }));
        
        try {
            console.log('Current user email:', userData?.email);
            console.log('Auth token:', localStorage.getItem('token'));
            
            console.log('Fetching co-admin organizations...');
            const response = await api.get('/organizations/coadmin', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                withCredentials: true
            });
            
            console.log('Co-admin orgs response status:', response.status);
            console.log('Full response:', response);
            
            // Handle different response formats
            let orgs = [];
            if (response.data?.success) {
                // Handle standard success response with data array
                orgs = Array.isArray(response.data.data) ? response.data.data : [];
            } else if (Array.isArray(response.data)) {
                // Handle case where response is directly an array
                orgs = response.data;
            } else if (response.data) {
                // Handle case where data is a single object
                orgs = [response.data];
            }
            
            console.log('Processed orgs:', orgs);
            setCoAdminOrgs(orgs);
            
            // If no orgs found, show a specific message
            if (orgs.length === 0) {
                setError(prev => ({
                    ...prev,
                    coAdminOrgs: 'You are not listed as a co-admin for any organizations.'
                }));
            }
            
        } catch (err) {
            console.error('Full error object:', err);
            console.error('Error response:', err.response?.data);
            
            let errorMessage = 'Failed to load co-admin organizations';
            if (err.response) {
                // Server responded with error status
                errorMessage = err.response.data?.message || 
                              err.response.data?.error || 
                              `Server error: ${err.response.status}`;
            } else if (err.request) {
                // Request was made but no response received
                errorMessage = 'No response from server. Please check your connection.';
            } else {
                // Something happened in setting up the request
                errorMessage = err.message || 'Error setting up request';
            }
            
            setError(prev => ({
                ...prev,
                coAdminOrgs: `Error: ${errorMessage}`
            }));
            setCoAdminOrgs([]);
        } finally {
            setLoadingCoAdminOrgs(false);
        }
    };
    
    // Handler for clicking on a co-admin organization
    const handleCoAdminOrgClick = (org) => {
        setSelectedCoAdminOrg(org);
    };

    // --- Sidebar Items ---
    const sidebarNavItems = [
        { name: 'Create Post', icon: PencilSquareIcon, action: () => setViewMode('createPost'), current: viewMode === 'createPost' },
        { name: 'Add Organization', icon: PlusIcon, action: handleOpenAddOrgModal, current: isAddOrgModalOpen },
        { name: 'Manage Orgs', icon: Cog8ToothIcon, action: handleOpenManageOrgModal, current: isManageOrgModalOpen },
        { name: 'Subscriptions', icon: CreditCardIcon, action: () => navigate('/subscriptions'), current: window.location.pathname === '/subscriptions' },
        { name: 'Co-admin Orgs', icon: UserGroupIcon, action: handleOpenCoAdminOrgsModal, current: isCoAdminOrgsModalOpen },
    ];

    // Logo component for the sidebar
    const Logo = BuildingOffice2Icon;

    // --- Main Render ---
    return (
        <>
            <Helmet>
                <title>Admin Dashboard | Voicebox Anonymous</title>
                <meta name="description" content="Admin dashboard for managing Voicebox Anonymous platform. Monitor and manage organizations, posts, and user feedback." />
                <meta name="robots" content="noindex, nofollow" />
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Helmet>
            <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''} font-sans antialiased`}>
            <Sidebar
                isMobileSidebarOpen={isMobileSidebarOpen}
                setIsMobileSidebarOpen={setIsMobileSidebarOpen}
                sidebarNavItems={sidebarNavItems}
                logo={Logo}
                title="Admin"
                userEmail={userData?.email}
                theme={theme}
                toggleTheme={toggleTheme}
                onLogout={handleLogout}
                viewMode={viewMode}
                isAdmin={true}
            />

            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 flex-shrink-0">
                    <div className="flex items-center">
                        <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden mr-3 -ml-1 p-2 rounded-md text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <Bars3Icon className="h-6 w-6"/>
                            <span className="sr-only">Open sidebar</span>
                        </button>
                        {viewMode === 'createPost' ? (
                            <button
                                onClick={() => setViewMode('dashboard')}
                                className="flex items-center text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                                <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100 truncate">Back to Dashboard</h1>
                            </button>
                        ) : (
                            <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100 truncate">Admin Dashboard</h1>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        <UserCircleIcon className="h-7 w-7 text-gray-400 dark:text-slate-500"/>
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-300 hidden sm:block">{userData?.email}</span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
                    {viewMode === 'createPost' && selectedOrg ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-2xl mx-auto"
                        >
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 sm:p-6">
                                <PostCreation
                                    onSend={async (postData) => {
                                        if (!selectedOrg) return;
                                        
                                        setIsPosting(true); // Start loading animation
                                        
                                        try {
                                            // Upload media files if any
                                            let mediaUrls = [];
                                            if (postData.media && postData.media.length > 0) {
                                                try {
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
                                                    return { 
                                                        success: false, 
                                                        error: `Failed to upload media: ${uploadError.message}` 
                                                    };
                                                }
                                            }

                                            const postPayload = {
                                                content: postData.content,
                                                postType: postData.postType,
                                                orgId: selectedOrg._id,
                                                isAnonymous: false,
                                                mediaUrls,
                                                region: postData.region || '',
                                                department: postData.department || ''
                                            };
                                            
                                            const response = await api.post('/posts', postPayload);
                                            
                                            // Switch back to dashboard after successful post
                                            setViewMode('dashboard');
                                            
                                            // Refresh posts
                                            const postsRes = await api.get(`/posts/org/${selectedOrg._id}`);
                                            setPosts(postsRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                                            
                                            // Refresh stats
                                            const statsRes = await api.get(`/posts/stats/${selectedOrg._id}`);
                                            setStats(statsRes.data);
                                            
                                            return { success: true };
                                        } catch (error) {
                                            console.error('Error creating post:', error);
                                            return { 
                                                success: false, 
                                                error: error.response?.data?.message || 'Failed to create post' 
                                            };
                                        } finally {
                                            // Reset both ref and state
                                            isPostingRef.current = false;
                                            setIsPosting(false);
                                        }
                                    }}
                                    placeholder="Share your thoughts..."
                                    buttonText={
                                        <span className={`flex items-center justify-center w-full transition-opacity duration-200 ${isPosting ? 'opacity-90' : 'opacity-100'}`}>
                                            {isPosting && (
                                                <svg 
                                                    className="animate-spin h-5 w-5 sm:h-4 sm:w-4 text-white mr-2 flex-shrink-0" 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    fill="none" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            )}
                                            <span className={isPosting ? 'ml-0' : ''}>
                                                {isPosting ? 'Posting...' : 'Create Post'}
                                            </span>
                                        </span>
                                    }
                                    isSubmitting={isPosting}
                                    className={`bg-transparent dark:bg-transparent p-0 transition-all duration-200 ${isPosting ? 'cursor-not-allowed' : 'hover:opacity-90'}`}
                                    showHeader={false}
                                    showRegionDepartment={true}
                                    postTypes={['feedback', 'complaint', 'suggestion', 'public']}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            {error.page && !loading.orgDetails && (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    className="mb-6 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg text-sm flex items-center"
                                >
                                    <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0"/> 
                                    {error.page}
                                </motion.div>
                            )}
                    <AnimatePresence mode="wait">
                        {loading.orgList && organizations.length === 0 && !selectedOrg ? (
                             <motion.div key="loading-initial" {...fadeInUp} className="text-center py-20"> <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg> <p className="text-gray-600 dark:text-slate-400">Loading organizations...</p> </motion.div>
                        ) : !selectedOrg && organizations.length === 0 && !loading.orgList ? (
                            <motion.div key="no-orgs-message" {...fadeInUp}> <DashboardCard className="p-6"><div className="text-center py-10"><FolderOpenIcon className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4"/><h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-2">No Organizations Found</h3><p className="text-gray-600 dark:text-slate-400 mb-4">Get started by adding your first organization.</p> <button onClick={handleOpenAddOrgModal} className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900"><PlusIcon className="h-5 w-5" /> <span>Add Organization</span></button></div></DashboardCard> </motion.div>
                        ): !selectedOrg && organizations.length > 0 && !loading.orgList ? (
                             <motion.div key="select-org-prompt" {...fadeInUp}> <DashboardCard className="p-6"><div className="text-center py-10"><MagnifyingGlassIcon className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4"/><h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-2">Welcome, Admin!</h3><p className="text-gray-600 dark:text-slate-400">Please select an organization from the "Manage Orgs" menu or add a new one to view details.</p></div></DashboardCard> </motion.div>
                        ) : selectedOrg ? (
                            <motion.div key={selectedOrg._id} className="space-y-6 md:space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-y-3 gap-x-4"><div><h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-50">{selectedOrg.name}</h2><p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5 flex items-center">
    ID: <code className="text-xs bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded mx-1">{selectedOrg._id}</code>
    <button 
        onClick={(event) => {
            navigator.clipboard.writeText(selectedOrg._id);
            // Show a tooltip that the ID was copied
            const tooltip = document.createElement('div');
            tooltip.className = 'fixed bg-gray-800 text-white text-xs rounded py-1 px-2 z-50 shadow-lg';
            tooltip.textContent = 'Copied!';
            document.body.appendChild(tooltip);
            // Position tooltip near the cursor
            const rect = event.target.getBoundingClientRect();
            tooltip.style.top = `${rect.top - 30}px`;
            tooltip.style.left = `${rect.left + rect.width/2 - 20}px`;
            setTimeout(() => {
                tooltip.remove();
            }, 1500);
        }}
        className="group relative text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all duration-200 p-1 -ml-1"
        title="Copy to clipboard"
    >
        <div className="p-1 rounded-md group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
            <ClipboardDocumentIcon className="h-4 w-4 sm:h-4 sm:w-4" />
        </div>
    </button>
    <span className="mx-1">|</span>
    <span>Created: {new Date(selectedOrg.createdAt).toLocaleDateString()}</span>
</p></div><div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0"></div></div>
                                
                                <DashboardCard className="p-4 sm:p-6"><h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4">Employee Access</h3>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-slate-100">Authorized Emails</h4>
                                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                                    {selectedOrg.employeeEmails?.length > 0
                                                        ? `${selectedOrg.employeeEmails.length} of 25 employee emails configured`
                                                        : 'No employee emails added (0/25)'}
                                                </p>
                                                {selectedOrg.employeeEmails?.length > 0 && (
                                                    <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                                                        {selectedOrg.employeeEmails.length} email(s) configured
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                ref={employeeEmailsButtonRef}
                                                onClick={handleOpenEditEmailsModal}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <svg className="-ml-0.5 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Manage Emails
                                            </button>
                                        </div>
                                    </div>
                                </DashboardCard>

                                <DashboardCard className="p-4 sm:p-6">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4">Admin Access</h3>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-slate-100">Authorized Co-Admin Emails</h4>
                                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                                    {selectedOrg.coAdminEmails?.length > 0
                                                        ? `${selectedOrg.coAdminEmails.length} of 5 co-admin emails configured`
                                                        : 'No co-admin emails added (0/5)'}
                                                </p>
                                                {selectedOrg.coAdminEmails?.length > 0 && (
                                                    <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                                                        {selectedOrg.coAdminEmails.length} email(s) configured
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                ref={adminEmailsButtonRef}
                                                onClick={handleOpenEditAdminEmailsModal}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                            >
                                                <svg className="-ml-0.5 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                Manage Emails
                                            </button>
                                        </div>
                                    </div>
                                </DashboardCard>
                                <DashboardCard className="p-4 sm:p-6"><h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4">Post Statistics</h3>{loading.orgDetails ? (<div className="text-center py-10"><svg className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg></div>) : stats.length === 0 ? ( <NothingToShow message="No post statistics available yet." /> ) : (<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[300px] sm:min-h-[350px]"><div className="lg:col-span-3 h-[300px] sm:h-[350px]"> <Bar data={chartData} options={barChartOptions} /> </div><div className="lg:col-span-2 h-[300px] sm:h-[350px] flex items-center justify-center"> <Pie data={chartData} options={pieChartOptions} /> </div></div>)}</DashboardCard>
                                <DashboardCard className="p-4 sm:p-6">
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-2 justify-between">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-2">Posts Overview</h3>
                                            <button
                                                onClick={async () => {
                                                    if (!selectedOrg) return;
                                                    setLoading(prev => ({ ...prev, orgDetails: true }));
                                                    setError(prev => ({ ...prev, page: null }));
                                                    try {
                                                        const [postsRes, statsRes] = await Promise.all([
                                                            api.get(`/posts/org/${selectedOrg._id}`),
                                                            api.get(`/posts/stats/${selectedOrg._id}`)
                                                        ]);
                                                        if (Array.isArray(postsRes?.data)) {
                                                            const sortedPosts = [...postsRes.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                                                            setPosts(sortedPosts);
                                                        } else {
                                                            setPosts([]);
                                                        }
                                                        setStats(Array.isArray(statsRes.data) ? statsRes.data : []);
                                                    } catch (err) {
                                                        setError(prev => ({ ...prev, page: 'Failed to refresh posts. Please try again.' }));
                                                    } finally {
                                                        setLoading(prev => ({ ...prev, orgDetails: false }));
                                                    }
                                                }}
                                                disabled={loading.orgDetails}
                                                className="h-10 min-w-[110px] px-3 flex items-center justify-center rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                                                title="Refresh Posts"
                                            >
                                                {loading.orgDetails ? (
                                                    <span className="flex items-center"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>Refreshing...</span>
                                                ) : (
                                                    <span className="flex items-center"><ArrowPathIcon className="h-5 w-5 mr-2" />Refresh</span>
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-y-2">
                                            {/* Row 1: Search (full width) */}
                                            <div className="w-full">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Search posts..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="h-11 w-full pl-10 pr-3 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                            {/* Row 2: Type (full width) */}
                                            <div className="w-full flex flex-col">
                                                <CustomSelect
                                                    id="type-select"
                                                    className="h-11 w-full"
                                                    label="Type"
                                                    value={selectedType}
                                                    onChange={setSelectedType}
                                                    options={typeOptions}
                                                    icon={TagIcon}
                                                />
                                            </div>
                                            {/* Row 3: Region + Department */}
                                            <div className="flex flex-col md:flex-row gap-y-7 md:gap-x-4 mt-5">
                                                <div className="w-full md:w-1/2 flex flex-col">
                                                    <CustomSelect
                                                        id="region-select"
                                                        className="h-11 w-full"
                                                        label="Region"
                                                        value={selectedRegion}
                                                        onChange={setSelectedRegion}
                                                        options={regionOptions}
                                                        icon={MapPinIcon}
                                                    />
                                                </div>
                                                <div className="w-full md:w-1/2 flex flex-col">
                                                    <CustomSelect
                                                        id="department-select"
                                                        className="h-11 w-full"
                                                        label="Department"
                                                        value={selectedDepartment}
                                                        onChange={setSelectedDepartment}
                                                        options={departmentOptions}
                                                        icon={BuildingLibraryIcon}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {posts.length > 0 && (
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                                            Showing {filteredPosts.length} of {posts.length} posts
                                        </p>
                                    )}
                                    {loading.orgDetails ? (
                                        <div className="text-center py-10">
                                            <svg className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                                            </svg>
                                        </div>
                                    ) : filteredPosts.length === 0 ? (
                                        <NothingToShow message={posts.length === 0 ? "No posts found for this organization." : "No posts match the current filters."} />
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredPosts.filter(post => post && post._id).map((post, i) => (
                                                <motion.div 
                                                    key={post._id} 
                                                    className="bg-white dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 hover:shadow-md dark:hover:shadow-slate-700/50 transition-shadow duration-200"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                >
                                                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {/* Pinned tag */}
                                                            {post.isPinned && (
                                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 mr-2">
                                                                <PaperClipIcon className="h-4 w-4 mr-1 text-yellow-500" /> Pinned
                                                              </span>
                                                            )}
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
                                                        <div className="flex space-x-1">
                                                          {canEditPost(post) && (
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
                                                          )}
                                                          {/* Pin/unpin button for admin only */}
                                                          {localStorage.getItem('role') === 'admin' && (
                                                            <button
                                                              onClick={async (e) => {
                                                                e.stopPropagation();
                                                                setPinningPost(post._id);
                                                                
                                                                try {
                                                                  // Optimistic update - immediately show the change
                                                                  setPosts(prevPosts => 
                                                                    prevPosts.map(p => 
                                                                      p._id === post._id 
                                                                        ? { ...p, isPinned: !p.isPinned }
                                                                        : p
                                                                    )
                                                                  );
                                                                  
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
                                                                  // Revert optimistic update on error
                                                                  setPosts(prevPosts => 
                                                                    prevPosts.map(p => 
                                                                      p._id === post._id 
                                                                        ? { ...p, isPinned: post.isPinned }
                                                                        : p
                                                                    )
                                                                  );
                                                                  setPostError('Failed to pin/unpin post.');
                                                                  console.error('Error pinning/unpinning post:', err);
                                                                } finally {
                                                                  setPinningPost(null);
                                                                }
                                                              }}
                                                              disabled={pinningPost === post._id}
                                                              className={`text-gray-400 dark:text-slate-500 hover:text-yellow-600 dark:hover:text-yellow-500 p-1 rounded-full hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all duration-200 ${
                                                                post.isPinned ? 'text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : ''
                                                              } ${
                                                                pinningPost === post._id ? 'opacity-50 cursor-not-allowed' : ''
                                                              }`}
                                                              title={post.isPinned ? 'Unpin Post' : 'Pin Post'}
                                                            >
                                                              {pinningPost === post._id ? (
                                                                <svg className="animate-spin h-4 w-4 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                              ) : (
                                                                <PaperClipIcon className="h-4 w-4" />
                                                              )}
                                                            </button>
                                                          )}
                                                          {canDeletePost(post) && (
                                                            <button 
                                                              onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  confirmDeletePost(post);
                                                              }}
                                                              className="text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-500 transition-colors p-1 -mr-1 -mt-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" 
                                                              title="Delete Post"
                                                              disabled={isDeletingPost}
                                                          >
                                                              {isDeletingPost && postToDelete?._id === post._id ? (
                                                                  <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                  </svg>
                                                              ) : (
                                                                  <TrashIcon className="h-4 w-4" />
                                                              )}
                                                            </button>
                                                          )}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-800 dark:text-slate-200 mb-2 sm:mb-3 whitespace-pre-wrap break-words">
                                                        {typeof post.content === 'string' ? post.content : '[Encrypted or invalid content]'}
                                                    </p>
                                                    
                                                    {/* Media Display */}
                                                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                                                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                            {post.mediaUrls.map((media, idx) => {
                                                                const mediaUrl = typeof media === 'string' ? media : (media.url || media.preview);
                                                                if (!mediaUrl) return null;
                                                                const isImage = typeof mediaUrl === 'string' && mediaUrl.match(/\.(jpe?g|png|gif|webp)$/i);
                                                                const isVideo = typeof mediaUrl === 'string' && mediaUrl.match(/\.(mp4|webm|ogg)$/i);
                                                                const handleMediaClick = (e) => {
                                                                    e.stopPropagation();
                                                                    setViewingMedia({
                                                                        isOpen: true,
                                                                        url: mediaUrl,
                                                                        type: isImage ? 'image' : 'video'
                                                                    });
                                                                };
                                                                // --- Media error fallback ---
                                                                if (mediaErrors[mediaUrl]) {
                                                                    return (
                                                                        <div key={`${post._id}-media-${idx}`} className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                                                            <span className="text-gray-500">{isImage ? 'Image not available' : 'Video not available'}</span>
                                                                        </div>
                                                                    );
                                                                }
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
                                                                            onError={() => setMediaErrors(prev => ({ ...prev, [mediaUrl]: true }))}
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
                                                                            onError={() => setMediaErrors(prev => ({ ...prev, [mediaUrl]: true }))}
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
                                                    
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-700 pt-1.5 sm:pt-2 mt-1.5 sm:mt-2 flex flex-wrap gap-x-2 gap-y-1 items-center">
                                                        <span>By: {post.createdByRole === 'admin' || (post.author && post.author.role === 'admin') ? 'Admin' : (post.createdBy || 'User')}</span>
                                                        {(post.createdByRole === 'admin' || (post.author && post.author.role === 'admin')) && (
                                                          <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                                                            Admin
                                                          </span>
                                                        )}
                                                        <span>|</span>
                                                        <span>{new Date(post.createdAt).toLocaleString()}{isPostEdited(post) && ' (edited)'}</span>
                                                        {post.region && (
                                                            <>
                                                                <span className="hidden sm:inline">|</span>
                                                                <span className="block sm:inline mt-1 sm:mt-0">Region: {post.region}</span>
                                                            </>
                                                        )}
                                                        {post.department && (
                                                            <>
                                                                <span className="hidden sm:inline">|</span>
                                                                <span className="block sm:inline">Dept: {post.department}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Reactions */}
                                                    {post.reactions && Object.entries(post.reactions).length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            {Object.entries(post.reactions).map(([type, {count}]) => (
                                                                <ReactionButton
                                                                    key={type}
                                                                    type={type}
                                                                    postId={post._id}
                                                                    count={count || 0}
                                                                    onReactionUpdate={(reactionData) => {
                                                                        // Update the post's reactions locally
                                                                        setPosts(prevPosts => 
                                                                            prevPosts.map(p => {
                                                                                if (p._id === post._id) {
                                                                                    return {
                                                                                        ...p,
                                                                                        reactions: {
                                                                                            ...p.reactions,
                                                                                            [reactionData.type]: {
                                                                                                count: reactionData.count || 0,
                                                                                                hasReacted: reactionData.isReacted || false
                                                                                            }
                                                                                        }
                                                                                    };
                                                                                }
                                                                                return p;
                                                                            })
                                                                        );
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Comments Section */}
                                                    <div className="mt-3">
                                                        <CommentSection 
                                                            postId={post._id} 
                                                            comments={post.comments || []} 
                                                            selectedOrg={selectedOrg}
                                                            onCommentAdded={(newComment) => {
                                                              // Update the posts state with the new comment
                                                              console.log('AdminDashboard: onCommentAdded called with:', newComment);
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
                                                              console.log('AdminDashboard: onCommentDeleted called with:', deletedComment);
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
                                </DashboardCard>
                            </motion.div>
                        ) : null }
                    </AnimatePresence>
                        </>
                    )}
                </main>
            </div>
        </div>

        {/* Co-admin Orgs Modal */}
        <Modal 
            isOpen={isCoAdminOrgsModalOpen} 
            onClose={() => {
                setIsCoAdminOrgsModalOpen(false);
                setSelectedCoAdminOrg(null);
            }} 
            title="Co-admin Organizations"
            size="max-w-md"
        >
            <div className="space-y-4">
                {loadingCoAdminOrgs ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : error.coAdminOrgs ? (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-md">
                        <p>{error.coAdminOrgs}</p>
                    </div>
                ) : coAdminOrgs.length === 0 ? (
                    <div className="text-center py-6">
                        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" />
                        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">You don't have co-admin access to any organizations.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                            {coAdminOrgs.map((org) => (
                                <li key={org._id}>
                                    <button
                                        onClick={() => setSelectedCoAdminOrg(org)}
                                        className="w-full text-left group"
                                    >
                                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group-hover:bg-blue-50/50 dark:group-hover:bg-slate-700/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {org.name}
                                                    </p>
                                                    {org.createdAt && (
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                                            Created on {new Date(org.createdAt).toLocaleDateString(undefined, { 
                                                                year: 'numeric', 
                                                                month: 'short', 
                                                                day: 'numeric' 
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                                <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <p className="text-xs text-gray-500 dark:text-slate-400 text-center mt-4">
                            {coAdminOrgs.length} organization{coAdminOrgs.length !== 1 ? 's' : ''} found • Click to view details
                        </p>
                    </div>
                )}
            </div>
        </Modal>

        {/* Co-admin Org Details Modal */}
        <Modal
            isOpen={!!selectedCoAdminOrg}
            onClose={() => setSelectedCoAdminOrg(null)}
            title="Upgrade Required"
        >
            <div className="text-center py-6 px-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-slate-100">
                    Co-admin Feature Locked
                </h3>
                <div className="mt-3">
                    <p className="text-sm text-gray-600 dark:text-slate-300">
                        The admin of this organization is currently on a free plan. So, the co-admin feature is currently unavailable.
                    </p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        type="button"
                        onClick={() => navigate('/pricing')}
                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <ArrowUpTrayIcon className="-ml-1 mr-2 h-4 w-4" />
                        Check Plans
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedCoAdminOrg(null)}
                        className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>

        {/* Media Viewer Modal */}
        {viewingMedia.isOpen && (
            <MediaViewer
                mediaUrl={viewingMedia.url}
                mediaType={viewingMedia.type}
                onClose={() => setViewingMedia({...viewingMedia, isOpen: false})}
            />
        )}

        {/* Modals */}
        <Modal isOpen={isAddOrgModalOpen} onClose={() => setIsAddOrgModalOpen(false)} title="Add New Organization">{/* ... Add Org Modal Content ... */}<div className="space-y-4"><div><label htmlFor="orgName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Organization Name</label><input type="text" id="orgName" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50" placeholder="Enter organization name" disabled={loading.modal} /></div> {error.modal && ( <p className="text-sm text-red-600 dark:text-red-400 flex items-center"> <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0"/> {error.modal}</p> )} <div className="flex justify-end space-x-3 pt-2"><button type="button" onClick={() => setIsAddOrgModalOpen(false)} disabled={loading.modal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50">Cancel</button><button type="button" onClick={handleConfirmAddOrg} disabled={loading.modal || !newOrgName.trim()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 flex items-center justify-center min-w-[80px]">{loading.modal ? ( <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : 'Add'}</button></div></div></Modal>
        <Modal isOpen={isEditParamsModalOpen} onClose={() => setIsEditParamsModalOpen(false)} title={`Edit Parameters for ${selectedOrg?.name || ''}`}>{/* ... Edit Params Modal Content ... */}<div className="space-y-4"><div><label htmlFor="verifParams" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Verification Fields (comma-separated)</label><textarea id="verifParams" rows="3" value={verificationParamsInput} onChange={(e) => setVerificationParamsInput(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50" placeholder="e.g., employeeId, department, location" disabled={loading.modal} /><p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Enter fields required for employee verification, separated by commas.</p></div> {error.modal && ( <p className="text-sm text-red-600 dark:text-red-400 flex items-center"> <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0"/> {error.modal}</p> )} <div className="flex justify-end space-x-3 pt-2"><button type="button" onClick={() => setIsEditParamsModalOpen(false)} disabled={loading.modal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50">Cancel</button><button type="button" onClick={handleConfirmEditParams} disabled={loading.modal} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 flex items-center justify-center min-w-[120px]">{loading.modal ? ( <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : 'Save Changes'}</button></div></div></Modal>
        <Modal 
            isOpen={isEditEmailsModalOpen} 
            onClose={() => {
                // Blur the button using ref
                if (employeeEmailsButtonRef.current) {
                    employeeEmailsButtonRef.current.blur();
                }
                !isUpdatingEmails && setIsEditEmailsModalOpen(false);
            }} 
            title="Manage Employee Emails"
        >
            <div className="space-y-4">
                <p className="text-sm text-gray-500">
                    Enter comma-separated email addresses (max 25)
                </p>
                <textarea
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-md h-32 font-mono text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="employee1@example.com, employee2@example.com"
                    value={emailsInput}
                    onChange={(e) => setEmailsInput(e.target.value)}
                    disabled={isUpdatingEmails}
                />
                <div className="text-xs text-gray-500">
                    <p>• Enter one email per line or separate with commas</p>
                    <p>• Only the first 25 emails will be saved</p>
                    <p>• Invalid emails will be automatically removed</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                        {emailsInput ? emailsInput.split(/[,\n]/).filter(Boolean).length : 0} email(s)
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                        Max 25 emails
                    </span>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button
                        onClick={() => setIsEditEmailsModalOpen(false)}
                        disabled={isUpdatingEmails}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpdateEmployeeEmails}
                        disabled={isUpdatingEmails || !emailsInput.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                    >
                        {isUpdatingEmails ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </Modal>

        {/* Admin Emails Modal */}
        <Modal 
            isOpen={isEditAdminEmailsModalOpen} 
            onClose={() => {
                // Blur the button using ref
                if (adminEmailsButtonRef.current) {
                    adminEmailsButtonRef.current.blur();
                }
                !isUpdatingAdminEmails && setIsEditAdminEmailsModalOpen(false);
            }} 
            title="Manage Admin Emails"
        >
            <div className="space-y-4">
                <p className="text-sm text-gray-500">
                    Enter comma-separated email addresses (max 5)
                </p>
                <textarea
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-md h-32 font-mono text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="admin1@example.com, admin2@example.com"
                    value={adminEmailsInput}
                    onChange={(e) => setAdminEmailsInput(e.target.value)}
                    disabled={isUpdatingAdminEmails}
                />
                <div className="text-xs text-gray-500">
                    <p>• Enter one email per line or separate with commas</p>
                    <p>• Only the first 5 emails will be saved</p>
                    <p>• Invalid emails will be automatically removed</p>
                    <p className="text-purple-600 dark:text-purple-400 font-medium mt-1">• These admins will have full access to manage this organization</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                        {adminEmailsInput ? adminEmailsInput.split(/[,\n]/).filter(Boolean).length : 0} email(s)
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                        Max 5 admin emails
                    </span>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                    <button
                        onClick={() => setIsEditAdminEmailsModalOpen(false)}
                        disabled={isUpdatingAdminEmails}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 dark:focus:ring-offset-slate-800 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpdateAdminEmails}
                        disabled={isUpdatingAdminEmails || !adminEmailsInput.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                    >
                        {isUpdatingAdminEmails ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </Modal>


        {/* Delete Post Confirmation Dialog */}
        <DeletionConfirmation
            isOpen={showDeletePostDialog}
            onClose={handleCancelDeletePost}
            title="Delete Post"
            itemType="post"
            itemPreview={postToDelete?.content}
            isDeleting={isDeletingPost}
            onConfirm={handleConfirmDeletePost}
            confirmButtonText="Delete"
            cancelButtonText="Cancel"
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
        </>
    );
};

// --- Import MediaViewer Component ---
import MediaViewer from '../components/MediaViewer';

// Animation variants for Framer Motion
export const fadeInUp = { 
  initial: { opacity: 0, y: 20 }, 
  animate: { opacity: 1, y: 0 }, 
  exit: { opacity: 0, y: -10 }, 
  transition: { duration: 0.3, ease: "easeOut" } 
};

export default AdminDashboard;