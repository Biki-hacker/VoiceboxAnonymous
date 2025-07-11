import React, { useState, useEffect } from 'react';
import { 
  HandThumbUpIcon, 
  HeartIcon, 
  FaceSmileIcon, 
  FaceFrownIcon 
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as HandThumbUpIconSolid, 
  HeartIcon as HeartIconSolid,
  FaceSmileIcon as FaceSmileIconSolid,
  FaceFrownIcon as FaceFrownIconSolid
} from '@heroicons/react/24/solid';
import { api } from '../../utils/axios';

const ReactionButton = ({ 
  type, 
  count, 
  postId, 
  commentId = null, 
  organizationId = null,
  onReactionUpdate,
  size = 'md',
  className = ''
}) => {
  const [isReacted, setIsReacted] = useState(false);
  const [currentCount, setCurrentCount] = useState(count || 0);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize reaction state
  useEffect(() => {
    const fetchReactionStatus = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/posts/${postId}${commentId ? `/comments/${commentId}` : ''}/reactions`);
        
        // Handle the backend response format
        if (response.data && response.data.success && response.data.data) {
          const reactions = response.data.data;
          const reactionData = reactions[type];
          
          if (reactionData) {
            setIsReacted(reactionData.hasReacted || false);
            setCurrentCount(reactionData.count || 0);
          } else {
            setIsReacted(false);
            setCurrentCount(0);
          }
        } else {
          // Fallback for different response formats
          setIsReacted(false);
          setCurrentCount(count || 0);
        }
      } catch (error) {
        console.error('Error fetching reaction status:', error);
        // Fallback to props
        setIsReacted(false);
        setCurrentCount(count || 0);
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchReactionStatus();
    }
  }, [postId, commentId, type, count]);

  const handleReaction = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      const endpoint = commentId 
        ? `/posts/${postId}/comments/${commentId}/reactions`
        : `/posts/${postId}/reactions`;
      
      // Always use POST for toggling reactions (backend handles the toggle logic)
      const response = await api.post(endpoint, { type });
      
      // Update local state based on response
      if (response.data) {
        const newIsReacted = response.data.hasReacted !== undefined ? response.data.hasReacted : !isReacted;
        const newCount = response.data.count !== undefined ? response.data.count : (isReacted ? currentCount - 1 : currentCount + 1);
        
        setIsReacted(newIsReacted);
        setCurrentCount(newCount);
        
        // Notify parent component about the reaction update
        if (onReactionUpdate) {
          onReactionUpdate({
            type,
            postId,
            commentId,
            isReacted: newIsReacted,
            count: newCount
          });
        }
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      // Revert optimistic update on error
      setIsReacted(isReacted);
      setCurrentCount(currentCount);
    } finally {
      setIsLoading(false);
    }
  };

  // Icon and styling based on reaction type
  const getIcon = () => {
    const iconProps = {
      className: `${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`
    };

    switch (type) {
      case 'like':
        return isReacted ? (
          <HandThumbUpIconSolid {...iconProps} className={`${iconProps.className} text-blue-500`} />
        ) : (
          <HandThumbUpIcon {...iconProps} />
        );
      case 'love':
        return isReacted ? (
          <HeartIconSolid {...iconProps} className={`${iconProps.className} text-red-500`} />
        ) : (
          <HeartIcon {...iconProps} />
        );
      case 'laugh':
        return isReacted ? (
          <FaceSmileIconSolid {...iconProps} className={`${iconProps.className} text-yellow-500`} />
        ) : (
          <FaceSmileIcon {...iconProps} />
        );
      case 'angry':
        return isReacted ? (
          <FaceFrownIconSolid {...iconProps} className={`${iconProps.className} text-orange-500`} />
        ) : (
          <FaceFrownIcon {...iconProps} />
        );
      default:
        return null;
    }
  };

  const buttonClasses = `
    flex items-center space-x-1 px-2 py-1 rounded-full text-sm 
    ${isReacted 
      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
      : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
    } 
    ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} 
    transition-colors duration-200 ${className}
  `;

  return (
    <button 
      onClick={handleReaction} 
      className={buttonClasses}
      disabled={isLoading}
      aria-label={`${isReacted ? 'Remove' : 'Add'} ${type} reaction`}
    >
      {getIcon()}
      <span>{currentCount > 0 ? currentCount : ''}</span>
    </button>
  );
};

export default ReactionButton;