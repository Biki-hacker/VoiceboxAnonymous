import React, { useState } from 'react';
import { PaperAirplaneIcon, XCircleIcon } from '@heroicons/react/24/outline';

const PostCreation = ({
  initialMessage = '',
  placeholder = 'What\'s on your mind?',
  buttonText = 'Post',
  onSend,
  allowAttachments = true,
  maxLength = 1000,
  className = 'mb-6',
  inputClassName = '',
  buttonClassName = '',
  showHeader = false,
  postTypes = ['feedback', 'complaint', 'suggestion', 'public'],
  initialPostType = 'feedback',
  onPostTypeChange = () => {},
  showRegionDepartment = false,
  initialRegion = '',
  initialDepartment = ''
}) => {
  const [message, setMessage] = useState(initialMessage);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [postType, setPostType] = useState(initialPostType);
  const [region, setRegion] = useState(initialRegion);
  const [department, setDepartment] = useState(initialDepartment);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Clear any previous errors
    setError(null);
    
    // Reset the input value to allow selecting the same file again if needed
    e.target.value = '';
    
    // Validate file types and size
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        setError('Only image and video files are allowed');
        return false;
      }
      if (!isValidSize) {
        setError('File size should be less than 5MB');
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Create preview URLs for the valid files
    const newMedia = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video',
      name: file.name,
      size: file.size
    }));

    setMediaUrls(prev => [...prev, ...newMedia]);
  };

  const handleRemoveMedia = (index) => {
    setMediaUrls(prev => {
      const newMedia = [...prev];
      URL.revokeObjectURL(newMedia[index].preview);
      newMedia.splice(index, 1);
      return newMedia;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && mediaUrls.length === 0) {
      setError('Please enter a message or attach a file');
      return;
    }
    
    if (message.length > maxLength) {
      setError(`Message exceeds maximum length of ${maxLength} characters`);
      return;
    }
    
    setError(null);
    
    try {
      // Call the onSend callback with post data
      if (onSend) {
        const postData = {
          content: message.trim(),
          media: mediaUrls,
          postType
        };
        
        if (showRegionDepartment) {
          postData.region = region;
          postData.department = department;
        }
        
        await onSend(postData);
        
        // Only reset the form if the onSend was successful
        setMessage('');
        setMediaUrls([]);
      }
    } catch (err) {
      console.error('Error in form submission:', err);
      setError('Failed to create post. Please try again.');
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {showHeader && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create New Post</h3>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-4">
        {/* Post Type Tabs */}
        <div className="mb-4">
          <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg">
            {postTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setPostType(type);
                  onPostTypeChange(type);
                }}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  postType === type
                    ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-600/50'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white ${inputClassName}`}
            rows={3}
            maxLength={maxLength}
          />
          
          {showRegionDepartment && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <input
                  type="text"
                  placeholder="Region (optional)"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Department (optional)"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          )}
          <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-slate-400">
            <span>{message.length}/{maxLength}</span>
            {error && <span className="text-red-500">{error}</span>}
          </div>
        </div>
        
        {/* Media preview */}
        {mediaUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {mediaUrls.map((media, index) => (
              <div key={index} className="relative group">
                {media.type === 'image' ? (
                  <img
                    src={media.preview}
                    alt={`Preview ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-md"
                  />
                ) : (
                  <video
                    src={media.preview}
                    className="h-20 w-20 object-cover rounded-md"
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(index)}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove media"
                >
                  <XCircleIcon className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          {allowAttachments && (
            <div>
              <input
                type="file"
                id="media-upload"
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,video/*"
                multiple
              />
              <label
                htmlFor="media-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Upload Images or Videos
              </label>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isUploading || (!message.trim() && mediaUrls.length === 0)}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
          >
            {isUploading ? (
              'Sending...'
            ) : (
              <>
                {buttonText}
                <PaperAirplaneIcon className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostCreation;
