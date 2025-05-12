// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BuildingOffice2Icon, ChartBarIcon, DocumentTextIcon, PlusIcon, ArrowLeftOnRectangleIcon,
    UserCircleIcon, BellIcon, ChevronDownIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon, TagIcon, MapPinIcon, BuildingLibraryIcon, NoSymbolIcon, ExclamationCircleIcon
} from '@heroicons/react/24/outline'; // Using outline icons like Contra

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Helper: Component for empty states within cards
const NothingToShow = ({ message = "Nothing to show" }) => (
    <div className="text-center py-8 px-4 bg-gray-50 rounded-lg my-4 border border-gray-200">
        <NoSymbolIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{message}</p>
    </div>
);

// Helper: Card Component
const DashboardCard = ({ children, className = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 ${className}`}
    >
        {children}
    </motion.div>
);


const AdminDashboard = () => {
    // State variables (similar to before)
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [stats, setStats] = useState([]);
    const [posts, setPosts] = useState([]);
    const [selectedType, setSelectedType] = useState('all');
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [loading, setLoading] = useState({ orgList: true, orgDetails: false }); // More granular loading
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);

    // --- Authentication and Initial Data Fetch ---
    useEffect(() => {
        const storedEmail = localStorage.getItem('email');
        const storedRole = localStorage.getItem('role');
        if (!storedEmail || !storedRole || storedRole !== 'admin') {
            navigate('/signin', { state: { message: 'Admin access required' } });
            return;
        }
        setUserData({ email: storedEmail, role: storedRole });

        // Verify status - basic check, doesn't block UI immediately
        api.get('/auth/verify-status', { params: { email: storedEmail } })
           .catch(err => {
                console.error('User verification failed:', err);
                // Don't redirect immediately, maybe show a banner?
                // For now, just log it, rely on subsequent API calls failing if auth is bad
           });
    }, [navigate]);

    useEffect(() => {
        if (!userData) return; // Wait for user data

        setLoading(prev => ({ ...prev, orgList: true }));
        api.get('/organizations/by-admin', { params: { email: userData.email } })
            .then(res => {
                const sortedOrgs = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrganizations(sortedOrgs);
                if (sortedOrgs.length > 0) {
                    selectOrganization(sortedOrgs[0]); // Select the first org by default
                }
            })
            .catch(err => {
                console.error('Error loading organizations:', err);
                setError('Failed to load organizations.');
            })
            .finally(() => {
                 setLoading(prev => ({ ...prev, orgList: false }));
            });
    }, [userData]); // Dependency on userData

    // --- Organization Selection and Data Fetching ---
    const selectOrganization = (org) => {
        if (!org || selectedOrg?._id === org._id) return; // Avoid re-selecting or selecting null

        setSelectedOrg(org);
        setLoading(prev => ({ ...prev, orgDetails: true }));
        setError(null); // Clear previous org-specific errors
        setStats([]); // Clear previous data
        setPosts([]);

        Promise.all([
            api.get(`/posts/stats/${org._id}`),
            api.get(`/posts/${org._id}`)
        ])
            .then(([statsRes, postsRes]) => {
                setStats(statsRes.data);
                setPosts(postsRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            })
            .catch(err => {
                console.error(`Error fetching data for ${org.name}:`, err);
                setError(`Failed to load details for ${org.name}.`);
                setSelectedOrg(null); // De-select org on error? Or keep it selected but show error? Keep selected for now.
            })
            .finally(() => {
                setLoading(prev => ({ ...prev, orgDetails: false }));
            });
    };

    // --- Memoized Data for Filtering and Charts ---
    const filteredPosts = useMemo(() => posts.filter(post => {
        return (selectedType === 'all' || post.postType === selectedType) &&
               (selectedRegion === 'all' || post.region === selectedRegion) &&
               (selectedDepartment === 'all' || post.department === selectedDepartment);
    }), [posts, selectedType, selectedRegion, selectedDepartment]);

    const uniqueRegions = useMemo(() => [...new Set(posts.map(p => p.region).filter(Boolean))], [posts]);
    const uniqueDepartments = useMemo(() => [...new Set(posts.map(p => p.department).filter(Boolean))], [posts]);

    // Chart data and options adapted for light theme
    const chartData = useMemo(() => ({
        labels: stats.map(s => s._id.charAt(0).toUpperCase() + s._id.slice(1)),
        datasets: [
            {
                label: 'Post Count',
                data: stats.map(s => s.count),
                backgroundColor: [ // Lighter, Contra-like colors (adjust as needed)
                    '#BFDBFE', // blue-200
                    '#FECACA', // red-200
                    '#A5F3FC', // cyan-200
                    '#FED7AA', // orange-200
                    '#DDD6FE', // violet-200
                    '#E9D5FF', // purple-200
                 ],
                borderColor: '#E5E7EB', // gray-200
                borderWidth: 1,
                hoverBackgroundColor: [
                    '#93C5FD', // blue-300
                    '#FCA5A5', // red-300
                    '#67E8F9', // cyan-300
                    '#FDBA74', // orange-300
                    '#C4B5FD', // violet-300
                    '#D8B4FE', // purple-300
                 ],
            },
        ],
    }), [stats]);

    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#4B5563', // gray-600
                    padding: 20,
                    font: { size: 12 }
                }
            },
            title: {
                display: true,
                color: '#111827', // gray-900
                font: { size: 16, weight: '600' },
                padding: { bottom: 15 }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                titleColor: '#FFFFFF',
                bodyColor: '#F3F4F6', // gray-100
                padding: 10,
                cornerRadius: 4,
            }
        },
        scales: { // Only relevant for Bar chart really
            y: {
                beginAtZero: true,
                grid: { color: '#E5E7EB' }, // gray-200
                ticks: { color: '#6B7280' } // gray-500
            },
            x: {
                grid: { display: false },
                ticks: { color: '#6B7280' } // gray-500
            }
        }
    };

    const barChartOptions = { ...commonChartOptions, plugins: { ...commonChartOptions.plugins, title: { ...commonChartOptions.plugins.title, text: 'Post Count by Type' } } };
    const pieChartOptions = { ...commonChartOptions, plugins: { ...commonChartOptions.plugins, title: { ...commonChartOptions.plugins.title, text: 'Post Type Distribution' } } };

    // --- Action Handlers ---
    const handleAddCompany = () => {
        const name = prompt('Enter organization name:');
        if (!name || !userData) return;
        // Consider using a modal instead of prompt for better UX later
        setLoading(prev => ({ ...prev, orgList: true })); // Indicate loading while adding
        api.post('/organizations', { name, adminEmail: userData.email })
            .then(res => {
                const newOrg = res.data;
                const updatedOrgs = [newOrg, ...organizations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrganizations(updatedOrgs);
                selectOrganization(newOrg); // Select the newly added org
                alert('Organization created successfully!'); // Replace with toast later
            })
            .catch(err => {
                console.error('Error creating organization:', err);
                alert('Failed to create organization: ' + (err.response?.data?.message || 'Please try again.'));
            })
            .finally(() => {
                 setLoading(prev => ({ ...prev, orgList: false }));
            });
    };

     const handleEditVerificationParams = () => {
        if (!selectedOrg) return;
        const currentFields = selectedOrg.verificationFields || [];
        const fieldsStr = prompt(`Enter required verification fields for ${selectedOrg.name} (comma-separated):`, currentFields.join(', '));
        if (fieldsStr === null) return;
        const fields = fieldsStr.split(',').map(f => f.trim()).filter(Boolean);
        api.patch(`/organizations/${selectedOrg._id}`, { verificationFields: fields })
            .then(() => {
                // Update state locally for immediate feedback
                const updatedOrg = { ...selectedOrg, verificationFields: fields };
                setSelectedOrg(updatedOrg);
                setOrganizations(orgs => orgs.map(o => o._id === updatedOrg._id ? updatedOrg : o));
                alert('Verification parameters updated.');
            })
            .catch(err => {
                console.error('Error updating verification parameters:', err);
                alert('Failed to update parameters: ' + (err.response?.data?.message || 'Please try again.'));
            });
    };

    const handleDeleteOrganization = () => {
         if (!selectedOrg || !window.confirm(`DELETE "${selectedOrg.name}"?\nThis action is permanent and will delete all associated posts.`)) return;
         setLoading(prev => ({ ...prev, orgList: true, orgDetails: true })); // Indicate global loading
         api.delete(`/organizations/${selectedOrg._id}`)
            .then(() => {
                const remainingOrgs = organizations.filter(o => o._id !== selectedOrg._id);
                setOrganizations(remainingOrgs);
                setSelectedOrg(null); // De-select
                setPosts([]);
                setStats([]);
                if (remainingOrgs.length > 0) {
                    selectOrganization(remainingOrgs[0]); // Select the next org
                }
                alert(`Organization "${selectedOrg.name}" deleted.`);
            })
            .catch(err => {
                console.error('Error deleting organization:', err);
                alert('Failed to delete organization: ' + (err.response?.data?.message || 'Please try again.'));
            })
             .finally(() => {
                 // Reset loading states based on whether an org is selected now
                 const orgSelected = organizations.filter(o => o._id !== selectedOrg?._id).length > 0;
                 setLoading({ orgList: false, orgDetails: !orgSelected });
             });
     };

    // Simplified Add Test Post - consider a dedicated modal later
    const handleAddTestPost = () => {
        if (!selectedOrg || !userData) return;
        const content = prompt(`Add a test post for ${selectedOrg.name}:`);
        if (!content) return;
        const postType = prompt('Type (feedback, complaint, suggestion, public):', 'feedback');
        if (!postType || !['feedback', 'complaint', 'suggestion', 'public'].includes(postType)) {
            alert('Invalid type.'); return;
        }
        // Add region/dept prompts if needed

        api.post('/posts', {
            organizationId: selectedOrg._id,
            postType,
            content,
            createdBy: userData.email // Simplified attribution
        })
        .then(res => {
            setPosts(prev => [res.data, ...prev].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
            api.get(`/posts/stats/${selectedOrg._id}`).then(statsRes => setStats(statsRes.data)); // Refresh stats
            alert('Test post added.');
        })
        .catch(err => {
            console.error('Error creating post:', err);
            alert('Failed to add post: ' + (err.response?.data?.message || 'Please try again.'));
        });
    };

    const handleDeletePost = (postId, postContent) => {
        if (!selectedOrg || !window.confirm(`Delete this post?\n"${postContent.substring(0, 50)}..."`)) return;
        api.delete(`/posts/${postId}`)
            .then(() => {
                setPosts(prev => prev.filter(p => p._id !== postId));
                api.get(`/posts/stats/${selectedOrg._id}`).then(statsRes => setStats(statsRes.data)); // Refresh stats
                alert('Post deleted.');
            })
            .catch(err => {
                console.error('Error deleting post:', err);
                alert('Failed to delete post: ' + (err.response?.data?.message || 'Please try again.'));
            });
    };


    const handleLogout = () => {
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        navigate('/signin');
    };

    // --- Component Render ---
    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
                {/* Sidebar Header/Logo Area */}
                 <div className="h-16 flex items-center px-4 border-b border-gray-200">
                     {/* Replace with actual logo if available */}
                     <BuildingOffice2Icon className="h-8 w-8 text-blue-600 mr-2" />
                    <span className="text-xl font-semibold text-gray-800">Org Admin</span>
                </div>

                {/* Add Org Button */}
                <div className="p-4">
                    <button
                        onClick={handleAddCompany}
                        disabled={loading.orgList}
                        className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-60"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>New Organization</span>
                    </button>
                </div>

                {/* Organizations List */}
                <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
                     <h3 className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Organizations
                    </h3>
                    {loading.orgList && organizations.length === 0 ? (
                        <p className="text-sm text-gray-500 px-2 py-4">Loading...</p>
                    ) : !loading.orgList && organizations.length === 0 ? (
                        <p className="text-sm text-gray-500 px-2 py-4">No organizations found. Click "New Organization" to add one.</p>
                    ) : (
                        organizations.map(org => (
                            <a // Use <a> or <button> for semantics
                                key={org._id}
                                href="#" // Prevent page jump
                                onClick={(e) => { e.preventDefault(); selectOrganization(org); }}
                                className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium group transition-colors duration-150 ${
                                    selectedOrg?._id === org._id
                                        ? 'bg-gray-100 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <BuildingLibraryIcon className={`h-5 w-5 mr-3 ${selectedOrg?._id === org._id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                <span className="truncate">{org.name}</span>
                            </a>
                        ))
                    )}
                </nav>

                 {/* Sidebar Footer - Settings/Logout */}
                 <div className="p-4 border-t border-gray-200">
                     {/* Add Settings link if needed later */}
                     <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                    >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                 <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
                     {/* Maybe Breadcrumbs or Title */}
                     <h1 className="text-lg font-semibold text-gray-800">
                         {selectedOrg ? selectedOrg.name : "Dashboard"}
                     </h1>
                     <div className="flex items-center space-x-4">
                         {/* Add notifications, etc. later if needed */}
                         {/* <BellIcon className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer"/> */}
                         <div className="flex items-center space-x-2">
                            <UserCircleIcon className="h-7 w-7 text-gray-400"/>
                             <span className="text-sm font-medium text-gray-700 hidden sm:block">{userData?.email}</span>
                         </div>
                     </div>
                 </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
                     <AnimatePresence mode="wait">
                        {loading.orgDetails ? (
                             <motion.div key="loading" className="text-center py-20"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-gray-600">Loading organization details...</p>
                             </motion.div>
                        ) : error && !selectedOrg ? ( // Global error if no org loading succeeded
                             <motion.div key="global-error" {...fadeInUp}>
                                <DashboardCard className="border-red-200 bg-red-50">
                                    <div className="flex items-center">
                                         <ExclamationCircleIcon className="h-8 w-8 text-red-500 mr-4"/>
                                         <div>
                                             <h3 className="text-lg font-semibold text-red-800">Error</h3>
                                             <p className="text-red-600">{error}</p>
                                         </div>
                                     </div>
                                </DashboardCard>
                             </motion.div>
                        ) : !selectedOrg && !loading.orgList ? ( // No orgs exist or none selected initially
                            <motion.div key="no-selection" {...fadeInUp}>
                                <DashboardCard>
                                    <div className="text-center py-10">
                                         <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                                         <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome, {userData?.email}!</h3>
                                         <p className="text-gray-600">
                                             {organizations.length === 0
                                                ? 'Create your first organization using the button on the left.'
                                                : 'Select an organization from the sidebar to view its details.'
                                             }
                                         </p>
                                     </div>
                                </DashboardCard>
                            </motion.div>
                        ) : selectedOrg ? (
                            // Display content for the selected organization
                            <motion.div key={selectedOrg._id} className="space-y-8">

                                {/* Org Header & Actions */}
                                <div className="flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{selectedOrg.name}</h2>
                                        <p className="text-sm text-gray-500">
                                            ID: <code className="text-xs bg-gray-100 px-1 rounded">{selectedOrg._id}</code> | Created: {new Date(selectedOrg.createdAt).toLocaleDateString()}
                                        </p>
                                        {error && <p className="text-sm text-red-600 mt-1">Error loading details: {error}</p>}
                                    </div>
                                    <div className="flex items-center space-x-3">
                                         <button
                                            onClick={handleEditVerificationParams}
                                            title="Edit Verification Parameters"
                                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                                        >
                                            <PencilSquareIcon className="h-4 w-4"/>
                                            <span>Params</span>
                                        </button>
                                         <button
                                            onClick={handleAddTestPost}
                                             title="Add Test Post"
                                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                                        >
                                             <PlusIcon className="h-4 w-4"/>
                                             <span>Test Post</span>
                                        </button>
                                        <button
                                            onClick={handleDeleteOrganization}
                                             title="Delete Organization"
                                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
                                        >
                                            <TrashIcon className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </div>

                                {/* Verification Parameters Card */}
                                <DashboardCard>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Verification Parameters</h3>
                                    {(selectedOrg.verificationFields && selectedOrg.verificationFields.length > 0) ? (
                                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                                            {selectedOrg.verificationFields.map((param, i) => <li key={i}>{param}</li>)}
                                        </ul>
                                    ) : (
                                        <NothingToShow message="No verification parameters set. Employees can register without checks." />
                                    )}
                                </DashboardCard>

                                {/* Statistics Section */}
                                <DashboardCard>
                                     <h3 className="text-lg font-semibold text-gray-800 mb-4">Post Statistics</h3>
                                     {stats.length === 0 ? (
                                        <NothingToShow message="No post statistics available yet." />
                                     ) : (
                                         <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[350px]">
                                             {/* Bar Chart */}
                                             <div className="lg:col-span-3 h-[350px]">
                                                 <Bar data={chartData} options={barChartOptions} />
                                             </div>
                                             {/* Pie Chart */}
                                             <div className="lg:col-span-2 h-[350px] flex items-center justify-center">
                                                 <Pie data={chartData} options={pieChartOptions} />
                                             </div>
                                         </div>
                                     )}
                                </DashboardCard>


                                {/* Posts Section */}
                                <DashboardCard>
                                     <h3 className="text-lg font-semibold text-gray-800 mb-4">Posts Overview</h3>
                                      {/* Filters */}
                                    <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {[
                                                { value: selectedType, onChange: e => setSelectedType(e.target.value), options: ['all', 'feedback', 'complaint', 'suggestion', 'public'], label: "Type", icon: TagIcon },
                                                { value: selectedRegion, onChange: e => setSelectedRegion(e.target.value), options: ['all', ...uniqueRegions], label: "Region", disabled: uniqueRegions.length === 0, icon: MapPinIcon },
                                                { value: selectedDepartment, onChange: e => setSelectedDepartment(e.target.value), options: ['all', ...uniqueDepartments], label: "Department", disabled: uniqueDepartments.length === 0, icon: BuildingLibraryIcon }
                                            ].map(filter => (
                                                <div key={filter.label}>
                                                    <label className="flex items-center text-xs font-medium text-gray-600 mb-1">
                                                        <filter.icon className="h-3.5 w-3.5 mr-1 text-gray-400"/> {filter.label}
                                                    </label>
                                                    <select
                                                        value={filter.value}
                                                        onChange={filter.onChange}
                                                        disabled={filter.disabled}
                                                        className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {filter.options.map(opt => (
                                                            <option key={opt} value={opt} className="capitalize">
                                                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Posts List */}
                                    {filteredPosts.length === 0 ? (
                                         <NothingToShow message={posts.length === 0 ? "No posts found for this organization." : "No posts match the current filters."} />
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredPosts.map((post, i) => (
                                                <motion.div
                                                    key={post._id}
                                                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.04 }}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                         <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${
                                                            post.postType === 'feedback' ? 'bg-green-100 text-green-800' :
                                                            post.postType === 'complaint' ? 'bg-red-100 text-red-800' :
                                                            post.postType === 'suggestion' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800' // Public
                                                        }`}>
                                                            {post.postType}
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeletePost(post._id, post.content)}
                                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Delete Post"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">{post.content}</p>
                                                    <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                                                         <span>By: {post.createdBy || 'Anonymous'} | </span>
                                                         <span>{new Date(post.createdAt).toLocaleString()} | </span>
                                                         <span>Region: {post.region || 'N/A'} | </span>
                                                         <span>Dept: {post.department || 'N/A'}</span>
                                                    </div>
                                                    {/* Add media display logic if needed */}
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </DashboardCard>

                            </motion.div>
                        ) : null // Should be covered by other states
                        }
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

// Simple fade-in animation variant
const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3, ease: "easeOut" }
};

export default AdminDashboard;