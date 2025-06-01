// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useMemo, useCallback, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { api } from '../utils/axios'; // Consolidated axios instance with auth interceptor
import { supabase } from '../supabaseClient';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { uploadMedia } from '../utils/uploadMedia';
import { motion, AnimatePresence } from 'framer-motion';
import { Listbox, Transition, Dialog } from '@headlessui/react';
import {
    BuildingOffice2Icon, ChartBarIcon, CreditCardIcon, DocumentTextIcon, PlusIcon, ArrowLeftOnRectangleIcon,
    UserCircleIcon, UserGroupIcon, ChevronDownIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon,
    TagIcon, MapPinIcon, BuildingLibraryIcon, NoSymbolIcon, ExclamationCircleIcon, XMarkIcon,
    CheckCircleIcon, ExclamationTriangleIcon, SunIcon, MoonIcon, CheckIcon, ChevronUpDownIcon,
    LockClosedIcon, IdentificationIcon, Cog8ToothIcon, Bars3Icon, FolderOpenIcon, ArrowsPointingOutIcon,
    HandThumbUpIcon, HeartIcon, XCircleIcon,
    FaceSmileIcon as EmojiHappyIcon
} from '@heroicons/react/24/outline';
import PostCreation from '../components/PostCreation';
import DeletionConfirmation from '../components/DeletionConfirmation';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Theme Hook ---
const useTheme = () => {
    const [theme, setThemeState] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light'; // Default light
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') { root.classList.add('dark'); }
        else { root.classList.remove('dark'); }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const setTheme = (newTheme) => { if (newTheme === 'light' || newTheme === 'dark') setThemeState(newTheme); };
    const toggleTheme = () => { setTheme(theme === 'light' ? 'dark' : 'light'); };
    return [theme, toggleTheme, setTheme]; // Expose setTheme for direct setting if needed
};


// --- Reusable Modal Component ---
const Modal = ({ isOpen, onClose, title, children, size = "max-w-md" }) => {
    if (!isOpen) return null;
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity" />
                </Transition.Child>
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className={`relative transform overflow-hidden rounded-xl bg-white dark:bg-slate-800 text-left shadow-2xl transition-all sm:my-8 w-full ${size}`}>
                                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
                                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700" aria-label="Close modal"><XMarkIcon className="h-6 w-6" /></button>
                                </div>
                                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">{children}</div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

// --- Helper Components ---
const NothingToShow = ({ message = "Nothing to show" }) => (
    <div className="text-center py-8 px-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg my-4 border border-gray-200 dark:border-slate-700"> <NoSymbolIcon className="h-10 w-10 text-gray-400 dark:text-slate-500 mx-auto mb-3" /> <p className="text-sm text-gray-500 dark:text-slate-400">{message}</p> </div>
);
const DashboardCard = ({ children, className = "" }) => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden ${className}`}> {children} </motion.div>
);
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
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-slate-400" aria-hidden="true" /></span>
            </Listbox.Button>
            <Transition show={open} as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm custom-scrollbar">
                {options.map((option) => (
                  <Listbox.Option key={option.value} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-slate-100'}`} value={option.value}>
                    {({ selected }) => (<><span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{option.label}</span>{selected && (<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400"><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>)}</>)}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
    );
  };
const ThemeToggle = ({ theme, toggleTheme }) => (
    <button onClick={toggleTheme} className="relative inline-flex items-center justify-center w-10 h-10 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900 transition-all duration-200" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}> <AnimatePresence initial={false} mode="wait"> <motion.div key={theme === 'dark' ? 'moon' : 'sun'} initial={{ y: -20, opacity: 0, rotate: -90 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: 20, opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}> {theme === 'dark' ? ( <SunIcon className="h-6 w-6 text-yellow-400" /> ) : ( <MoonIcon className="h-6 w-6 text-blue-500" /> )} </motion.div> </AnimatePresence> </button>
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
    const [loading, setLoading] = useState({ orgList: true, orgDetails: false, modal: false, deleteOrg: {} });
    const [error, setError] = useState({ page: null, modal: null });
    const navigate = useNavigate();
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
    const ws = useRef(null); // WebSocket reference
    const selectedOrgRef = useRef(selectedOrg); // Ref for current selectedOrg
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000'; // WebSocket URL

    // --- Post Deletion Handlers ---
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
    
    const handleDeletePost = async (postId) => {
        if (!selectedOrg || !postId) return;
        
        try {
            const response = await api.delete(`/api/posts/org/${selectedOrg._id}/${postId}`);
            
            // Remove the deleted post from the UI
            setPosts(prev => prev.filter(p => p._id !== postId));
            
            // Close the delete dialog
            setShowDeletePostDialog(false);
            setPostToDelete(null);
            
            // Show success message
            const isAdminDelete = response.data?.deletedByAdmin;
            if (isAdminDelete) {
                setPostSuccess('Post deleted successfully');
                setTimeout(() => setPostSuccess(''), 3000);
            }
            
            // Refresh stats if needed
            if (selectedOrg?._id) {
                const statsRes = await api.get(`/api/posts/org/${selectedOrg._id}/stats`);
                setStats(statsRes.data);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete post.';
            setPostError(errorMessage);
            setTimeout(() => setPostError(''), 3000);
        }
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
            console.log('[selectOrganization] Clearing organization selection');
            setSelectedOrg(null);
            setPosts([]);
            setStats([]);
            setLoading(prev => ({ ...prev, orgDetails: false, posts: false, stats: false }));
            return;
        }

        console.log(`[selectOrganization] Selecting organization:`, { 
            id: org._id, 
            name: org.name,
            adminId: org.adminId
        });
        
        // Update selected org and reset related state
        setSelectedOrg(org);
        setLoading(prev => ({ 
            ...prev, 
            orgDetails: true, 
            posts: true, 
            stats: true 
        }));
        setError(prev => ({ ...prev, page: null }));
        setPosts([]);
        setStats([]);

        try {
            // Fetch posts and stats in parallel
            const [statsRes, postsRes] = await Promise.all([
                // Fetch stats with error handling
                api.get(`/posts/stats/${org._id}`, {
                    validateStatus: status => status < 500 // Don't throw for 4xx errors
                }).catch(err => {
                    console.warn(`[selectOrganization] Error fetching stats for org ${org._id}:`, err);
                    return { data: null };
                }),
                // Fetch posts with error handling
                api.get(`/api/posts/org/${org._id}`, {
                    validateStatus: status => status < 500 // Don't throw for 4xx errors
                }).catch(err => {
                    console.warn(`[selectOrganization] Error fetching posts for org ${org._id}:`, err);
                    return { data: [] };
                })
            ]);

            // Process stats response
            if (statsRes?.data) {
                setStats(Array.isArray(statsRes.data) ? statsRes.data : []);
            } else {
                setStats([]);
            }

            // Process posts response
            if (Array.isArray(postsRes?.data)) {
                const sortedPosts = [...postsRes.data].sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                setPosts(sortedPosts);
            } else {
                setPosts([]);
            }
        } catch (err) {
            console.error(`[selectOrganization] Error fetching data for ${org?.name || 'organization'}:`, {
                error: err,
                response: err.response?.data,
                status: err.response?.status
            });

            let errorMessage = `Failed to load details for ${org?.name || 'the organization'}.`;
            
            // Handle different types of errors
            if (err.response) {
                // Server responded with an error status code
                if (err.response.status === 401) {
                    errorMessage = 'Your session has expired. Please log in again.';
                    // Optionally redirect to login
                    // navigate('/login', { state: { from: 'session-expired' } });
                } else if (err.response.status === 403) {
                    errorMessage = 'You do not have permission to view this organization.';
                } else if (err.response.status === 404) {
                    // Clear any previous errors if we get a 404 (no posts)
                    setError(prev => ({ ...prev, page: null }));
                    return; // Exit early for 404 errors
                } else if (err.response.data?.message) {
                    errorMessage = err.response.data.message;
                }
            } else if (err.request) {
                // Request was made but no response received
                errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            } else if (err.message) {
                // Other errors (e.g., from throw new Error)
                errorMessage = err.message;
            }
            
            // Update error state
            setError(prev => ({
                ...prev,
                page: errorMessage
            }));
            
            // Reset states on error
            setPosts([]);
            setStats([]);
        } finally {
            // Ensure all loading states are reset
            setLoading(prev => ({
                ...prev,
                orgDetails: false,
                posts: false,
                stats: false
            }));
            
            // Log completion of organization selection
            console.log(`[selectOrganization] Completed loading for org: ${org?._id || 'none'}`);
        }
    }, []);

    /**
     * Fetches organizations for the currently authenticated admin user
     * @returns {Promise<void>}
     */
    const fetchOrganizationsList = useCallback(async () => {
        if (!userData) {
            console.log('[fetchOrganizationsList] No user data available');
            return;
        }

        console.log('[fetchOrganizationsList] Starting to fetch organizations for user:', userData.email);
        setLoading(prev => ({ ...prev, orgList: true }));
        setError(prev => ({ ...prev, page: null }));

        try {
            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
                const errorMsg = 'No authentication token found. Please log in again.';
                console.error('[fetchOrganizationsList]', errorMsg);
                setError(prev => ({ ...prev, page: errorMsg }));
                return;
            }

            console.log('[fetchOrganizationsList] Making API request to /organizations/by-admin');
            
            const response = await api.get('/organizations/by-admin', {
                headers: { 
                    'Authorization': `Bearer ${storedToken}`,
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                validateStatus: status => status < 500 // Don't throw for 4xx errors
            });

            console.log('[fetchOrganizationsList] API Response:', {
                status: response.status,
                data: response.data
            });

            // Handle different response statuses
            if (!response.data) {
                throw new Error('No data received from server');
            }

            if (!response.data.success) {
                // Handle API-level errors (e.g., validation errors)
                const errorMessage = response.data.message || 'Failed to fetch organizations';
                throw new Error(errorMessage);
            }

            // Extract organizations from response
            const orgs = Array.isArray(response.data.data) ? response.data.data : [];
            console.log(`[fetchOrganizationsList] Found ${orgs.length} organizations`);
            
            // Update state with the organizations
            setOrganizations(orgs);

            // Auto-select first organization if none selected
            if (!selectedOrg && orgs.length > 0) {
                console.log('[fetchOrganizationsList] Auto-selecting first organization:', orgs[0]._id);
                selectOrganization(orgs[0]);
            } else if (orgs.length === 0) {
                console.log('[fetchOrganizationsList] No organizations found for user');
                setSelectedOrg(null);
                setPosts([]);
                setStats([]);
            }
        } catch (err) {
            console.error('[fetchOrganizationsList] Error loading organizations:', {
                error: err,
                response: err.response?.data,
                status: err.response?.status
            });
            
            let errorMessage = 'Failed to load organizations. Please try again.';
            
            // Handle different types of errors
            if (err.response) {
                // Server responded with an error status code
                if (err.response.status === 401) {
                    errorMessage = 'Your session has expired. Please log in again.';
                    // Optionally redirect to login
                    // navigate('/login', { state: { from: 'session-expired' } });
                } else if (err.response.status === 403) {
                    errorMessage = 'You do not have permission to view organizations.';
                } else if (err.response.data?.message) {
                    errorMessage = err.response.data.message;
                }
            } else if (err.request) {
                // Request was made but no response received
                errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            } else if (err.message) {
                // Other errors (e.g., from throw new Error)
                errorMessage = err.message;
            }
            
            // Update error state
            setError(prev => ({
                ...prev,
                page: errorMessage
            }));
            
            // Reset states
            setOrganizations([]);
            setSelectedOrg(null);
            setPosts([]);
            setStats([]);
        } finally {
            setLoading(prev => ({ ...prev, orgList: false }));
        }
    }, [userData, selectedOrg, selectOrganization]);

    // --- Effect to fetch organizations list when userData is available ---
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

    // --- WebSocket Effect for Real-time Updates ---
    useEffect(() => {
        if (!userData) {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                console.log('AdminDashboard: No user data, closing WebSocket.');
                ws.current.close();
            }
            return; // Don't connect if no user data (not authenticated)
        }

        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        let reconnectTimeout;
        let isMounted = true;
        
        // Create a wrapper for refreshOrgStats that checks isMounted
        const safeRefreshOrgStats = async (orgId) => {
            if (!isMounted) return Promise.resolve();
            try {
                return await refreshOrgStats(orgId);
            } catch (err) {
                console.error('Error in safeRefreshOrgStats:', err);
                return Promise.reject(err);
            }
        };

        const connectWebSocket = () => {
            if (!isMounted) return;
            
            if (ws.current) {
                if (ws.current.readyState === WebSocket.OPEN) return;
                ws.current.close();
            }

            console.log(`AdminDashboard: Attempting to connect WebSocket to ${WS_URL}`);
            ws.current = new WebSocket(WS_URL);

            ws.current.onopen = () => {
                console.log('AdminDashboard: WebSocket connected successfully.');
                reconnectAttempts = 0; // Reset reconnect attempts on successful connection
            };

            ws.current.onmessage = async (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('AdminDashboard: WebSocket message received:', message);
                    const currentSelectedOrgId = selectedOrgRef.current?._id;

                    if (!currentSelectedOrgId) {
                        console.log('AdminDashboard: No organization selected, ignoring WebSocket message.');
                        return;
                    }

                    switch (message.type) {
                        case 'POST_CREATED':
                            if (message.payload.organization === currentSelectedOrgId) {
                                console.log('AdminDashboard: POST_CREATED event for current org', message.payload);
                                setPosts(prevPosts =>
                                    [message.payload, ...prevPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                );
                                await safeRefreshOrgStats(currentSelectedOrgId);
                            }
                            break;
                        case 'POST_UPDATED':
                            if (message.payload.organization === currentSelectedOrgId) {
                                console.log('AdminDashboard: POST_UPDATED event for current org', message.payload);
                                setPosts(prevPosts =>
                                    prevPosts.map(p => (p._id === message.payload._id ? message.payload : p))
                                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                );
                                await safeRefreshOrgStats(currentSelectedOrgId);
                            }
                            break;
                        case 'POST_DELETED':
                            if (message.payload.organizationId === currentSelectedOrgId) {
                                console.log('AdminDashboard: POST_DELETED event for current org', message.payload);
                                setPosts(prevPosts => prevPosts.filter(p => p._id !== message.payload.postId));
                                await safeRefreshOrgStats(currentSelectedOrgId);
                            }
                            break;
                        case 'COMMENT_CREATED':
                        case 'COMMENT_UPDATED':
                        case 'COMMENT_DELETED':
                        case 'REACTION_UPDATED':
                            if (message.payload.organizationId === currentSelectedOrgId) {
                                console.log(`AdminDashboard: ${message.type} event for current org, refreshing stats and potentially specific post.`);
                                await safeRefreshOrgStats(currentSelectedOrgId);
                                
                                if (message.payload.postId) {
                                    setPosts(prevPosts => prevPosts.map(p => {
                                        if (p._id === message.payload.postId) {
                                            let updatedPost = { ...p };
                                            if (message.type === 'COMMENT_CREATED') {
                                                updatedPost.commentCount = (updatedPost.commentCount || 0) + 1;
                                            } else if (message.type === 'COMMENT_DELETED') {
                                                updatedPost.commentCount = Math.max(0, (updatedPost.commentCount || 0) - 1);
                                            }
                                            return updatedPost;
                                        }
                                        return p;
                                    }));
                                }
                            }
                            break;
                        default:
                            console.log('AdminDashboard: Unhandled WebSocket message type:', message.type);
                    }
                } catch (error) {
                    console.error('AdminDashboard: Failed to process WebSocket message:', error);
                }
            };

            ws.current.onerror = (error) => {
                console.error('AdminDashboard: WebSocket error:', error);
            };

            ws.current.onclose = (event) => {
                console.log('AdminDashboard: WebSocket disconnected.', event.code, event.reason);
                
                if (!isMounted) return;
                
                // Attempt to reconnect with exponential backoff
                if (reconnectAttempts < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Max 30s delay
                    console.log(`AdminDashboard: Attempting to reconnect in ${delay}ms...`);
                    
                    reconnectTimeout = setTimeout(() => {
                        reconnectAttempts++;
                        connectWebSocket();
                    }, delay);
                } else {
                    console.error('AdminDashboard: Max reconnection attempts reached. Please refresh the page.');
                }
            };
        };

        // Initial connection
        connectWebSocket();

        // Cleanup on component unmount or when userData changes
        return () => {
            isMounted = false;
            clearTimeout(reconnectTimeout);
            
            if (ws.current) {
                ws.current.onopen = null;
                ws.current.onmessage = null;
                ws.current.onerror = null;
                ws.current.onclose = null;
                
                if (ws.current.readyState === WebSocket.OPEN) {
                    console.log('AdminDashboard: Closing WebSocket connection due to unmount or userData change.');
                    ws.current.close();
                }
            }
        };
    }, [userData, refreshOrgStats]); // Dependencies for the WebSocket effect


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
    const filteredPosts = useMemo(() => posts.filter(post => (selectedType === 'all' || post.postType === selectedType) && (selectedRegion === 'all' || post.region === selectedRegion) && (selectedDepartment === 'all' || post.department === selectedDepartment)), [posts, selectedType, selectedRegion, selectedDepartment]);
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
        const currentEmails = selectedOrg.adminEmails?.map(e => e.email) || [];
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

            await api.put(`/organizations/${orgId}/admin-emails`, requestData);
            
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
    
    const handleLogout = () => { localStorage.clear(); navigate('/signin'); };

    // State for Co-admin Orgs Modal
    const [isCoAdminOrgsModalOpen, setIsCoAdminOrgsModalOpen] = useState(false);
    
    // Handler for opening Co-admin Orgs modal
    const handleOpenCoAdminOrgsModal = () => {
        setIsCoAdminOrgsModalOpen(true);
    };

    // --- Sidebar Items ---
    const sidebarNavItems = [
        { name: 'Add Organization', icon: PlusIcon, action: handleOpenAddOrgModal, current: isAddOrgModalOpen },
        { name: 'Manage Orgs', icon: Cog8ToothIcon, action: handleOpenManageOrgModal, current: isManageOrgModalOpen },
        { name: 'Subscriptions', icon: CreditCardIcon, action: () => navigate('/subscriptions'), current: window.location.pathname === '/subscriptions' },
        { name: 'Co-admin Orgs', icon: UserGroupIcon, action: handleOpenCoAdminOrgsModal, current: isCoAdminOrgsModalOpen },
        { name: 'Create Post', icon: PencilSquareIcon, action: () => setViewMode('createPost'), current: viewMode === 'createPost' },
    ];

    // --- Mobile Sidebar Component ---
    const MobileSidebar = () => (
        <Transition.Root show={isMobileSidebarOpen} as={Fragment}>
            <Dialog as="div" className="relative z-40 md:hidden" onClose={setIsMobileSidebarOpen}>
                <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-gray-600/75 dark:bg-slate-900/75" /></Transition.Child>
                <div className="fixed inset-0 z-40 flex">
                    <Transition.Child as={Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
                        <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-slate-900 pt-5 pb-4">
                            <Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
                                <div className="absolute top-0 right-0 -mr-12 pt-2"><button type="button" className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-white" onClick={() => setIsMobileSidebarOpen(false)}><span className="sr-only">Close sidebar</span> <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" /></button></div>
                            </Transition.Child>
                            <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0"><BuildingOffice2Icon className="h-8 w-8 text-blue-600 dark:text-blue-500" /><span className="ml-2 text-xl font-semibold text-gray-800 dark:text-slate-100">Admin</span></div>
                            <nav className="mt-5 flex flex-col space-y-4 items-center">
                                {sidebarNavItems.map((item) => (<button key={item.name} onClick={() => { item.action(); setIsMobileSidebarOpen(false);}} className={`w-full flex items-center px-3 py-3 rounded-md text-sm font-medium group transition-colors duration-150 ${item.current ? 'bg-gray-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100'}`}><item.icon className="h-6 w-6 mr-3 flex-shrink-0" />{item.name}</button>))}
                            </nav>
                            <div className="mt-auto flex flex-col items-center space-y-4">
                                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                                <button onClick={handleLogout} title="Logout" className="p-3 lg:p-3 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-700/50 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                    <ArrowLeftOnRectangleIcon className="h-6 w-6 lg:h-7 lg:w-7" />
                                    <span className="sr-only">Logout</span>
                                </button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                    <div className="w-14 flex-shrink-0" aria-hidden="true"></div>
                </div>
            </Dialog>
        </Transition.Root>
    );

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
            <MobileSidebar />
            <aside className="hidden md:flex md:w-20 lg:w-24 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex-col items-center py-6 space-y-5 shadow-sm flex-shrink-0">
                <div className="p-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex-shrink-0"><BuildingOffice2Icon className="h-7 w-7" /></div>
                <nav className="flex flex-col space-y-4 items-center">
                    {sidebarNavItems.map((item) => (<button key={item.name} onClick={item.action} title={item.name} className={`p-3 lg:p-3 rounded-lg transition-colors duration-150 ${item.current ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400'}`}><item.icon className="h-6 w-6 lg:h-7 lg:w-7" /><span className="sr-only">{item.name}</span></button>))}
                </nav>
                <div className="mt-auto flex flex-col items-center space-y-4">
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                    <button onClick={handleLogout} title="Logout" className="p-3 lg:p-3 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-700/30 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        <ArrowLeftOnRectangleIcon className="h-6 w-6 lg:h-7 lg:w-7" />
                        <span className="sr-only">Logout</span>
                    </button>
                </div>
            </aside>

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
                                            const postsRes = await api.get(`/posts/${selectedOrg._id}`);
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
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-y-3 gap-x-4"><div><h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-50">{selectedOrg.name}</h2><p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">ID: <code className="text-xs bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded">{selectedOrg._id}</code> | Created: {new Date(selectedOrg.createdAt).toLocaleDateString()}</p></div><div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0"></div></div>
                                
                                <DashboardCard className="p-4 sm:p-6"><h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4">Employee Access</h3>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-slate-100">Authorized Emails</h4>
                                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                                    {selectedOrg.employeeEmails?.length > 0
                                                        ? `${selectedOrg.employeeEmails.length} email(s) configured`
                                                        : 'No employee emails added'}
                                                </p>
                                                {selectedOrg.employeeEmails?.length > 0 && (
                                                    <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                                                        <p>First email: {selectedOrg.employeeEmails[0].email}</p>
                                                        {selectedOrg.employeeEmails.length > 1 && (
                                                            <p>+ {selectedOrg.employeeEmails.length - 1} more</p>
                                                        )}
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
                                                <h4 className="font-medium text-gray-900 dark:text-slate-100">Authorized Admin Emails</h4>
                                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                                    {selectedOrg.adminEmails?.length > 0
                                                        ? `${selectedOrg.adminEmails.length} admin email(s) configured`
                                                        : 'No admin emails added'}
                                                </p>
                                                {selectedOrg.adminEmails?.length > 0 && (
                                                    <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                                                        <p>First admin: {selectedOrg.adminEmails[0].email}</p>
                                                        {selectedOrg.adminEmails.length > 1 && (
                                                            <p>+ {selectedOrg.adminEmails.length - 1} more</p>
                                                        )}
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
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4">Posts Overview</h3>
                                    
                                    <div className="mb-6 bg-gray-50 dark:bg-slate-800/50 p-3 sm:p-4 rounded-md border border-gray-200 dark:border-slate-700">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                            <CustomSelect 
                                                label="Type" 
                                                value={selectedType} 
                                                onChange={setSelectedType} 
                                                options={typeOptions} 
                                                icon={TagIcon} 
                                            />
                                            <CustomSelect 
                                                label="Region" 
                                                value={selectedRegion} 
                                                onChange={setSelectedRegion} 
                                                options={regionOptions} 
                                                icon={MapPinIcon} 
                                                disabled={uniqueRegions.length === 0} 
                                            />
                                            <CustomSelect 
                                                label="Department" 
                                                value={selectedDepartment} 
                                                onChange={setSelectedDepartment} 
                                                options={departmentOptions} 
                                                icon={BuildingLibraryIcon} 
                                                disabled={uniqueDepartments.length === 0} 
                                            />
                                        </div>
                                    </div>
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
                                            {filteredPosts.map((post, i) => (
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
                                                    
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-700 pt-1.5 sm:pt-2 mt-1.5 sm:mt-2 flex flex-wrap gap-x-2 gap-y-1 items-center">
                                                        <span>By: {post.createdByRole === 'admin' || (post.author && post.author.role === 'admin') ? 'Admin' : (post.createdBy || 'User')}</span>
                                                        {(post.createdByRole === 'admin' || (post.author && post.author.role === 'admin')) && (
                                                          <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                                                            Admin
                                                          </span>
                                                        )}
                                                        <span>|</span>
                                                        <span>{new Date(post.createdAt).toLocaleString()}</span>
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

        {/* Co-admin Orgs Modal */}
        <Modal 
            isOpen={isCoAdminOrgsModalOpen} 
            onClose={() => setIsCoAdminOrgsModalOpen(false)} 
            title="Co-admin Organizations"
            size="max-w-md"
        >
            <div className="text-center py-8">
                <FolderOpenIcon className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">No Organizations</h3>
                <p className="text-gray-500 dark:text-slate-400">There are no co-admin organizations to display.</p>
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
        <Modal isOpen={isManageOrgModalOpen} onClose={() => setIsManageOrgModalOpen(false)} title="Manage Organizations" size="max-w-2xl">{/* ... Manage Orgs Modal Content ... */ loading.orgList ? (<div className="text-center py-10"><p className="text-gray-600 dark:text-slate-400">Loading organizations...</p></div>) : organizations.length === 0 ? (<NothingToShow message="No organizations to manage. Add one first." />) : (<div className="space-y-3"><p className="text-sm text-gray-600 dark:text-slate-400">Select an organization to view details or delete.</p><ul className="divide-y divide-gray-200 dark:divide-slate-700 max-h-[60vh] overflow-y-auto custom-scrollbar -mx-1 pr-1">{organizations.map((org) => (<li key={org._id} className={`p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-md transition-colors ${selectedOrg?._id === org._id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}><div className="flex items-center justify-between space-x-3"><div className="flex-1 min-w-0"><button onClick={() => { selectOrganization(org); setIsManageOrgModalOpen(false); }} className="text-left w-full group"><p className={`text-sm font-medium truncate ${selectedOrg?._id === org._id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>{org.name}</p><p className="text-xs text-gray-500 dark:text-slate-400 truncate">ID: {org._id} | Created: {new Date(org.createdAt).toLocaleDateString()}</p></button></div><button onClick={() => initiateDeleteOrganization(org)} disabled={loading.deleteOrg?.[org._id]} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-700/30 disabled:opacity-50" title="Delete Organization">{loading.deleteOrg?.[org._id] ? <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg> : <TrashIcon className="h-4 w-4" />}</button></div></li>))}</ul></div>)}<div className="mt-6 flex justify-end"><button type="button" onClick={() => setIsManageOrgModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800">Close</button></div></Modal>
        <Modal isOpen={isDeleteConfirmModalOpen} onClose={() => { setIsDeleteConfirmModalOpen(false); setOrgToDelete(null);}} title={`Delete ${orgToDelete?.name || 'Organization'}`}>{/* ... Delete Org Confirmation Modal Content ... */}<div className="space-y-4"><p className="text-sm text-gray-700 dark:text-slate-300">This action is permanent and will delete all associated posts. To confirm, type the organization's name (<strong className="font-semibold text-red-600 dark:text-red-400">{orgToDelete?.name}</strong>) and enter your account password.</p><div><label htmlFor="orgNameConfirmDel" className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center"><IdentificationIcon className="h-4 w-4 mr-1 text-gray-400 dark:text-slate-500"/> Type organization name</label><input type="text" id="orgNameConfirmDel" value={deleteOrgNameConfirm} onChange={(e) => setDeleteOrgNameConfirm(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-red-500 focus:border-red-500 disabled:opacity-50" placeholder={orgToDelete?.name || ''} disabled={loading.deleteOrg?.[orgToDelete?._id]} /></div><div><label htmlFor="passwordConfirmDel" className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center"><LockClosedIcon className="h-4 w-4 mr-1 text-gray-400 dark:text-slate-500"/> Your Password</label><input type="password" id="passwordConfirmDel" value={deletePasswordConfirm} onChange={(e) => setDeletePasswordConfirm(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-red-500 focus:border-red-500 disabled:opacity-50" placeholder="Enter your account password" disabled={loading.deleteOrg?.[orgToDelete?._id]} /></div> {error.modal && ( <p className="text-sm text-red-600 dark:text-red-400 flex items-center"> <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0"/> {error.modal}</p> )} <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-slate-700 mt-5"><button type="button" onClick={() => { setIsDeleteConfirmModalOpen(false); setOrgToDelete(null); }} disabled={loading.deleteOrg?.[orgToDelete?._id]} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50">Cancel</button><button type="button" onClick={handleConfirmDeleteOrg} disabled={loading.deleteOrg?.[orgToDelete?._id] || !deletePasswordConfirm || deleteOrgNameConfirm !== orgToDelete?.name} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 flex items-center justify-center min-w-[140px]">{loading.deleteOrg?.[orgToDelete?._id] ? ( <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : 'Confirm Delete'}</button></div></div></Modal>
        </>
    );
};

// --- Reaction Button Component ---
const ReactionButton = ({ type, count, postId, commentId = null }) => {
  const [isReacted, setIsReacted] = useState(false);
  const [currentCount, setCurrentCount] = useState(count || 0);
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
        const endpoint = buildEndpoint('/api/posts', true);
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
        // If we have an orgId and got a 404, try without orgId
        if (orgId && error.response?.status === 404) {
          try {
            const fallbackEndpoint = buildEndpoint('/api/posts', false);
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
      const endpoint = buildEndpoint('/api/posts', true);
      
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
          const fallbackEndpoint = buildEndpoint('/api/posts', false);
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
    const baseClass = "h-5 w-5";
    switch(type) {
      case 'like': return <HandThumbUpIcon className={baseClass} />;
      case 'love': return <HeartIcon className={`${baseClass} text-red-500`} />;
      case 'laugh': return <EmojiHappyIcon className={`${baseClass} text-yellow-500`} />;
      case 'angry': return <XCircleIcon className={`${baseClass} text-orange-500`} />;
      default: return <HandThumbUpIcon className={baseClass} />;
    }
  };

  return (
    <button
      onClick={handleReaction}
      className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
        isReacted 
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 text-blue-300' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
      }`}
      title={isReacted ? `You reacted with ${type}` : `React with ${type}`}
      disabled={isLoading}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        getIcon()
      )}
      <span className="text-sm">{currentCount}</span>
    </button>
  );
};

// --- Comment Section Component ---
const CommentSection = ({ postId, comments: initialComments = [], selectedOrg, onCommentAdded }) => {
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
    setIsLoading(true);
    setError(null);
    
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        throw new Error('No authentication token found');
      }
      
      const orgId = selectedOrg?._id;
      if (!orgId) {
        throw new Error('No organization selected');
      }
      
      if (!postId) {
        throw new Error('No post ID provided');
      }
      
      console.log('Fetching comments for post:', postId, 'in org:', orgId);
      
      try {
        // Get the specific post with comments and author info populated
        const response = await api.get(`/api/posts/org/${orgId}?postId=${postId}`);
        
        if (!response.data) {
          throw new Error('No data received from server');
        }
        
        const post = response.data;
        
        if (!post) {
          throw new Error('Post not found');
        }
        
        // Get comments from the post and ensure they have proper author info
        const updatedComments = Array.isArray(post.comments) 
          ? post.comments.map(comment => ({
              ...comment,
              // Ensure we have author info and default to empty object if not available
              author: comment.author || { _id: comment.author, role: 'user' },
              // For backward compatibility, check createdByRole first, then fall back to author.role
              createdByRole: comment.createdByRole || (comment.author?.role || 'user')
            }))
          : [];
        
        console.log('Fetched comments with author info:', updatedComments);
        
        setLocalComments(updatedComments);
        
        if (onCommentAdded) {
          onCommentAdded(updatedComments);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Failed to load comments. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch comments');
    } finally {
      setIsLoading(false);
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
      // Get the stored token
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        throw new Error('No authentication token found. Please sign in again.');
      }
      
      // Get the current user's email and role
      const userEmail = localStorage.getItem('email');
      const userRole = localStorage.getItem('role');
      
      if (!userEmail || !userRole) {
        throw new Error('User session is incomplete. Please sign in again.');
      }
      
      console.log('Posting comment to post:', postId, 'as user:', userEmail, 'with role:', userRole);
      
      // The backend will handle setting author and createdByRole from the authenticated user's session
      const response = await api.post(
        `/api/posts/org/${selectedOrg._id}/${postId}/comments`,
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
      
      setError(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to post comment. ';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        
        if (error.response.status === 401) {
          errorMessage += 'Authentication failed. Please sign in again.';
          // Redirect to login after a short delay
          setTimeout(() => navigate('/signin'), 2000);
        } else if (error.response.data) {
          errorMessage += error.response.data.message || JSON.stringify(error.response.data);
        }
      } else if (error.request) {
        // The request was made but no response received
        console.error('No response received:', error.request);
        errorMessage += 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
        errorMessage += error.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      // Restore the comment text if there was an error
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
    setError(null);

    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        throw new Error('No authentication token found');
      }

      const response = await api.delete(`/api/posts/org/${selectedOrg._id}/${postId}/comments/${commentToDelete}`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      // Show success message if this was an admin deletion
      if (response.data?.deletedByAdmin) {
        setError('Comment deleted by admin.');
      }

      // Refresh comments after successful deletion
      await fetchPostWithComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete comment';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setCommentToDelete(null);
    }
  };
  
  // For backward compatibility
  const handleCommentDelete = handleDeleteClick;

  return (
    <div className="mt-4 space-y-4">
      {/* Delete Confirmation Dialog for Comments */}
      <Modal 
        isOpen={showDeleteDialog} 
        onClose={handleCancelDelete}
        title="Delete Comment"
        size="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-800 dark:text-slate-200">
            Are you sure you want to delete this comment? This action cannot be undone.
          </p>
          {commentToDelete && (
            <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded-md">
              <p className="text-sm text-gray-700 dark:text-slate-200 italic">
                "{localComments.find(c => c._id === commentToDelete)?.text}"
              </p>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={handleCancelDelete}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 flex items-center justify-center min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

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
          className="flex-1 p-2 rounded bg-gray-100 text-gray-900 dark:bg-slate-700 dark:text-white"
          onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
        />
        <button
          onClick={handleCommentSubmit}
          disabled={!newComment.trim() || isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>

      {localComments.map(comment => {
        const isAdmin = comment.createdByRole === 'admin' || (comment.author && comment.author.role === 'admin');
        
        return (
          <div key={comment._id} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
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
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(comment._id);
                }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                disabled={isLoading}
                title="Delete comment"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
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

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Delete Comment</h3>
            <p className="text-gray-600 dark:text-slate-300 mb-6">Are you sure you want to delete this comment? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-800 disabled:opacity-50"
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
    </div>
  );
};

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
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Toggle fullscreen mode
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

// Animation variants for Framer Motion
export const fadeInUp = { 
  initial: { opacity: 0, y: 20 }, 
  animate: { opacity: 1, y: 0 }, 
  exit: { opacity: 0, y: -10 }, 
  transition: { duration: 0.3, ease: "easeOut" } 
};

export default AdminDashboard;