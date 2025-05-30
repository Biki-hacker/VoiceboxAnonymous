import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * A reusable deletion confirmation dialog component.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when closing the dialog
 * @param {string} props.title - Title of the dialog
 * @param {string} props.itemType - Type of item being deleted (e.g., 'post', 'comment', 'organization')
 * @param {string} [props.itemPreview] - Preview of the item being deleted (optional)
 * @param {boolean} [props.isDeleting] - Whether the deletion is in progress
 * @param {Function} props.onConfirm - Function to call when confirming deletion
 * @param {string} [props.confirmButtonText='Delete'] - Text for the confirm button
 * @param {string} [props.cancelButtonText='Cancel'] - Text for the cancel button
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {JSX.Element} The DeletionConfirmation component
 */
const DeletionConfirmation = ({
  isOpen,
  onClose,
  title = 'Confirm Deletion',
  itemType = 'item',
  itemPreview,
  isDeleting = false,
  onConfirm,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className="relative z-50" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity" />
      
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center">
          {/* Modal panel */}
          <div className="relative transform overflow-hidden rounded-xl bg-white dark:bg-slate-800 text-left shadow-2xl transition-all sm:my-8 w-full max-w-md">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6">
              <p className="text-gray-600 dark:text-slate-300">
                Are you sure you want to delete this {itemType}? This action cannot be undone.
              </p>
              
              {itemPreview && (
                <div className="mt-4 flex rounded-md overflow-hidden border border-gray-200 dark:border-slate-700">
                  <div className="w-1 bg-red-600"></div>
                  <div className="bg-gray-50 dark:bg-slate-800/50 p-3 flex-1">
                    <p className="text-sm text-gray-800 dark:text-slate-200 italic">
                      "{itemPreview.length > 100 ? `${itemPreview.substring(0, 100)}...` : itemPreview}"
                    </p>
                  </div>
                </div>
              )}
              
              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:opacity-50"
                >
                  {cancelButtonText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 dark:focus:ring-offset-slate-800 disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    confirmButtonText
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletionConfirmation;
