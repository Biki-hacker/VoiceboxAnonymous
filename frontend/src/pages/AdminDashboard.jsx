// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useMemo, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios'; // Your axios instance
import { supabase } from '../supabaseClient'; // ** Import Supabase client **
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Listbox, Transition } from '@headlessui/react';
import {
    BuildingOffice2Icon, ChartBarIcon, DocumentTextIcon, PlusIcon, ArrowLeftOnRectangleIcon,
    UserCircleIcon, BellIcon, ChevronDownIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon,
    TagIcon, MapPinIcon, BuildingLibraryIcon, NoSymbolIcon, ExclamationCircleIcon, XMarkIcon,
    CheckCircleIcon, ExclamationTriangleIcon, SunIcon, MoonIcon, CheckIcon, ChevronUpDownIcon, LockClosedIcon, IdentificationIcon
} from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Theme Hook ---
const useTheme = () => {
    const [theme, setThemeState] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
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
    return [theme, toggleTheme];
};


// --- Reusable Modal Component (Dark Mode Aware) ---
const Modal = ({ isOpen, onClose, title, children }) => { // ... Modal component remains the same ...
    if (!isOpen) return null;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -20 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h3><button onClick={onClose} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700" aria-label="Close modal"><XMarkIcon className="h-6 w-6" /></button></div>
                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">{children}</div>
            </motion.div>
        </motion.div>
    );
};

// --- Helper Components (Dark Mode Aware) ---
const NothingToShow = ({ message = "Nothing to show" }) => ( // ... NothingToShow component remains the same ...
    <div className="text-center py-8 px-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg my-4 border border-gray-200 dark:border-slate-700"> <NoSymbolIcon className="h-10 w-10 text-gray-400 dark:text-slate-500 mx-auto mb-3" /> <p className="text-sm text-gray-500 dark:text-slate-400">{message}</p> </div>
);
const DashboardCard = ({ children, className = "" }) => ( // ... DashboardCard component remains the same ...
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden ${className}`}> {children} </motion.div>
);

// --- Custom Select Component using Headless UI (Dark Mode Aware) ---
const CustomSelect = ({ value, onChange, options, label, icon: Icon, disabled = false }) => {
    const selectedOption = options.find(opt => opt.value === value) || options[0];
    return (
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <div className="relative w-40">
            <Listbox.Label className="flex items-center text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
              {Icon && <Icon className="h-4 w-4 mr-1 text-gray-400 dark:text-slate-500" />}
              {label}
            </Listbox.Label>
            <Listbox.Button
              className={`relative w-full cursor-default rounded-md py-3 pl-3 pr-10 text-left text-sm 
              bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 shadow-sm 
              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition 
              duration-150 ease-in-out ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="block truncate text-gray-900 dark:text-slate-100">
                {selectedOption.label || 'Select'}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-slate-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-700 
                py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm custom-scrollbar"
              >
                {options.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                          : 'text-gray-900 dark:text-slate-100'
                      }`
                    }
                    value={option.value}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                          {option.label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
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
const ThemeToggle = ({ theme, toggleTheme }) => ( // ... ThemeToggle component remains the same ...
    <button onClick={toggleTheme} className="relative inline-flex items-center justify-center w-10 h-10 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900 transition-all duration-200" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}> <AnimatePresence initial={false} mode="wait"> <motion.div key={theme === 'dark' ? 'moon' : 'sun'} initial={{ y: -20, opacity: 0, rotate: -90 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: 20, opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}> {theme === 'dark' ? ( <SunIcon className="h-6 w-6 text-yellow-400" /> ) : ( <MoonIcon className="h-6 w-6 text-blue-500" /> )} </motion.div> </AnimatePresence> </button>
);

// --- Main Dashboard Component ---
const AdminDashboard = () => {
    // --- State Variables ---
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [stats, setStats] = useState([]);
    const [posts, setPosts] = useState([]);
    const [selectedType, setSelectedType] = useState('all');
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [loading, setLoading] = useState({ orgList: true, orgDetails: false, modal: false });
    const [error, setError] = useState({ page: null, modal: null });
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);
    const [isEditParamsModalOpen, setIsEditParamsModalOpen] = useState(false);
    const [isDeleteOrgModalOpen, setIsDeleteOrgModalOpen] = useState(false);
    const [newOrgName, setNewOrgName] = useState("");
    const [verificationParamsInput, setVerificationParamsInput] = useState("");
    const [deleteOrgNameConfirm, setDeleteOrgNameConfirm] = useState("");
    const [deletePasswordConfirm, setDeletePasswordConfirm] = useState("");
    const [theme, toggleTheme] = useTheme();

    // --- Effects ---
    useEffect(() => { // Auth Effect
        const storedEmail = localStorage.getItem('email');
        const storedRole = localStorage.getItem('role');
        if (!storedEmail || !storedRole || storedRole !== 'admin') { navigate('/signin', { state: { message: 'Admin access required' } }); return; }
        setUserData({ email: storedEmail, role: storedRole });
        api.get('/auth/verify-status', { params: { email: storedEmail } }).catch(err => console.error('User verification failed:', err));
    }, [navigate]);

    useEffect(() => { // Org Fetch Effect
        if (!userData) return;
        setLoading(prev => ({ ...prev, orgList: true }));
        setError(prev => ({ ...prev, page: null }));
        api.get('/organizations/by-admin', { params: { email: userData.email } })
            .then(res => {
                const sortedOrgs = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrganizations(sortedOrgs);
                // Select first org only if none is currently selected and list is not empty
                if (!selectedOrg && sortedOrgs.length > 0) { selectOrganization(sortedOrgs[0]); }
                else if (sortedOrgs.length === 0) { setSelectedOrg(null); setLoading(prev => ({...prev, orgDetails: false})); }
            })
            .catch(err => { console.error('Error loading organizations:', err); setError(prev => ({ ...prev, page: 'Failed to load organizations.' })); })
            .finally(() => { setLoading(prev => ({ ...prev, orgList: false })); });
    }, [userData]); // Removed selectedOrg and selectOrganization from dependencies

    // --- Organization Selection ---
    const selectOrganization = useCallback((org) => { // Org Select Callback
        if (!org) return;
        // Allow re-selection if needed (e.g., to refresh data)
        // if (selectedOrg?._id === org._id) return; // Can uncomment if re-selection is undesirable

        setSelectedOrg(org);
        setLoading(prev => ({ ...prev, orgDetails: true }));
        setError(prev => ({ ...prev, page: null }));
        setStats([]); setPosts([]);
        Promise.all([ api.get(`/posts/stats/${org._id}`), api.get(`/posts/${org._id}`) ])
            .then(([statsRes, postsRes]) => {
                setStats(statsRes.data);
                setPosts(postsRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            })
            .catch(err => { console.error(`Error fetching data for ${org.name}:`, err); setError(prev => ({ ...prev, page: `Failed to load details for ${org.name}.` })); })
            .finally(() => { setLoading(prev => ({ ...prev, orgDetails: false })); });
    }, []); // Empty dependency array is usually fine for callbacks that don't depend on changing state/props

    // --- Memoized Data ---
    const filteredPosts = useMemo(() => { // Filtered Posts Memo
        return posts.filter(post => (selectedType === 'all' || post.postType === selectedType) && (selectedRegion === 'all' || post.region === selectedRegion) && (selectedDepartment === 'all' || post.department === selectedDepartment));
    }, [posts, selectedType, selectedRegion, selectedDepartment]);
    const uniqueRegions = useMemo(() => [...new Set(posts.map(p => p.region).filter(Boolean))], [posts]);
    const uniqueDepartments = useMemo(() => [...new Set(posts.map(p => p.department).filter(Boolean))], [posts]);
    const typeOptions = [ { value: 'all', label: 'All Types' }, { value: 'feedback', label: 'Feedback' }, { value: 'complaint', label: 'Complaint' }, { value: 'suggestion', label: 'Suggestion' }, { value: 'public', label: 'Public' } ];
    const regionOptions = useMemo(() => [ { value: 'all', label: 'All Regions' }, ...uniqueRegions.map(r => ({ value: r, label: r })) ], [uniqueRegions]);
    const departmentOptions = useMemo(() => [ { value: 'all', label: 'All Departments' }, ...uniqueDepartments.map(d => ({ value: d, label: d })) ], [uniqueDepartments]);

    // --- Chart Config (Theme Aware) ---
    const chartData = useMemo(() => ({ /* ... Chart data logic ... */
        labels: stats.map(s => s._id.charAt(0).toUpperCase() + s._id.slice(1)),
        datasets: [{ label: 'Post Count', data: stats.map(s => s.count), backgroundColor: theme === 'dark' ? ['#374151','#4B5563','#52525B','#3F3F46','#44403C','#5B21B6'] : ['#BFDBFE','#FECACA','#A5F3FC','#FED7AA','#DDD6FE','#E9D5FF'], borderColor: theme === 'dark' ? '#4B5563' : '#E5E7EB', borderWidth: 1, hoverBackgroundColor: theme === 'dark' ? ['#4B5563','#52525B','#71717A','#52525B','#57534E','#6D28D9'] : ['#93C5FD','#FCA5A5','#67E8F9','#FDBA74','#C4B5FD','#D8B4FE'], }],
    }), [stats, theme]);
    const commonChartOptions = useMemo(() => ({ /* ... Chart options logic ... */
        responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: theme === 'dark' ? '#D1D5DB' : '#4B5563', padding: 20, font: { size: 12 } } }, title: { display: true, color: theme === 'dark' ? '#F3F4F6' : '#111827', font: { size: 16, weight: '600' }, padding: { bottom: 15 } }, tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.75)', titleColor: '#FFFFFF', bodyColor: '#F3F4F6', padding: 10, cornerRadius: 4, } }, scales: { y: { beginAtZero: true, grid: { color: theme === 'dark' ? 'rgba(200, 200, 200, 0.1)' : '#E5E7EB' }, ticks: { color: theme === 'dark' ? '#9CA3AF' : '#6B7280' } }, x: { grid: { display: false }, ticks: { color: theme === 'dark' ? '#9CA3AF' : '#6B7280' } } }
    }), [theme]);
    const barChartOptions = useMemo(() => ({ ...commonChartOptions, plugins: { ...commonChartOptions.plugins, title: { ...commonChartOptions.plugins.title, text: 'Post Count by Type' } } }), [commonChartOptions]);
    const pieChartOptions = useMemo(() => ({ ...commonChartOptions, plugins: { ...commonChartOptions.plugins, title: { ...commonChartOptions.plugins.title, text: 'Post Type Distribution' } } }), [commonChartOptions]);


    // --- Modal Action Handlers ---
    const handleOpenAddOrgModal = () => { setNewOrgName(""); setError(prev => ({ ...prev, modal: null })); setIsAddOrgModalOpen(true); };
    const handleConfirmAddOrg = () => { /* ... Add Org logic remains same ... */
        if (!newOrgName.trim() || !userData) { setError(prev => ({ ...prev, modal: "Organization name cannot be empty." })); return; }
        setLoading(prev => ({ ...prev, modal: true })); setError(prev => ({ ...prev, modal: null }));
        api.post('/organizations', { name: newOrgName.trim(), adminEmail: userData.email })
            .then(res => { const newOrg = res.data; const updatedOrgs = [newOrg, ...organizations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); setOrganizations(updatedOrgs); selectOrganization(newOrg); setIsAddOrgModalOpen(false); })
            .catch(err => { console.error('Error creating organization:', err); setError(prev => ({ ...prev, modal: err.response?.data?.message || 'Failed to create organization.' })); })
            .finally(() => { setLoading(prev => ({ ...prev, modal: false })); });
    };
    const handleOpenEditParamsModal = () => { /* ... Edit Params open logic remains same ... */
        if (!selectedOrg) return; const currentFields = selectedOrg.verificationFields || []; setVerificationParamsInput(currentFields.join(', ')); setError(prev => ({ ...prev, modal: null })); setIsEditParamsModalOpen(true);
    };
    const handleConfirmEditParams = () => { /* ... Edit Params confirm logic remains same ... */
        if (!selectedOrg) return; const fields = verificationParamsInput.split(',').map(f => f.trim()).filter(Boolean); setLoading(prev => ({ ...prev, modal: true })); setError(prev => ({ ...prev, modal: null }));
        api.patch(`/organizations/${selectedOrg._id}`, { verificationFields: fields })
            .then(() => { const updatedOrg = { ...selectedOrg, verificationFields: fields }; setSelectedOrg(updatedOrg); setOrganizations(orgs => orgs.map(o => o._id === updatedOrg._id ? updatedOrg : o)); setIsEditParamsModalOpen(false); })
            .catch(err => { console.error('Error updating parameters:', err); setError(prev => ({ ...prev, modal: err.response?.data?.message || 'Failed to update parameters.' })); })
            .finally(() => { setLoading(prev => ({ ...prev, modal: false })); });
    };
    const handleOpenDeleteOrgModal = () => { /* ... Delete Org open logic remains same ... */
        if (!selectedOrg) return; setDeleteOrgNameConfirm(""); setDeletePasswordConfirm(""); setError(prev => ({ ...prev, modal: null })); setIsDeleteOrgModalOpen(true);
    };

    // --- Enhanced Delete Org Confirmation (DEBUGGED) ---
    const handleConfirmDeleteOrg = async () => {
        if (!selectedOrg || !userData) return;
        setError(prev => ({ ...prev, modal: null }));

        // 1. Validate Org Name
        if (deleteOrgNameConfirm !== selectedOrg.name) {
            setError(prev => ({ ...prev, modal: `Incorrect organization name. Please type "${selectedOrg.name}".` }));
            return;
        }
        // 2. Validate Password Input
        if (!deletePasswordConfirm) {
            setError(prev => ({ ...prev, modal: "Password is required." }));
            return;
        }

        setLoading(prev => ({ ...prev, modal: true }));
        let passwordVerified = false; // Flag to track verification step

        try {
            // 3. Verify Password with Supabase
            console.log("Verifying password for:", userData.email); // DEBUG LOG
            const { error: passwordVerifyError } = await supabase.auth.signInWithPassword({
                email: userData.email,
                password: deletePasswordConfirm
            });

            if (passwordVerifyError) {
                console.error("Supabase password verification error:", passwordVerifyError); // DEBUG LOG
                // Let the catch block handle this specifically
                throw new Error("PASSWORD_VERIFICATION_FAILED: " + passwordVerifyError.message);
            }

            console.log("Password verified successfully."); // DEBUG LOG
            passwordVerified = true; // Mark verification as successful

            // 4. Delete Organization (only if password verified)
            console.log("Attempting to delete organization:", selectedOrg._id); // DEBUG LOG
            await api.delete(`/organizations/${selectedOrg._id}`);
            console.log("Organization deleted successfully via API."); // DEBUG LOG

            // 5. Update State on Success
            const currentSelectedId = selectedOrg._id;
            const remainingOrgs = organizations.filter(o => o._id !== currentSelectedId);
            setOrganizations(remainingOrgs);
            setSelectedOrg(null);
            setPosts([]);
            setStats([]);
            setError(prev => ({...prev, page: null}));
            setIsDeleteOrgModalOpen(false);
            if (remainingOrgs.length > 0) {
                selectOrganization(remainingOrgs[0]);
            }
             // Add success toast?

        } catch (err) {
            console.error('Error during organization deletion process:', err); // Log the caught error object
            // DEBUG LOG: Log specific parts if available
            if (err.response) {
                console.error("Axios error response:", err.response.data);
            } else {
                console.error("Caught error message:", err.message);
            }

            // Check if the error originated from our explicit password check throw
            if (err.message?.startsWith("PASSWORD_VERIFICATION_FAILED")) {
                 setError(prev => ({ ...prev, modal: 'Incorrect password.' })); // Provide user-friendly message
            }
            // Check if the error is from the Axios delete call
            else if (passwordVerified && err.response) {
                // Password was okay, but deletion failed, use backend message if available
                setError(prev => ({ ...prev, modal: err.response.data?.message || 'Failed to delete organization. Please try again.' }));
            }
             // Check for network errors or other issues during deletion
            else if (passwordVerified && !err.response) {
                 setError(prev => ({ ...prev, modal: 'Network error or server unavailable during deletion. Please try again.' }));
            }
            // Catch-all for unexpected errors
            else {
                 setError(prev => ({ ...prev, modal: 'An unexpected error occurred. Please try again.' }));
            }
        } finally {
            setLoading(prev => ({ ...prev, modal: false }));
            setDeletePasswordConfirm(""); // Clear password field after attempt
        }
    };

    // --- Other Action Handlers ---
    const handleDeletePost = (postId, postContent) => { /* ... Delete Post logic remains same ... */
        if (!selectedOrg || !window.confirm(`Delete this post?\n"${postContent.substring(0, 50)}..."`)) return;
        api.delete(`/posts/${postId}`)
            .then(() => { setPosts(prev => prev.filter(p => p._id !== postId)); api.get(`/posts/stats/${selectedOrg._id}`).then(statsRes => setStats(statsRes.data)).catch(err => console.error("Error refreshing stats:", err)); })
            .catch(err => { console.error('Error deleting post:', err); setError(prev => ({ ...prev, page: 'Failed to delete post.' })); });
    };
    const handleLogout = () => { /* ... Logout logic remains same ... */
        localStorage.removeItem('email'); localStorage.removeItem('role'); navigate('/signin');
    };

    // --- Component Render ---
    return (
        <>
        {/* Main Layout Div (handles dark class) */}
        <div className={`flex h-screen ${theme === 'dark' ? 'dark' : ''} font-sans antialiased`}>
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col shadow-sm flex-shrink-0">
                {/* ... Sidebar Content (unchanged) ... */}
                <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0"><BuildingOffice2Icon className="h-7 w-7 text-blue-600 mr-2" /><span className="text-xl font-semibold text-gray-800 dark:text-slate-100">Admin</span></div>
                <div className="p-4 flex-shrink-0"><button onClick={handleOpenAddOrgModal} disabled={loading.orgList} className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900 disabled:opacity-60"><PlusIcon className="h-5 w-5" /> <span>New Organization</span></button></div>
                <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 custom-scrollbar"><h3 className="px-2 pt-2 pb-1 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Organizations</h3> {loading.orgList && organizations.length === 0 ? (<p className="text-sm text-gray-500 dark:text-slate-400 px-2 py-4">Loading...</p>) : !loading.orgList && organizations.length === 0 ? (<p className="text-sm text-gray-500 dark:text-slate-400 px-2 py-4">No organizations found.</p>) : ( organizations.map(org => ( <a key={org._id} href="#" onClick={(e) => { e.preventDefault(); selectOrganization(org); }} className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium group transition-colors duration-150 ${ selectedOrg?._id === org._id ? 'bg-gray-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100' }`}> <BuildingLibraryIcon className={`h-5 w-5 mr-3 flex-shrink-0 ${selectedOrg?._id === org._id ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-500 dark:group-hover:text-slate-400'}`} /> <span className="truncate">{org.name}</span> </a> )) )} </nav>
                <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex-shrink-0"><button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-slate-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900"><ArrowLeftOnRectangleIcon className="h-5 w-5" /> <span>Log Out</span></button></div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
                {/* Top Bar */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
                    {/* ... Top Bar Content (unchanged) ... */}
                    <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Dashboard</h1>
                    <div className="flex items-center space-x-4"><div className="flex items-center space-x-2"><UserCircleIcon className="h-7 w-7 text-gray-400 dark:text-slate-500"/><span className="text-sm font-medium text-gray-700 dark:text-slate-300 hidden sm:block">{userData?.email}</span></div><ThemeToggle theme={theme} toggleTheme={toggleTheme} /></div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {/* ... Page Error Display (unchanged) ... */}
                     {error.page && !loading.orgDetails && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg text-sm flex items-center"><ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0"/> {error.page}</motion.div> )}

                    {/* Main Content Rendering Logic */}
                    <AnimatePresence mode="wait">
                        {loading.orgDetails ? ( /* ... Loading state unchanged ... */
                             <motion.div key="loading-details" className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}> <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <p className="text-gray-600 dark:text-slate-400">Loading details...</p> </motion.div>
                        ) : !selectedOrg && !loading.orgList ? ( /* ... No selection state unchanged ... */
                            <motion.div key="no-selection-initial" {...fadeInUp}> <DashboardCard className="p-6"><div className="text-center py-10"><MagnifyingGlassIcon className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4"/><h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-2">Welcome, {userData?.email}!</h3><p className="text-gray-600 dark:text-slate-400">{organizations.length === 0 ? 'Create your first organization.' : 'Select an organization.'}</p></div></DashboardCard> </motion.div>
                        ) : selectedOrg ? (
                            // Selected Org Content
                            <motion.div key={selectedOrg._id} className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                {/* Org Header & Actions (unchanged except delete handler) */}
                                <div className="flex flex-wrap justify-between items-start gap-y-3 gap-x-4"><div><h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50">{selectedOrg.name}</h2><p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">ID: <code className="text-xs bg-gray-100 dark:bg-slate-700 px-1 rounded">{selectedOrg._id}</code> | Created: {new Date(selectedOrg.createdAt).toLocaleDateString()}</p></div><div className="flex items-center space-x-3 flex-shrink-0"><button onClick={handleOpenEditParamsModal} title="Edit Verification Parameters" className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-slate-950 transition-colors"><PencilSquareIcon className="h-4 w-4"/> <span>Edit Params</span></button><button onClick={handleOpenDeleteOrgModal} title="Delete Organization" className="flex items-center justify-center px-2.5 py-1.5 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-md text-sm text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-slate-950 transition-colors"><TrashIcon className="h-4 w-4"/> <span className="sr-only">Delete Organization</span></button></div></div>
                                {/* Verification Parameters Card (unchanged) */}
                                <DashboardCard className="p-6"><h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-3">Verification Parameters</h3>{(selectedOrg.verificationFields && selectedOrg.verificationFields.length > 0) ? (<ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-slate-300 text-sm">{selectedOrg.verificationFields.map((param, i) => <li key={i}>{param}</li>)}</ul>) : ( <NothingToShow message="No verification parameters set." /> )}</DashboardCard>
                                {/* Statistics Section (unchanged) */}
                                <DashboardCard className="p-6"><h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4">Post Statistics</h3>{stats.length === 0 && !loading.orgDetails ? ( <NothingToShow message="No post statistics available yet." /> ) : stats.length > 0 ? (<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[350px]"><div className="lg:col-span-3 h-[350px]"> <Bar data={chartData} options={barChartOptions} /> </div><div className="lg:col-span-2 h-[350px] flex items-center justify-center"> <Pie data={chartData} options={pieChartOptions} /> </div></div>) : null }</DashboardCard>
                                {/* Posts Section (unchanged) */}
                                <DashboardCard className="p-6"><h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4">Posts Overview</h3><div className="mb-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-md border border-gray-200 dark:border-slate-700"><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"><CustomSelect label="Type" value={selectedType} onChange={setSelectedType} options={typeOptions} icon={TagIcon} /><CustomSelect label="Region" value={selectedRegion} onChange={setSelectedRegion} options={regionOptions} icon={MapPinIcon} disabled={uniqueRegions.length === 0} /><CustomSelect label="Department" value={selectedDepartment} onChange={setSelectedDepartment} options={departmentOptions} icon={BuildingLibraryIcon} disabled={uniqueDepartments.length === 0} /></div></div>{filteredPosts.length === 0 && !loading.orgDetails ? ( <NothingToShow message={posts.length === 0 ? "No posts found." : "No posts match filters."} /> ) : filteredPosts.length > 0 ? (<div className="space-y-4">{filteredPosts.map((post, i) => ( <motion.div key={post._id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-slate-700/50 transition-shadow duration-200" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}><div className="flex justify-between items-start mb-2"><span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${ post.postType === 'feedback' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : post.postType === 'complaint' ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300' : post.postType === 'suggestion' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'}`}>{post.postType}</span><button onClick={() => handleDeletePost(post._id, post.content)} className="text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-500 transition-colors" title="Delete Post"><TrashIcon className="h-4 w-4" /></button></div><p className="text-sm text-gray-800 dark:text-slate-200 mb-3 whitespace-pre-wrap">{post.content}</p><div className="text-xs text-gray-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-700 pt-2 mt-2"><span>By: {post.createdBy || 'Anonymous'} | </span><span>{new Date(post.createdAt).toLocaleString()} | </span><span>Region: {post.region || 'N/A'} | </span><span>Dept: {post.department || 'N/A'}</span></div></motion.div> ))}</div>) : null }</DashboardCard>
                            </motion.div>
                        ) : null }
                    </AnimatePresence>
                </main>
            </div>
        </div>

        {/* --- Modals (unchanged definitions, but used by updated handlers) --- */}
        <Modal isOpen={isAddOrgModalOpen} onClose={() => setIsAddOrgModalOpen(false)} title="Add New Organization">{/* ... Add Org Modal Content ... */}<div className="space-y-4"><div><label htmlFor="orgName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Organization Name</label><input type="text" id="orgName" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50" placeholder="Enter organization name" disabled={loading.modal} /></div> {error.modal && ( <p className="text-sm text-red-600 dark:text-red-400 flex items-center"> <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0"/> {error.modal}</p> )} <div className="flex justify-end space-x-3 pt-2"><button type="button" onClick={() => setIsAddOrgModalOpen(false)} disabled={loading.modal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50">Cancel</button><button type="button" onClick={handleConfirmAddOrg} disabled={loading.modal || !newOrgName.trim()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 flex items-center justify-center min-w-[80px]">{loading.modal ? ( <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : 'Add'}</button></div></div></Modal>
        <Modal isOpen={isEditParamsModalOpen} onClose={() => setIsEditParamsModalOpen(false)} title={`Edit Parameters for ${selectedOrg?.name || ''}`}>{/* ... Edit Params Modal Content ... */}<div className="space-y-4"><div><label htmlFor="verifParams" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Verification Fields (comma-separated)</label><textarea id="verifParams" rows="3" value={verificationParamsInput} onChange={(e) => setVerificationParamsInput(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50" placeholder="e.g., employeeId, department, location" disabled={loading.modal} /><p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Enter fields required for employee verification, separated by commas.</p></div> {error.modal && ( <p className="text-sm text-red-600 dark:text-red-400 flex items-center"> <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0"/> {error.modal}</p> )} <div className="flex justify-end space-x-3 pt-2"><button type="button" onClick={() => setIsEditParamsModalOpen(false)} disabled={loading.modal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50">Cancel</button><button type="button" onClick={handleConfirmEditParams} disabled={loading.modal} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 flex items-center justify-center min-w-[120px]">{loading.modal ? ( <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : 'Save Changes'}</button></div></div></Modal>
        <Modal isOpen={isDeleteOrgModalOpen} onClose={() => setIsDeleteOrgModalOpen(false)} title={`Delete Organization`}>{/* ... Delete Org Modal Content ... */}<div className="space-y-4"><p className="text-sm text-gray-700 dark:text-slate-300">This action is permanent. To confirm deletion, type the organization's name (<strong className="font-semibold">{selectedOrg?.name}</strong>) and enter your password.</p><div><label htmlFor="orgNameConfirm" className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center"><IdentificationIcon className="h-4 w-4 mr-1 text-gray-400 dark:text-slate-500"/> Type the organization name</label><input type="text" id="orgNameConfirm" value={deleteOrgNameConfirm} onChange={(e) => setDeleteOrgNameConfirm(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-red-500 focus:border-red-500 disabled:opacity-50" placeholder={selectedOrg?.name || ''} disabled={loading.modal} /></div><div><label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center"><LockClosedIcon className="h-4 w-4 mr-1 text-gray-400 dark:text-slate-500"/> Your Password</label><input type="password" id="passwordConfirm" value={deletePasswordConfirm} onChange={(e) => setDeletePasswordConfirm(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-red-500 focus:border-red-500 disabled:opacity-50" placeholder="Enter your account password" disabled={loading.modal} /></div> {error.modal && ( <p className="text-sm text-red-600 dark:text-red-400 flex items-center"> <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0"/> {error.modal}</p> )} <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-slate-700 mt-5"><button type="button" onClick={() => setIsDeleteOrgModalOpen(false)} disabled={loading.modal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50">Cancel</button><button type="button" onClick={handleConfirmDeleteOrg} disabled={loading.modal || !deletePasswordConfirm || deleteOrgNameConfirm !== selectedOrg?.name} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:bg-red-400 flex items-center justify-center min-w-[140px]">{loading.modal ? ( <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : 'Confirm Delete'}</button></div></div></Modal>

        </>
    );
};

// Animation Variant
const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.3, ease: "easeOut" } };

export default AdminDashboard;