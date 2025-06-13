import CryptoJS from 'crypto-js';

// This key should match the one used in the backend
// In a real application, this should be derived from a user's password or session
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'default-encryption-key';
const SALT = process.env.REACT_APP_ENCRYPTION_SALT || 'default-salt-value';

/**
 * Decrypts content that was encrypted on the backend
 * @param {Object|string} data - The encrypted data or a string to decrypt
 * @returns {Promise<string|Object>} - The decrypted content
 */
export const decryptContent = async (data) => {
  try {
    // If data is a string, it's not encrypted
    if (typeof data === 'string') return data;
    
    // If it's an object but not encrypted, return as is
    if (!data || typeof data !== 'object' || !data.iv || !data.content) {
      return data;
    }

    // Decrypt the content using AES
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Hex.parse(data.iv);
    
    const decrypted = CryptoJS.AES.decrypt(
      data.content,
      key,
      { 
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    
    // Convert to UTF-8 string
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    // If decryption fails, return the original data
    return decryptedText || data;
  } catch (error) {
    console.error('Decryption error:', error);
    // Return the original data if decryption fails
    return data;
  }
};

/**
 * Helper function to decrypt post content
 * @param {Object} post - The post object with potentially encrypted content
 * @returns {Promise<Object>} - The post with decrypted content
 */
export const decryptPost = async (post) => {
  if (!post) return post;
  
  try {
    const decryptedPost = { ...post };
    
    // Decrypt post content
    if (post.content && typeof post.content === 'object' && post.content.isEncrypted) {
      decryptedPost.content = await decryptContent(post.content);
    }
    
    // Decrypt comments if they exist
    if (post.comments && Array.isArray(post.comments)) {
      decryptedPost.comments = await Promise.all(
        post.comments.map(async (comment) => {
          if (comment.text && typeof comment.text === 'object' && comment.text.isEncrypted) {
            return {
              ...comment,
              text: await decryptContent(comment.text)
            };
          }
          return comment;
        })
      );
    }
    
    return decryptedPost;
  } catch (error) {
    console.error('Error decrypting post:', error);
    return post;
  }
};

/**
 * Helper function to decrypt an array of posts
 * @param {Array} posts - Array of post objects
 * @returns {Promise<Array>} - Array of posts with decrypted content
 */
export const decryptPosts = async (posts) => {
  if (!Array.isArray(posts)) return [];
  return Promise.all(posts.map(post => decryptPost(post)));
};

/**
 * Helper to decrypt a single comment
 * @param {Object} comment - The comment object with potentially encrypted text
 * @returns {Promise<Object>} - The comment with decrypted text
 */
export const decryptComment = async (comment) => {
  if (!comment) return comment;
  
  try {
    if (comment.text && typeof comment.text === 'object' && comment.text.isEncrypted) {
      return {
        ...comment,
        text: await decryptContent(comment.text)
      };
    }
    return comment;
  } catch (error) {
    console.error('Error decrypting comment:', error);
    return comment;
  }
};

// Export a default object with all the functions
export default {
  decryptContent,
  decryptPost,
  decryptPosts,
  decryptComment
};