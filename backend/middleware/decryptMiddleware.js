const { decrypt, decryptContent } = require('../utils/cryptoUtils');

// Middleware to decrypt content in API responses
const decryptResponseMiddleware = async (req, res, next) => {
  const originalJson = res.json;
  
  res.json = async function(data) {
    try {
      // Only decrypt if the response contains post or comment data
      if (data && (data.post || data.comments || Array.isArray(data) || data.comment)) {
        // Handle single post
        if (data.post) {
          data.post = await decryptContent(data.post);
        }
        
        // Handle array of posts
        if (Array.isArray(data)) {
          data = await decryptContent(data);
        }
        
        // Handle single comment
        if (data.comment) {
          if (data.comment.text && typeof data.comment.text === 'object' && data.comment.text.isEncrypted) {
            data.comment.text = await decrypt(data.comment.text);
          }
        }
        
        // Handle comments in post
        if (data.post && data.post.comments) {
          data.post.comments = await Promise.all(
            data.post.comments.map(async comment => {
              if (comment.text && typeof comment.text === 'object' && comment.text.isEncrypted) {
                return {
                  ...comment,
                  text: await decrypt(comment.text)
                };
              }
              return comment;
            })
          );
        }
      }
      
      // Call the original json method
      originalJson.call(this, data);
    } catch (error) {
      console.error('Error in decryptResponseMiddleware:', error);
      // If decryption fails, send the original data
      originalJson.call(this, data);
    }
  };
  
  next();
};

module.exports = decryptResponseMiddleware;