import { useState, useEffect, useCallback, useRef } from 'react';
import { decryptContent } from './crypto';
import { api } from './axios';

// Helper function to decrypt post content and comments
const decryptPost = (post) => {
  try {
    // Decrypt post content if it's encrypted
    const decryptedContent = post.content?.isEncrypted 
      ? decryptContent(post.content) 
      : post.content;

    // Decrypt comments
    const decryptedComments = post.comments?.map(comment => ({
      ...comment,
      text: comment.text?.isEncrypted 
        ? decryptContent(comment.text) 
        : comment.text
    })) || [];

    return {
      ...post,
      content: decryptedContent,
      comments: decryptedComments
    };
  } catch (error) {
    console.error('Error decrypting post:', error);
    return post; // Return original post if decryption fails
  }
};

// Helper function to update reactions in a post or comment
const updateReactions = (items, entityId, reactionsSummary) => {
  return items.map(item => {
    if (item._id === entityId) {
      return { ...item, reactions: reactionsSummary };
    }
    // Handle nested comments
    if (item.comments) {
      return {
        ...item,
        comments: updateReactions(item.comments, entityId, reactionsSummary)
      };
    }
    return item;
  });
};

/**
 * Custom hook to manage posts with WebSocket updates
 * @param {string} organizationId - Current organization ID
 * @param {boolean} isAdmin - Whether the current user is an admin
 * @returns {object} Posts state and related functions
 */
export const usePosts = (organizationId, isAdmin = false) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const organizationIdRef = useRef(organizationId);

  // Fetch posts from the API
  const fetchPosts = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/api/posts/organization/${organizationId}`);
      setPosts(response.data.map(decryptPost));
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!organizationId || organizationId === organizationIdRef.current) return;
    
    const wsUrl = process.env.REACT_APP_WS_URL || `ws://${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    organizationIdRef.current = organizationId;

    ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'POST_CREATED':
            if (message.organization === organizationId) {
              setPosts(prev => [decryptPost(message.payload), ...prev]);
            }
            break;
            
          case 'POST_UPDATED':
            if (message.organization === organizationId) {
              setPosts(prev => 
                prev.map(post => 
                  post._id === message.payload._id ? decryptPost(message.payload) : post
                )
              );
            }
            break;
            
          case 'POST_DELETED':
            if (message.organizationId === organizationId) {
              setPosts(prev => prev.filter(post => post._id !== message.postId));
            }
            break;
            
          case 'COMMENT_CREATED':
          case 'COMMENT_UPDATED':
            if (message.organizationId === organizationId) {
              setPosts(prev => 
                prev.map(post => 
                  post._id === message.postId
                    ? {
                        ...post,
                        comments: message.type === 'COMMENT_CREATED'
                          ? [decryptPost(message.comment), ...(post.comments || [])]
                          : (post.comments || []).map(comment =>
                              comment._id === message.comment._id
                                ? decryptPost(message.comment)
                                : comment
                            )
                      }
                    : post
                )
              );
            }
            break;
            
          case 'COMMENT_DELETED':
            if (message.organizationId === organizationId) {
              setPosts(prev =>
                prev.map(post =>
                  post._id === message.postId
                    ? {
                        ...post,
                        comments: (post.comments || []).filter(
                          comment => comment._id !== message.commentId
                        )
                      }
                    : post
                )
              );
            }
            break;
            
          case 'REACTION_UPDATED':
            if (message.organizationId === organizationId) {
              setPosts(prev => {
                const updatedPosts = [...prev];
                const postIndex = updatedPosts.findIndex(p => p._id === message.postId);
                
                if (postIndex !== -1) {
                  const post = updatedPosts[postIndex];
                  
                  if (message.entityType === 'post') {
                    // Update post reactions
                    updatedPosts[postIndex] = {
                      ...post,
                      reactions: message.reactionsSummary
                    };
                  } else if (message.entityType === 'comment') {
                    // Update comment reactions
                    updatedPosts[postIndex] = {
                      ...post,
                      comments: updateReactions(
                        post.comments || [],
                        message.entityId,
                        message.reactionsSummary
                      )
                    };
                  }
                }
                
                return updatedPosts;
              });
            }
            break;
            
          default:
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [organizationId]);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Function to add a new post
  const addPost = useCallback(async (postData) => {
    try {
      const response = await api.post('/api/posts', postData);
      const newPost = decryptPost(response.data);
      setPosts(prev => [newPost, ...prev]);
      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }, []);

  // Function to update a post
  const updatePost = useCallback(async (postId, updateData) => {
    try {
      const response = await api.put(`/api/posts/${postId}`, updateData);
      const updatedPost = decryptPost(response.data);
      setPosts(prev => 
        prev.map(post => (post._id === postId ? updatedPost : post))
      );
      return updatedPost;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }, []);

  // Function to delete a post
  const deletePost = useCallback(async (postId) => {
    try {
      await api.delete(`/api/posts/${postId}`);
      setPosts(prev => prev.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }, []);

  // Function to add a comment
  const addComment = useCallback(async (postId, commentData) => {
    try {
      const response = await api.post(
        `/api/posts/${postId}/comments`,
        commentData
      );
      const newComment = {
        ...response.data,
        text: decryptContent(response.data.text)
      };
      
      setPosts(prev =>
        prev.map(post =>
          post._id === postId
            ? {
                ...post,
                comments: [newComment, ...(post.comments || [])]
              }
            : post
        )
      );
      
      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }, []);

  // Function to update a comment
  const updateComment = useCallback(async (postId, commentId, updateData) => {
    try {
      const response = await api.put(
        `/api/posts/${postId}/comments/${commentId}`,
        updateData
      );
      
      const updatedComment = {
        ...response.data,
        text: response.data.text?.isEncrypted
          ? decryptContent(response.data.text)
          : response.data.text
      };
      
      setPosts(prev =>
        prev.map(post =>
          post._id === postId
            ? {
                ...post,
                comments: (post.comments || []).map(comment =>
                  comment._id === commentId ? updatedComment : comment
                )
              }
            : post
        )
      );
      
      return updatedComment;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }, []);

  // Function to delete a comment
  const deleteComment = useCallback(async (postId, commentId) => {
    try {
      await api.delete(`/api/posts/${postId}/comments/${commentId}`);
      
      setPosts(prev =>
        prev.map(post =>
          post._id === postId
            ? {
                ...post,
                comments: (post.comments || []).filter(
                  comment => comment._id !== commentId
                )
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }, []);

  // Function to update reactions
  const updateReaction = useCallback(async (entityType, entityId, postId, reactionType) => {
    try {
      const response = await api.post(
        `/api/reactions/${entityType}/${entityId}`,
        { reactionType }
      );
      
      // The WebSocket will handle the state update
      return response.data;
    } catch (error) {
      console.error('Error updating reaction:', error);
      throw error;
    }
  }, []);

  return {
    posts,
    loading,
    error,
    fetchPosts,
    addPost,
    updatePost,
    deletePost,
    addComment,
    updateComment,
    deleteComment,
    updateReaction
  };
};

/**
 * Hook to handle post reactions
 * @param {string} userId - Current user ID
 * @param {function} onReaction - Callback when a reaction is updated
 * @returns {object} Reaction handlers
 */
export const usePostReactions = (userId, onReaction) => {
  const handleReaction = useCallback(async (entityType, entityId, postId, reactionType) => {
    try {
      await onReaction(entityType, entityId, postId, reactionType);
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  }, [onReaction]);

  // Check if the user has reacted with a specific reaction type
  const hasReacted = useCallback((reactions, userId, reactionType) => {
    if (!reactions || !reactions[reactionType]) return false;
    return reactions[reactionType].users?.includes(userId) || false;
  }, []);

  return {
    handleReaction,
    hasReacted
  };
};

/**
 * Hook to handle post comments
 * @param {function} onAddComment - Callback when a comment is added
 * @param {function} onUpdateComment - Callback when a comment is updated
 * @param {function} onDeleteComment - Callback when a comment is deleted
 * @returns {object} Comment handlers
 */
export const usePostComments = (onAddComment, onUpdateComment, onDeleteComment) => {
  const handleAddComment = useCallback(async (postId, content) => {
    try {
      await onAddComment(postId, { text: content });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }, [onAddComment]);

  const handleUpdateComment = useCallback(async (postId, commentId, content) => {
    try {
      await onUpdateComment(postId, commentId, { text: content });
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }, [onUpdateComment]);

  const handleDeleteComment = useCallback(async (postId, commentId) => {
    try {
      await onDeleteComment(postId, commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }, [onDeleteComment]);

  return {
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment
  };
};

/**
 * Hook to handle post CRUD operations
 * @param {function} onAddPost - Callback when a post is added
 * @param {function} onUpdatePost - Callback when a post is updated
 * @param {function} onDeletePost - Callback when a post is deleted
 * @returns {object} Post handlers
 */
export const usePostActions = (onAddPost, onUpdatePost, onDeletePost) => {
  const handleAddPost = useCallback(async (postData) => {
    try {
      const newPost = await onAddPost(postData);
      return newPost;
    } catch (error) {
      console.error('Error adding post:', error);
      throw error;
    }
  }, [onAddPost]);

  const handleUpdatePost = useCallback(async (postId, updateData) => {
    try {
      const updatedPost = await onUpdatePost(postId, updateData);
      return updatedPost;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }, [onUpdatePost]);

  const handleDeletePost = useCallback(async (postId) => {
    try {
      await onDeletePost(postId);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }, [onDeletePost]);

  return {
    handleAddPost,
    handleUpdatePost,
    handleDeletePost
  };
};
