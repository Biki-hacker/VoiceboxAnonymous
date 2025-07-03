import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ArrowLeftOnRectangleIcon, Bars3Icon, UserCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

// Theme Toggle Component
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
          <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </motion.div>
    </AnimatePresence>
  </button>
);

const Sidebar = ({
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  sidebarNavItems = [],
  logo: Logo,
  title,
  userEmail,
  theme,
  toggleTheme,
  onLogout,
  viewMode,
  isAdmin = false,
  additionalHeaderContent = null,
}) => {
  return (
    <>
      {/* Mobile Sidebar */}
      <Transition.Root show={isMobileSidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setIsMobileSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600/75 dark:bg-slate-900/75" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-slate-900 pt-5 pb-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                      onClick={() => setIsMobileSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>

                <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                  {Logo && <Logo className="h-8 w-8 text-blue-600 dark:text-blue-500" />}
                  <span className="ml-2 text-xl font-semibold text-gray-800 dark:text-slate-100">
                    {title}
                  </span>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-2">
                  <div className="space-y-1">
                    {sidebarNavItems.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => {
                          item.action();
                          setIsMobileSidebarOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </button>
                    ))}
                  </div>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-slate-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                        Anonymous Employee
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                      <button
                        onClick={onLogout}
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

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-20 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex-col items-center py-6 flex-shrink-0 shadow-sm">
        <div className="p-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white">
          {Logo && <Logo className="h-7 w-7 md:h-8" />}
        </div>

        <nav className="flex-1 flex flex-col items-center justify-between py-4 w-full">
          <div className="flex flex-col items-center w-full gap-4 flex-grow">
            {sidebarNavItems.map((item, idx) => (
              <button
                key={item.name}
                onClick={item.action}
                title={item.name}
                className={`p-3 rounded-lg w-full flex items-center justify-center transition-colors duration-150 ${
                  item.current 
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                style={{ minHeight: 48 }}
              >
                <item.icon className="h-6 w-6" />
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-auto flex flex-col items-center space-y-5">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <button
            onClick={onLogout}
            title="Sign out"
            className="p-3 lg:p-3 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-700/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6 lg:h-7 lg:w-7" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;