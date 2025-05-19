// src/pages/EmployeeDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserCircleIcon, SunIcon, MoonIcon, ArrowLeftOnRectangleIcon,
    PencilSquareIcon, EyeIcon, CheckBadgeIcon, BuildingOfficeIcon, Cog6ToothIcon, PlusCircleIcon
} from '@heroicons/react/24/outline'; // Using outline icons for consistency

// --- Theme Hook (Copied from AdminDashboard for self-containment, or import if centralized) ---
const useTheme = () => {
    const [theme, setThemeState] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
        // Default to system preference or light
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
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
    return [theme, toggleTheme, setTheme]; // Export setTheme for potential direct setting
};

// --- Theme Toggle Button (Copied from AdminDashboard) ---
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
                {theme === 'dark' ? (
                    <SunIcon className="h-6 w-6 text-yellow-400" />
                ) : (
                    <MoonIcon className="h-6 w-6 text-blue-500" />
                )}
            </motion.div>
        </AnimatePresence>
    </button>
);

// --- Dashboard Card Component (Inspired by Contra & AdminDashboard) ---
const ActionCard = ({ title, description, buttonText, onClick, icon: Icon, bgColorClass = "bg-slate-50 dark:bg-slate-800/60", accentColorClass = "text-blue-600 dark:text-blue-400" }) => (
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


const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const [theme, toggleTheme] = useTheme();
    const [employeeEmail, setEmployeeEmail] = useState("anonymous.employee@example.com"); // Placeholder, fetch actual if available

    useEffect(() => {
        // Placeholder: Fetch actual employee data if needed, e.g., for email display
        const storedEmail = localStorage.getItem('employeeEmail'); // Or however you store it
        if (storedEmail) {
            setEmployeeEmail(storedEmail);
        }
        // Ensure user is logged in as an employee
        const role = localStorage.getItem('role');
        if (role !== 'employee') {
            // navigate('/signin', { state: { message: "Access restricted to employees." } });
            console.warn("Accessing employee dashboard without employee role. For dev purposes only.");
        }

    }, [navigate]);


    const handleLogout = () => {
        localStorage.clear(); // Clears all localStorage, adjust if you need to keep some items
        navigate('/signin');
    };

    // Dashboard actions based on Contra's card layout
    const actions = [
        {
            title: "Create New Post",
            description: "Share your feedback, complaints, or suggestions. Tag region & department if needed.",
            buttonText: "Create Post",
            onClick: () => navigate('/employee/create-post'),
            icon: PencilSquareIcon,
            bgColorClass: "bg-blue-50 dark:bg-blue-900/30",
            accentColorClass: "text-blue-600 dark:text-blue-400"
        },
        {
            title: "View My Posts",
            description: "Review and manage the posts you've previously submitted.",
            buttonText: "View Posts",
            onClick: () => navigate('/employee/posts'),
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

    // User details (can be expanded)
    const user = {
        name: "Anonymous Employee", // Or fetch actual name
        avatar: null, // Placeholder for avatar URL
    };


    return (
        <div className={`flex h-screen ${theme === 'dark' ? 'dark' : ''} font-sans antialiased`}>
            {/* Sidebar (Simplified for Employee - can be expanded if more nav items are needed) */}
            <aside className="w-16 md:w-20 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col items-center py-6 space-y-6 flex-shrink-0 shadow-sm">
                {/* Logo Placeholder */}
                <div className="p-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white">
                    <BuildingOfficeIcon className="h-7 w-7 md:h-8 md:h-8" />
                </div>

                {/* Navigation Icons (Example, can map to actions or be static) */}
                <nav className="flex flex-col space-y-5 items-center">
                     {actions.slice(0, 2).map(action => ( // Show first 2 icons as example
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
                {/* Top Bar */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
                    <div className="flex items-center">
                        {/* Breadcrumb or Page Title */}
                        <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Employee Dashboard</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                                <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-slate-500" />
                            )}
                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300 hidden sm:block">
                                {user.name}
                            </span>
                        </div>
                        {/* Theme toggle moved to sidebar for this layout to match Contra's simplicity in top bar */}
                    </div>
                </header>

                {/* Content Body */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
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

                    {/* Action Cards Grid - inspired by Contra's layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {actions.map((action) => (
                            <ActionCard
                                key={action.title}
                                title={action.title}
                                description={action.description}
                                buttonText={action.buttonText}
                                onClick={action.onClick}
                                icon={action.icon}
                                bgColorClass={action.bgColorClass}
                                accentColorClass={action.accentColorClass}
                            />
                        ))}
                         {/* Logout as a card if preferred, or keep in sidebar */}
                        {/* <ActionCard
                            title="Logout"
                            description="Securely sign out of your employee account."
                            buttonText="Logout"
                            onClick={handleLogout}
                            icon={ArrowLeftOnRectangleIcon}
                            bgColorClass="bg-red-50 dark:bg-red-900/20"
                            accentColorClass="text-red-600 dark:text-red-400"
                        /> */}
                    </div>

                     {/* Placeholder for future sections, e.g., recent activity, announcements */}
                     {/* <div className="mt-12">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-200 mb-4">Recent Activity</h3>
                        <div className="p-6 rounded-xl shadow-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                           <p className="text-sm text-gray-500 dark:text-slate-400">No recent activity to display.</p>
                        </div>
                    </div>
                    */}

                </main>
            </div>
        </div>
    );
};

export default EmployeeDashboard;