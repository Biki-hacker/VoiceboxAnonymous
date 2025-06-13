import { useState, useEffect, useCallback } from 'react';
import { decryptPost, decryptPosts, decryptComment } from '../utils/crypto';

/**
 * Custom hook to handle decryption of encrypted content
 * @returns {Object} - Object containing decryption functions
 */
export const useDecryption = () => {
  // State to track if decryption is in progress
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState(null);

  // Memoize decryption functions to prevent unnecessary re-renders
  const decryptSinglePost = useCallback(async (post) => {
    if (!post) return post;
    
    setIsDecrypting(true);
    setError(null);
    
    try {
      return await decryptPost(post);
    } catch (err) {
      console.error('Error in decryptSinglePost:', err);
      setError('Failed to decrypt post');
      return post; // Return original post if decryption fails
    } finally {
      setIsDecrypting(false);
    }
  }, []);

  const decryptMultiplePosts = useCallback(async (posts) => {
    if (!Array.isArray(posts)) return [];
    
    setIsDecrypting(true);
    setError(null);
    
    try {
      return await decryptPosts(posts);
    } catch (err) {
      console.error('Error in decryptMultiplePosts:', err);
      setError('Failed to decrypt posts');
      return posts; // Return original posts if decryption fails
    } finally {
      setIsDecrypting(false);
    }
  }, []);

  const decryptSingleComment = useCallback(async (comment) => {
    if (!comment) return comment;
    
    setIsDecrypting(true);
    setError(null);
    
    try {
      return await decryptComment(comment);
    } catch (err) {
      console.error('Error in decryptSingleComment:', err);
      setError('Failed to decrypt comment');
      return comment; // Return original comment if decryption fails
    } finally {
      setIsDecrypting(false);
    }
  }, []);

  return {
    isDecrypting,
    error,
    decryptPost: decryptSinglePost,
    decryptPosts: decryptMultiplePosts,
    decryptComment: decryptSingleComment,
  };
};

export default useDecryption;
