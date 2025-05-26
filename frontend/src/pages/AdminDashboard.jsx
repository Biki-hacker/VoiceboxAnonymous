// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useMemo, useCallback, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios'; // Your axios instance
import { supabase } from '../supabaseClient';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Listbox, Transition, Dialog } from '@headlessui/react';
import {
    BuildingOffice2Icon, ChartBarIcon, DocumentTextIcon, PlusIcon, ArrowLeftOnRectangleIcon,
    UserCircleIcon, ChevronDownIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon,
    TagIcon, MapPinIcon, BuildingLibraryIcon, NoSymbolIcon, ExclamationCircleIcon, XMarkIcon,
    CheckCircleIcon, ExclamationTriangleIcon, SunIcon, MoonIcon, CheckIcon, ChevronUpDownIcon,
    LockClosedIcon, IdentificationIcon, Cog8ToothIcon, Bars3Icon, FolderOpenIcon, ArrowsPointingOutIcon,
    HandThumbUpIcon, HeartIcon, XCircleIcon,
    FaceSmileIcon as EmojiHappyIcon
} from '@heroicons/react/24/outline';
import PostCreation from '../components/PostCreation';

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
    const [newOrgName, setNewOrgName] = useState("");
    const [verificationParamsInput, setVerificationParamsInput] = useState("");
    const [deleteOrgNameConfirm, setDeleteOrgNameConfirm] = useState("");
    const [deletePasswordConfirm, setDeletePasswordConfirm] = useState("");
    const [theme, toggleTheme, setTheme] = useTheme();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [initialOrgSelectedFlag, setInitialOrgSelectedFlag] = useState(false);
    const [viewMode, setViewMode] = useState('dashboard');
    const [viewingMedia, setViewingMedia] = useState({
        isOpen: false,
        url: '',
        type: 'image' // 'image' or 'video'
    });
    const [createPostView, setCreatePostView] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [postType, setPostType] = useState('feedback');
    const [postRegion, setPostRegion] = useState('');
    const [postDepartment, setPostDepartment] = useState('');
    const [postTags, setPostTags] = useState([]);
    const [postMedia, setPostMedia] = useState(null);
    const [isSubmittingPost, setIsSubmittingPost] = useState(false);

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

    // --- Callback to select an organization and fetch its details ---
    const selectOrganization = useCallback(async (org) => {
        if (!org) {
            setSelectedOrg(null);
            setPosts([]);
            setStats([]);
            setLoading(prev => ({ ...prev, orgDetails: false }));
            return;
        }

        setSelectedOrg(org);
        setLoading(prev => ({ ...prev, orgDetails: true }));
        setError(prev => ({ ...prev, page: null }));
        setStats([]);
        setPosts([]);

        try {
            const [statsRes, postsRes] = await Promise.all([
                api.get(`/posts/stats/${org._id}`),
                api.get(`/posts/${org._id}`)
            ]);

            setStats(statsRes.data);
            setPosts(postsRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            console.error(`Error fetching data for ${org.name}:`, err);
            setError(prev => ({ 
                ...prev, 
                page: err.response?.data?.message || `Failed to load details for ${org.name}.` 
            }));
        } finally {
            setLoading(prev => ({ ...prev, orgDetails: false }));
        }
    }, []);

    // --- Callback to fetch the list of organizations ---
    const fetchOrganizationsList = useCallback(async () => {
        if (!userData) return;

        setLoading(prev => ({ ...prev, orgList: true }));
        setError(prev => ({ ...prev, page: null }));

        try {
            const storedToken = localStorage.getItem('token');
            const response = await api.get('/organizations/by-admin', {
              params: { email: userData.email },
              headers: { Authorization: `Bearer ${storedToken}` }
            });

            const sortedOrgs = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrganizations(sortedOrgs);

            // Auto-select first organization if none selected
            if (!selectedOrg && sortedOrgs.length > 0) {
                selectOrganization(sortedOrgs[0]);
            }
        } catch (err) {
            console.error('Error loading organizations:', err);
            setError(prev => ({ 
                ...prev, 
                page: err.response?.data?.message || 'Failed to load organizations. Please try again.' 
            }));
            setOrganizations([]);
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
    const commonChartOptions = useMemo(() => ({ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: theme === 'dark' ? '#D1D5DB' : '#4B5563', padding: 20, font: { size: 12 } } }, title: { display: true, color: theme === 'dark' ? '#F3F4F6' : '#111827', font: { size: 16, weight: '600' }, padding: { bottom: 15 } }, tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.75)', titleColor: '#FFFFFF', bodyColor: '#F3F4F6', padding: 10, cornerRadius: 4, } }, scales: { y: { beginAtZero: true, grid: { color: theme === 'dark' ? 'rgba(200, 200, 200, 0.1)' : '#E5E7EB' }, ticks: { color: theme === 'dark' ? '#9CA3AF' : '#6B7280' } }, x: { grid: { display: false }, ticks: { color: theme === 'dark' ? '#9CA3AF' : '#6B7280' } } } }), [theme]);
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
    const handleConfirmEditParams = () => {
        if (!selectedOrg) return; const fields = verificationParamsInput.split(',').map(f => f.trim()).filter(Boolean); setLoading(prev => ({ ...prev, modal: true })); setError(prev => ({ ...prev, modal: null }));
        api.patch(`/organizations/${selectedOrg._id}`, { verificationFields: fields })
            .then(() => { const updatedOrg = { ...selectedOrg, verificationFields: fields }; setSelectedOrg(updatedOrg); setOrganizations(orgs => orgs.map(o => o._id === updatedOrg._id ? updatedOrg : o)); setIsEditParamsModalOpen(false); })
            .catch(err => { console.error('Error updating parameters:', err); setError(prev => ({ ...prev, modal: err.response?.data?.message || 'Failed to update parameters.' })); })
            .finally(() => { setLoading(prev => ({ ...prev, modal: false })); });
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
    const handleDeletePost = (postId, postContent) => { /* ... Delete Post logic ... */
        if (!selectedOrg || !window.confirm(`Delete this post?\n"${postContent.substring(0, 50)}..."`)) return;
        api.delete(`/posts/${postId}`)
            .then(() => { setPosts(prev => prev.filter(p => p._id !== postId)); api.get(`/posts/stats/${selectedOrg._id}`).then(statsRes => setStats(statsRes.data)).catch(err => console.error("Error refreshing stats:", err)); })
            .catch(err => { console.error('Error deleting post:', err); setError(prev => ({ ...prev, page: 'Failed to delete post.' })); });
    };
    const handleLogout = () => { localStorage.clear(); navigate('/signin'); };

    // --- Sidebar Items ---
    const sidebarNavItems = [
        { name: 'Add Organization', icon: PlusIcon, action: handleOpenAddOrgModal, current: isAddOrgModalOpen },
        { name: 'Manage Orgs', icon: Cog8ToothIcon, action: handleOpenManageOrgModal, current: isManageOrgModalOpen },
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
                                <div className="absolute top-0 right-0 -mr-12 pt-2"><button type="button" className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setIsMobileSidebarOpen(false)}><span className="sr-only">Close sidebar</span> <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" /></button></div>
                            </Transition.Child>
                            <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0"><BuildingOffice2Icon className="h-8 w-8 text-blue-600 dark:text-blue-500" /><span className="ml-2 text-xl font-semibold text-gray-800 dark:text-slate-100">Admin</span></div>
                            <nav className="mt-5 flex-1 space-y-2 px-3">
                                {sidebarNavItems.map((item) => (<button key={item.name} onClick={() => { item.action(); setIsMobileSidebarOpen(false);}} className={`w-full flex items-center px-3 py-3 rounded-md text-sm font-medium group transition-colors duration-150 ${item.current ? 'bg-gray-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'}`}><item.icon className={`h-6 w-6 mr-3 flex-shrink-0 ${item.current ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-500 dark:group-hover:text-slate-400'}`} />{item.name}</button>))}
                            </nav>
                            <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-slate-500 mr-2" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                    {userData?.email || 'Admin'}
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
        <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''} font-sans antialiased`}>
            <MobileSidebar />
            <aside className="hidden md:flex md:w-20 lg:w-24 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex-col items-center py-6 space-y-5 shadow-sm flex-shrink-0">
                <div className="p-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex-shrink-0"><BuildingOffice2Icon className="h-7 w-7 lg:h-8 lg:w-8" /></div>
                <nav className="flex flex-col space-y-4 items-center">
                    {sidebarNavItems.map((item) => (<button key={item.name} onClick={item.action} title={item.name} className={`p-3 lg:p-3 rounded-lg transition-colors duration-150 ${item.current ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400'}`}><item.icon className="h-6 w-6 lg:h-7 lg:w-7" /><span className="sr-only">{item.name}</span></button>))}
                </nav>
                <div className="mt-auto flex flex-col items-center space-y-4"><ThemeToggle theme={theme} toggleTheme={toggleTheme} /><button onClick={handleLogout} title="Logout" className="p-3 lg:p-3 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-700/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"><ArrowLeftOnRectangleIcon className="h-6 w-6 lg:h-7 lg:w-7" /><span className="sr-only">Logout</span></button></div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 flex-shrink-0">
                    <div className="flex items-center">
                        <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden mr-3 -ml-1 p-2 rounded-md text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"><Bars3Icon className="h-6 w-6"/><span className="sr-only">Open sidebar</span></button>
                        {viewMode === 'createPost' ? (
                            <button
                                onClick={() => setViewMode('dashboard')}
                                className="flex items-center text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                                <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Back to Dashboard</h1>
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
                            <PostCreation
                                onSend={async (postData) => {
                                    if (!selectedOrg) return;
                                    
                                    try {
                                        const formData = new FormData();
                                        formData.append('content', postData.content);
                                        formData.append('postType', postData.postType);
                                        formData.append('organizationId', selectedOrg._id);
                                        
                                        // Append media files if any
                                        if (postData.media && postData.media.length > 0) {
                                            postData.media.forEach((media) => {
                                                formData.append('media', media.file);
                                            });
                                        }
                                        
                                        const response = await api.post('/posts', formData, {
                                            headers: {
                                                'Content-Type': 'multipart/form-data'
                                            }
                                        });
                                        
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
                                    }
                                }}
                                placeholder="Share your thoughts..."
                                buttonText="Create Post"
                                showHeader={false}
                                showRegionDepartment={true}
                                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg"
                                postTypes={['feedback', 'complaint', 'suggestion', 'public']}
                            />
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
                             <motion.div key="loading-initial" {...fadeInUp} className="text-center py-20"> <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <p className="text-gray-600 dark:text-slate-400">Loading organizations...</p> </motion.div>
                        ) : !selectedOrg && organizations.length === 0 && !loading.orgList ? (
                            <motion.div key="no-orgs-message" {...fadeInUp}> <DashboardCard className="p-6"><div className="text-center py-10"><FolderOpenIcon className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4"/><h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-2">No Organizations Found</h3><p className="text-gray-600 dark:text-slate-400 mb-4">Get started by adding your first organization.</p> <button onClick={handleOpenAddOrgModal} className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900"><PlusIcon className="h-5 w-5" /> <span>Add Organization</span></button></div></DashboardCard> </motion.div>
                        ): !selectedOrg && organizations.length > 0 && !loading.orgList ? (
                             <motion.div key="select-org-prompt" {...fadeInUp}> <DashboardCard className="p-6"><div className="text-center py-10"><MagnifyingGlassIcon className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4"/><h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-2">Welcome, Admin!</h3><p className="text-gray-600 dark:text-slate-400">Please select an organization from the "Manage Orgs" menu or add a new one to view details.</p></div></DashboardCard> </motion.div>
                        ) : selectedOrg ? (
                            <motion.div key={selectedOrg._id} className="space-y-6 md:space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-y-3 gap-x-4"><div><h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-50">{selectedOrg.name}</h2><p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">ID: <code className="text-xs bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded">{selectedOrg._id}</code> | Created: {new Date(selectedOrg.createdAt).toLocaleDateString()}</p></div><div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0"><button onClick={handleOpenEditParamsModal} title="Edit Verification Parameters" className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md text-xs sm:text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-slate-950 transition-colors"><PencilSquareIcon className="h-4 w-4"/> <span>Edit Params</span></button></div></div>
                                <DashboardCard className="p-4 sm:p-6"><h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-3">Verification Parameters</h3>{(selectedOrg.verificationFields && selectedOrg.verificationFields.length > 0) ? (<ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-300">{selectedOrg.verificationFields.map((param, i) => <li key={i}>{param}</li>)}</ul>) : ( <NothingToShow message="No verification parameters set." /> )}</DashboardCard>
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
                                                        <span className={`inline-block px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium tracking-wide ${
                                                            post.postType === 'feedback' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' :
                                                            post.postType === 'complaint' ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300' :
                                                            post.postType === 'suggestion' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' :
                                                            'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                                                        }`}>
                                                            {post.postType}
                                                        </span>
                                                        <button 
                                                            onClick={() => handleDeletePost(post._id, post.content)} 
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
                                                    
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-700 pt-1.5 sm:pt-2 mt-1.5 sm:mt-2 flex flex-wrap gap-x-2 gap-y-1">
                                                        <span>By: {post.createdBy || 'Anonymous'}</span>
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
                                                                    count={count || 0}
                                                                    postId={post._id}
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
        <Modal isOpen={isManageOrgModalOpen} onClose={() => setIsManageOrgModalOpen(false)} title="Manage Organizations" size="max-w-2xl">{/* ... Manage Orgs Modal Content ... */ loading.orgList ? (<div className="text-center py-10"><p className="text-gray-600 dark:text-slate-400">Loading organizations...</p></div>) : organizations.length === 0 ? (<NothingToShow message="No organizations to manage. Add one first." />) : (<div className="space-y-3"><p className="text-sm text-gray-600 dark:text-slate-400">Select an organization to view details or delete.</p><ul className="divide-y divide-gray-200 dark:divide-slate-700 max-h-[60vh] overflow-y-auto custom-scrollbar -mx-1 pr-1">{organizations.map((org) => (<li key={org._id} className={`p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-md transition-colors ${selectedOrg?._id === org._id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}><div className="flex items-center justify-between space-x-3"><div className="flex-1 min-w-0"><button onClick={() => { selectOrganization(org); setIsManageOrgModalOpen(false); }} className="text-left w-full group"><p className={`text-sm font-medium truncate ${selectedOrg?._id === org._id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>{org.name}</p><p className="text-xs text-gray-500 dark:text-slate-400 truncate">ID: {org._id} | Created: {new Date(org.createdAt).toLocaleDateString()}</p></button></div><button onClick={() => initiateDeleteOrganization(org)} disabled={loading.deleteOrg?.[org._id]} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-700/30 disabled:opacity-50" title="Delete Organization">{loading.deleteOrg?.[org._id] ? <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg> : <TrashIcon className="h-4 w-4" />}</button></div></li>))}</ul></div>)}<div className="mt-6 flex justify-end"><button type="button" onClick={() => setIsManageOrgModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800">Close</button></div></Modal>
        <Modal isOpen={isDeleteConfirmModalOpen} onClose={() => { setIsDeleteConfirmModalOpen(false); setOrgToDelete(null);}} title={`Delete ${orgToDelete?.name || 'Organization'}`}>{/* ... Delete Org Confirmation Modal Content ... */}<div className="space-y-4"><p className="text-sm text-gray-700 dark:text-slate-300">This action is permanent and will delete all associated posts. To confirm, type the organization's name (<strong className="font-semibold text-red-600 dark:text-red-400">{orgToDelete?.name}</strong>) and enter your account password.</p><div><label htmlFor="orgNameConfirmDel" className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center"><IdentificationIcon className="h-4 w-4 mr-1 text-gray-400 dark:text-slate-500"/> Type organization name</label><input type="text" id="orgNameConfirmDel" value={deleteOrgNameConfirm} onChange={(e) => setDeleteOrgNameConfirm(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-red-500 focus:border-red-500 disabled:opacity-50" placeholder={orgToDelete?.name || ''} disabled={loading.deleteOrg?.[orgToDelete?._id]} /></div><div><label htmlFor="passwordConfirmDel" className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center"><LockClosedIcon className="h-4 w-4 mr-1 text-gray-400 dark:text-slate-500"/> Your Password</label><input type="password" id="passwordConfirmDel" value={deletePasswordConfirm} onChange={(e) => setDeletePasswordConfirm(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-red-500 focus:border-red-500 disabled:opacity-50" placeholder="Enter your account password" disabled={loading.deleteOrg?.[orgToDelete?._id]} /></div> {error.modal && ( <p className="text-sm text-red-600 dark:text-red-400 flex items-center"> <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0"/> {error.modal}</p> )} <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-slate-700 mt-5"><button type="button" onClick={() => { setIsDeleteConfirmModalOpen(false); setOrgToDelete(null); }} disabled={loading.deleteOrg?.[orgToDelete?._id]} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50">Cancel</button><button type="button" onClick={handleConfirmDeleteOrg} disabled={loading.deleteOrg?.[orgToDelete?._id] || !deletePasswordConfirm || deleteOrgNameConfirm !== orgToDelete?.name} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:bg-red-400 flex items-center justify-center min-w-[140px]">{loading.deleteOrg?.[orgToDelete?._id] ? ( <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : 'Confirm Delete'}</button></div></div></Modal>
        </>
    );
};

// --- Reaction Button Component ---
const ReactionButton = ({ type, count, postId, commentId = null }) => {
  const [isReacted, setIsReacted] = useState(false);
  const [currentCount, setCurrentCount] = useState(count);
  const [isLoading, setIsLoading] = useState(false);
  const orgId = localStorage.getItem('orgId');

  // Fetch reaction status on mount and when postId/commentId/type changes
  useEffect(() => {
    const fetchReactionStatus = async () => {
      if (!orgId) return;
      
      try {
        const storedToken = localStorage.getItem('token');
        const endpoint = commentId 
          ? `/posts/${orgId}/${postId}/comments/${commentId}/reactions`
          : `/posts/${orgId}/${postId}/reactions`;

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
        // Fallback to the non-org specific endpoint if the org-specific one fails
        if (error.response?.status === 404) {
          try {
            const storedToken = localStorage.getItem('token');
            const fallbackEndpoint = commentId 
              ? `/posts/${postId}/comments/${commentId}/reactions`
              : `/posts/${postId}/reactions`;

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
            console.error('Fallback endpoint also failed:', fallbackError);
          }
        }
      }
    };

    fetchReactionStatus();
  }, [postId, commentId, type, orgId]);

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
        ? `/posts/${orgId || ''}/${postId}/comments/${commentId}/reactions`
        : `/posts/${orgId || ''}/${postId}/reactions`;

      // First try with orgId in the path
      try {
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
        if (error.response?.status === 404 && orgId) {
          // If the org-specific endpoint fails, try the non-org specific endpoint
          const fallbackEndpoint = commentId 
            ? `/posts/${postId}/comments/${commentId}/reactions`
            : `/posts/${postId}/reactions`;

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
        }
        throw error; // Re-throw the error if we couldn't handle it
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
    switch(type) {
      case 'like': return <HandThumbUpIcon className="h-5 w-5" />;
      case 'love': return <HeartIcon className="h-5 w-5 text-red-500" />;
      case 'laugh': return <EmojiHappyIcon className="h-5 w-5 text-yellow-500" />;
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
      title={isReacted ? `You reacted with ${type}` : `React with ${type}`}
      disabled={isLoading}
    >
      {getIcon()}
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
      
      console.log('Fetching comments for post:', postId, 'in org:', orgId);
      
      try {
        // First, get all posts for the organization
        const response = await api.get(`/posts/${orgId}`);
        
        if (!response.data) {
          throw new Error('No data received from server');
        }
        
        // Handle different response formats
        let posts = [];
        if (Array.isArray(response.data)) {
          posts = response.data;
        } else if (response.data.posts && Array.isArray(response.data.posts)) {
          posts = response.data.posts;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          posts = response.data.data;
        }
        
        // Find the specific post by ID
        const post = posts.find(p => p._id === postId);
        
        if (!post) {
          throw new Error('Post not found');
        }
        
        // Get comments from the post
        const updatedComments = Array.isArray(post.comments) ? post.comments : [];
        console.log('Fetched comments:', updatedComments);
        
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
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        throw new Error('No authentication token found');
      }

      // Post the comment
      const response = await api.post(
        `/posts/${postId}/comments`,
        { text: commentText },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedToken}`
          }
        }
      );

      // Refresh comments after successful submission
      await fetchPostWithComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      setError(error.response?.data?.message || 'Failed to post comment');
      // Restore the comment text if there was an error
      setNewComment(commentText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!commentId || isLoading) return;
    
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        throw new Error('No authentication token found');
      }

      await api.delete(`/posts/${postId}/comments/${commentId}`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });

      // Refresh comments after successful deletion
      await fetchPostWithComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(error.response?.data?.message || 'Failed to delete comment');
    } finally {
      setIsLoading(false);
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

      {localComments.map(comment => (
        <div key={comment._id} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium dark:text-white">
                Anonymous
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => handleCommentDelete(comment._id)}
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
      ))}
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

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.3, ease: "easeOut" } };


export default AdminDashboard;