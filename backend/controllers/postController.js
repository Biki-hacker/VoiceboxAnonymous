// backend/controllers/postController.js
const Post = require('../models/Post');
const Organization = require('../models/Organization');
const mongoose = require('mongoose');
const supabase = require('../utils/supabaseClient');
const { encrypt, decrypt, decryptContent } = require('../utils/cryptoUtils');

exports.createPost = async (req, res) => {
  try {
    let { orgId, postType, content, mediaUrls, region, department, isAnonymous } = req.body;
    
    // Encrypt the content before saving
    if (content && typeof content === 'string') {
      content = await encrypt(content);
    }

    if (!orgId || !postType || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newPost = new Post({
      orgId,
      postType,
      content,
      mediaUrls,
      region,
      department,
      isAnonymous,
      author: req.user._id, // Save the user's ID as the author
      createdByRole: req.user.role, // Save the user's role
      reactions: {
        like: { count: 0, users: [] },
        love: { count: 0, users: [] },
        laugh: { count: 0, users: [] },
        angry: { count: 0, users: [] }
      },
      comments: [] // Initialize comments as an empty array
    });

    await newPost.save();

    const { decryptContent } = require('../utils/cryptoUtils');
    const broadcastMessage = req.app.get('broadcastMessage');
    if (broadcastMessage) {
      // Decrypt post content before broadcasting
      const decryptedPost = await decryptContent(newPost.toObject());
      broadcastMessage({
        type: 'POST_CREATED',
        payload: {
          ...decryptedPost,
          organization: newPost.orgId
        }
      });
    }

    res.status(201).json(newPost);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getPostsByOrg = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { postId } = req.query;
    
    // Check organization access
    const { hasAccess, message } = await checkOrgAccess(req, orgId);
    if (!hasAccess) {
      return res.status(403).json({ message: message || 'Access denied' });
    }

    // If postId is provided, return just that post
    if (postId) {
      const post = await Post.findOne({ _id: postId, orgId })
        .populate('author', 'name role')
        .populate('comments.author', 'name role');
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      return res.status(200).json(post);
    }

    // Otherwise, return all posts for the organization
    const posts = await Post.find({ orgId })
      .sort({ createdAt: -1 })
      .populate('author', 'name role');
      
    res.status(200).json(posts);
  } catch (err) {
    console.error('Fetch posts error:', err);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

// Get reaction status for a post or comment
const getReactionStatus = (reactions, userId) => {
  const status = {};
  Object.keys(reactions).forEach(type => {
    status[type] = {
      count: reactions[type].count,
      hasReacted: reactions[type].users.some(id => id.equals(userId))
    };
  });
  return status;
};

// Helper function to convert reactions map to object with hasReacted status
const formatReactions = (reactions, userId) => {
  const result = {};
  
  // Handle both Map and plain object formats
  if (reactions instanceof Map) {
    for (const [type, data] of reactions.entries()) {
      result[type] = {
        count: data.count || 0,
        hasReacted: data.users?.some(id => id.equals(userId)) || false
      };
    }
  } else if (typeof reactions === 'object' && reactions !== null) {
    for (const [type, data] of Object.entries(reactions)) {
      if (data && typeof data === 'object') {
        result[type] = {
          count: data.count || 0,
          hasReacted: data.users?.some(id => id.equals(userId)) || false
        };
      }
    }
  }
  
  return result;
};

// Get user's reaction status for a post or comment
exports.getReactionStatus = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    if (!postId) {
      return res.status(400).json({ 
        success: false,
        message: 'Post ID is required' 
      });
    }

    let query = Post.findById(postId);
    
    // Only select necessary fields to improve performance
    if (commentId) {
      query = query.select({
        'comments._id': 1,
        'comments.reactions': 1
      });
    } else {
      query = query.select('reactions');
    }

    const post = await query.lean();
    
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    let reactions;
    
    if (commentId) {
      const comment = post.comments?.find(c => c._id.toString() === commentId);
      if (!comment) {
        return res.status(404).json({ 
          success: false,
          message: 'Comment not found' 
        });
      }
      reactions = comment.reactions;
    } else {
      reactions = post.reactions;
    }

    // Format the response
    const formattedReactions = formatReactions(reactions, userId);
    
    res.status(200).json({
      success: true,
      data: formattedReactions
    });
    
  } catch (err) {
    console.error('Get reaction status error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error getting reaction status',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Toggle reaction on a post
exports.reactToPost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { postId } = req.params;
    const { type } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId).session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.reactions[type]) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    // Check if user has any existing reaction
    let existingReactionType = null;
    for (const [reactionType, reaction] of Object.entries(post.reactions)) {
      if (reaction.users.some(id => id.equals(userId))) {
        existingReactionType = reactionType;
        break;
      }
    }

    // If user has an existing reaction and it's different from the new one, remove it first
    if (existingReactionType && existingReactionType !== type) {
      const existingReaction = post.reactions[existingReactionType];
      const userIndex = existingReaction.users.findIndex(id => id.equals(userId));
      if (userIndex !== -1) {
        existingReaction.users.splice(userIndex, 1);
        existingReaction.count = Math.max(0, existingReaction.count - 1);
      }
    }

    const reaction = post.reactions[type];
    const userIndex = reaction.users.findIndex(id => id.equals(userId));

    if (userIndex === -1) {
      // Add reaction
      reaction.users.push(userId);
      reaction.count += 1;
    } else {
      // Remove reaction
      reaction.users.splice(userIndex, 1);
      reaction.count = Math.max(0, reaction.count - 1);
    }

    post.markModified('reactions');
    await post.save({ session });
    await session.commitTransaction();

    // Send WebSocket broadcast with reaction update
    try {
      const broadcastMessage = req.app.get('broadcastMessage');
      if (broadcastMessage) {
        console.log(`Broadcasting post reaction update for post ${post._id}`);
        
        // Convert Mongoose document to plain object
        const reactionsObject = {};
        Object.keys(post.reactions || {}).forEach(key => {
          const reaction = post.reactions[key];
          if (!reaction) {
            console.warn(`Reaction '${key}' is undefined for post ${post._id}`);
            reactionsObject[key] = { count: 0, users: [] };
            return;
          }
          
          reactionsObject[key] = {
            count: reaction.count || 0,
            users: Array.isArray(reaction.users) ? reaction.users.map(id => id.toString()) : []
          };
        });
        
        broadcastMessage({
          type: 'REACTION_UPDATED',
          payload: {
            entityType: 'post',
            entityId: post._id.toString(),
            postId: post._id.toString(),
            reactions: reactionsObject,
            reactionsSummary: reactionsObject, // Add this for frontend compatibility
            organizationId: post.orgId.toString(),
            updatedAt: new Date().toISOString()
          }
        });
      }
    } catch (err) {
      console.error('Error broadcasting reaction update:', err);
      // Don't fail the request if broadcast fails
    }

    res.status(200).json({
      success: true,
      type,
      count: reaction.count,
      hasReacted: userIndex === -1,  // If userIndex was -1, now they have reacted
      message: userIndex === -1 ? 'Reaction added successfully' : 'Reaction removed successfully'
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Reaction error:', err);
    res.status(500).json({ message: 'Error reacting to post' });
  } finally {
    session.endSession();
  }
};

exports.commentOnPost = async (req, res) => {
  try {
    // Debug log to check the request user
    console.log('Request user:', req.user);
    
    // Find the post
    const post = await Post.findById(req.params.postId);
    if (!post) {
      console.log('Post not found with ID:', req.params.postId);
      return res.status(404).json({ 
        success: false,
        message: 'Post not found',
        code: 'POST_NOT_FOUND'
      });
    }

    // Validate comment text
    if (!req.body.text || req.body.text.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Comment text is required',
        code: 'COMMENT_TEXT_REQUIRED'
      });
    }

    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
      console.error('No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Create new comment
    const { text } = req.body;
    let encryptedText = text;
    if (text && typeof text === 'string') {
      encryptedText = await encrypt(text);
    }

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      text: encryptedText,
      author: req.user._id, // User's ID as the comment author
      createdByRole: req.user.role || 'user', // Default to 'user' if role not specified
      createdAt: new Date(),
      updatedAt: new Date(),
      reactions: {
        like: { count: 0, users: [] },
        love: { count: 0, users: [] },
        laugh: { count: 0, users: [] },
        angry: { count: 0, users: [] }
      }
    };
    
    // Ensure all existing comments have the required createdByRole field
    if (post.comments && Array.isArray(post.comments)) {
      post.comments = post.comments.map(comment => ({
        ...comment.toObject ? comment.toObject() : comment,
        createdByRole: comment.createdByRole || 'user'
      }));
    }

    console.log('Adding new comment:', newComment);
    
    // Add comment to post
    post.comments.push(newComment);
    const savedPost = await post.save();
    
    try {
      // Populate author info for the response
      const populatedPost = await Post.findById(savedPost._id)
        .populate('comments.author', 'name email role')
        .lean();
      
      if (!populatedPost) {
        throw new Error('Failed to retrieve the updated post');
      }

      // Manually decrypt content since we're using .lean()
      const { decrypt } = require('../utils/cryptoUtils');
      
      // Decrypt post content
      if (populatedPost.content && typeof populatedPost.content === 'object' && populatedPost.content.isEncrypted) {
        populatedPost.content = await decrypt(populatedPost.content);
      }
      
      // Decrypt comments
      if (populatedPost.comments && Array.isArray(populatedPost.comments)) {
        for (let comment of populatedPost.comments) {
          if (comment.text && typeof comment.text === 'object' && comment.text.isEncrypted) {
            comment.text = await decrypt(comment.text);
          }
        }
      }

      // Ensure we have comments array
      if (!Array.isArray(populatedPost.comments)) {
        populatedPost.comments = [];
      }
      
      // Find the newly added comment in the populated post
      const addedComment = populatedPost.comments.find(
        comment => comment._id && comment._id.toString() === newComment._id.toString()
      );

      // Prepare the response
      const responseData = {
        success: true,
        message: 'Comment added successfully',
        comment: addedComment || {
          ...newComment,
          author: {
            _id: req.user._id,
            name: req.user.name || 'Unknown User',
            email: req.user.email || 'unknown@example.com',
            role: req.user.role || 'user'
          }
        },
        post: {
          _id: populatedPost._id,
          comments: populatedPost.comments.map(comment => ({
            ...comment,
            // Ensure author is always an object
            author: comment.author || {
              _id: comment.author || 'unknown',
              name: 'Unknown User',
              email: 'unknown@example.com',
              role: comment.createdByRole || 'user'
            },
            // Ensure createdByRole exists
            createdByRole: comment.createdByRole || 'user'
          }))
        }
      };

      res.status(200).json(responseData);
    } catch (populateError) {
      console.error('Error populating author info:', populateError);
      // If population fails, return the saved comment with basic info
      res.status(200).json({
        success: true,
        message: 'Comment added successfully (author info may be limited)',
        comment: {
          ...newComment,
          author: {
            _id: req.user._id,
            name: req.user.name || 'Unknown User',
            email: req.user.email || 'unknown@example.com',
            role: req.user.role || 'user'
          }
        },
        post: {
          _id: savedPost._id,
          comments: savedPost.comments.map(comment => ({
            ...comment,
            // Ensure author is always an object
            author: {
              _id: comment.author || 'unknown',
              name: 'Unknown User',
              email: 'unknown@example.com',
              role: comment.createdByRole || 'user'
            },
            // Ensure createdByRole exists
            createdByRole: comment.createdByRole || 'user'
          }))
        }
      });
    }
    
    // Send WebSocket broadcast after the response is sent
    const broadcastMessage = req.app.get('broadcastMessage');
    if (broadcastMessage && newComment) {
      // Decrypt the comment text before broadcasting
      const { decrypt } = require('../utils/cryptoUtils');
      let decryptedCommentText = newComment.text;
      
      // Decrypt the comment text if it's encrypted
      if (newComment.text && typeof newComment.text === 'object' && newComment.text.isEncrypted) {
        try {
          decryptedCommentText = await decrypt(newComment.text);
        } catch (decryptError) {
          console.error('Error decrypting comment for WebSocket broadcast:', decryptError);
          decryptedCommentText = newComment.text; // Fallback to original
        }
      }
      
      // Make sure we're not sending Mongoose-specific methods
      const commentToBroadcast = {
        ...newComment,
        text: decryptedCommentText, // Use decrypted text
        author: {
          _id: req.user._id,
          name: req.user.name || 'Unknown User',
          email: req.user.email || 'unknown@example.com',
          role: req.user.role || 'user'
        },
        createdByRole: newComment.createdByRole || 'user'
      };
      
      broadcastMessage({
        type: 'COMMENT_CREATED',
        payload: {
          postId: post._id,
          comment: commentToBroadcast,
          organizationId: post.orgId || post.organizationId
        }
      });
    }
    
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error adding comment',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      code: 'COMMENT_ERROR'
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // First, find the post and the specific comment
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is admin or the comment author
    const isAuthor = comment.author && comment.author.toString() === userId.toString();
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    // Update the post to remove the comment using $pull
    const result = await Post.updateOne(
      { _id: postId },
      { $pull: { comments: { _id: commentId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Comment not found or already deleted' });
    }

    // Broadcast the comment deletion
    const broadcastMessage = req.app.get('broadcastMessage');
    if (broadcastMessage) {
      broadcastMessage({
        type: 'COMMENT_DELETED',
        payload: {
          postId: post._id,
          commentId: commentId,
          organizationId: post.orgId || post.organizationId
        }
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Comment deleted successfully',
      deletedByAdmin: isAdmin && !isAuthor // Indicate if deleted by admin who wasn't the author
    });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting comment',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      code: 'DELETE_COMMENT_ERROR'
    });
  }
};

// Toggle reaction on a comment
exports.reactToComment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { postId, commentId } = req.params;
    const { type } = req.body;
    const userId = req.user._id;

    if (!type) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Reaction type is required' });
    }

    const post = await Post.findById(postId).session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Ensure createdBy is preserved when updating the comment
    if (!comment.createdBy) {
      comment.createdBy = comment.author.toString();
    }
    
    // Initialize reactions if they don't exist
    if (!comment.reactions) {
      comment.reactions = new Map([
        ['like', { count: 0, users: [] }],
        ['love', { count: 0, users: [] }],
        ['laugh', { count: 0, users: [] }],
        ['angry', { count: 0, users: [] }]
      ]);
    }

    // Check if user has any existing reaction on this comment
    let existingReactionType = null;
    for (const [reactionType, reaction] of comment.reactions.entries()) {
      if (reaction.users.some(id => id.equals(userId))) {
        existingReactionType = reactionType;
        break;
      }
    }

    // If user has an existing reaction and it's different from the new one, remove it first
    if (existingReactionType && existingReactionType !== type) {
      const existingReaction = comment.reactions.get(existingReactionType);
      const userIndex = existingReaction.users.findIndex(id => id.equals(userId));
      if (userIndex !== -1) {
        existingReaction.users.splice(userIndex, 1);
        existingReaction.count = Math.max(0, existingReaction.count - 1);
        comment.reactions.set(existingReactionType, existingReaction);
      }
    }

    // Now handle the new reaction
    const reaction = comment.reactions.get(type);
    if (!reaction) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const userIndex = reaction.users.findIndex(id => id.equals(userId));

    if (userIndex === -1) {
      // Add reaction
      reaction.users.push(userId);
      reaction.count += 1;
    } else {
      // Remove reaction
      reaction.users.splice(userIndex, 1);
      reaction.count = Math.max(0, reaction.count - 1);
    }

    // Update the reactions map
    comment.reactions.set(type, reaction);
    
    // Mark the reactions map as modified
    comment.markModified('reactions');
    
    // Mark the comments array as modified
    post.markModified('comments');
    
    // Save the parent document (post) which will save the comment
    await post.save({ session, validateModifiedOnly: true });
    await session.commitTransaction();
    
    // Send WebSocket broadcast with comment reaction update
    try {
      const broadcastMessage = req.app.get('broadcastMessage');
      if (broadcastMessage) {
        console.log(`Broadcasting comment reaction update for comment ${comment._id} in post ${post._id}`);
        
        // Convert Mongoose document to plain object
        const reactionsObject = {};
        for (const [key, reaction] of comment.reactions.entries()) {
          reactionsObject[key] = {
            count: reaction.count || 0,
            users: Array.isArray(reaction.users) ? reaction.users.map(id => id.toString()) : []
          };
        }
        
        broadcastMessage({
          type: 'REACTION_UPDATED',
          payload: {
            entityType: 'comment',
            entityId: comment._id.toString(),
            postId: post._id.toString(),
            reactions: reactionsObject,
            reactionsSummary: reactionsObject, // Add this for frontend compatibility
            organizationId: post.orgId.toString(),
            updatedAt: new Date().toISOString()
          }
        });
      }
    } catch (err) {
      console.error('Error broadcasting comment reaction update:', err);
      // Don't fail the request if broadcast fails
    }

    // Get the updated reaction directly from the comment we just modified
    const updatedReaction = comment.reactions.get(type) || { count: 0, users: [] };
    const hasReacted = updatedReaction.users.some(id => id.equals(userId));
    
    res.status(200).json({
      success: true,
      type,
      count: updatedReaction.count || 0,
      hasReacted,
      message: hasReacted ? 'Reaction added successfully' : 'Reaction removed successfully'
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Comment reaction error:', err);
    
    if (err.message.startsWith('Invalid reaction type')) {
      return res.status(400).json({ 
        success: false,
        message: err.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error updating comment reaction',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    session.endSession();
  }
};

exports.deletePost = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId).session(session);

    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Post not found' });
    }

    // Allow admin to delete any post, otherwise check if the user is the author
    const isAdmin = req.user.role === 'admin';
    const isAuthor = post.author && post.author.toString() === req.user._id.toString();
    
    if (!isAdmin && !isAuthor) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    // Delete media files from Supabase storage if they exist
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      console.log('Found media URLs to delete:', post.mediaUrls);
      
      try {
        // Process each media URL one by one
        for (const url of post.mediaUrls) {
          try {
            // Extract the file path from the full URL
            const urlObj = new URL(url);
            // The pathname will be something like '/storage/v1/object/public/media/posts/filename.png'
            // We need to extract the part after '/media/'
            const pathParts = urlObj.pathname.split('/media/');
            if (pathParts.length < 2) {
              console.log(`Skipping URL (invalid format): ${url}`);
              continue;
            }
            
            const filePath = pathParts[1];
            console.log(`Attempting to delete file: ${filePath}`);
            
            // Create a new Supabase client with service role key for this operation
            const { createClient } = require('@supabase/supabase-js');
            const supabaseAdmin = createClient(
              process.env.SUPABASE_URL,
              process.env.SUPABASE_SERVICE_ROLE_KEY,
              {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false
                }
              }
            );
            
            // Delete the file using the remove method with service role key
            const { data, error } = await supabaseAdmin.storage
              .from('media')
              .remove([filePath]);
              
            if (error) {
              console.error(`Error deleting ${filePath}:`, error);
            } else {
              console.log(`Successfully deleted: ${filePath}`);
            }
          } catch (fileError) {
            console.error(`Error processing file ${url}:`, fileError.message);
          }
        }
      } catch (mediaError) {
        console.error('Error during media deletion:', {
          message: mediaError.message,
          stack: mediaError.stack,
          name: mediaError.name
        });
        // Continue with post deletion even if media deletion fails
      }
    }

    // Delete the post
    const postToDeleteForBroadcast = await Post.findById(postId).select('orgId').lean().session(session);
    await Post.findByIdAndDelete(postId).session(session);
    await session.commitTransaction();

    const broadcastMessage = req.app.get('broadcastMessage');
    if (broadcastMessage && postToDeleteForBroadcast) {
      broadcastMessage({
        type: 'POST_DELETED',
        payload: {
          postId: postId,
          organizationId: postToDeleteForBroadcast.orgId
        }
      });
    }
    
    res.status(200).json({ 
      message: 'Post deleted successfully',
      deletedByAdmin: isAdmin && !isAuthor // Indicate if deleted by admin who wasn't the author
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Error deleting post' });
  } finally {
    session.endSession();
  }
};

// Helper function to check organization access
const checkOrgAccess = async (req, orgId) => {
  try {
    console.log('=== checkOrgAccess called ===');
    console.log('Request user:', {
      id: req.user?._id,
      email: req.user?.email,
      role: req.user?.role,
      organizationId: req.user?.organizationId
    });
    console.log('Checking access for orgId:', orgId);

    // For admin and co-admin users, check if they have access to this organization
    if (req.user?.role === 'admin' || req.user?.role === 'co-admin') {
      console.log('User is admin/co-admin, checking organization access');
      
      const organization = await Organization.findById(orgId).lean();
      
      if (!organization) {
        console.error(`Organization not found: ${orgId}`);
        return { hasAccess: false, message: 'Organization not found' };
      }
      
      console.log('Organization found:', {
        _id: organization._id,
        name: organization.name,
        adminEmail: organization.adminEmail,
        coAdminEmails: organization.coAdminEmails,
        coAdminEmails: organization.coAdminEmails // Check both spellings
      });
      
      // Normalize emails for comparison
      const userEmail = req.user.email?.toLowerCase().trim();
      const adminEmail = organization.adminEmail?.toLowerCase().trim();
      
      if (!userEmail) {
        console.error('No user email found in request');
        return { hasAccess: false, message: 'User email not found' };
      }
      
      // Handle both coAdminEmails and coAdminEmails (typo in field name)
      const coAdminEmails = [];
      
      // Helper function to safely process email strings
      const processEmail = (email) => {
        // If email is an object with an email property, use that
        if (email && typeof email === 'object' && 'email' in email) {
          const processed = String(email.email || '').toLowerCase().trim();
          console.log(`Processed email object:`, email, '->', processed);
          return processed;
        }
        // If it's already a string
        if (typeof email === 'string') {
          const processed = email.toLowerCase().trim();
          console.log(`Processed email string: ${email} -> ${processed}`);
          return processed;
        }
        // Fallback for any other case
        const processed = String(email || '').toLowerCase().trim();
        console.log(`Processed fallback email:`, email, '->', processed);
        return processed;
      };
      
      // Check both possible field names for co-admin emails
      if (Array.isArray(organization.coAdminEmails)) {
        console.log('Found coAdminEmails:', organization.coAdminEmails);
        coAdminEmails.push(...organization.coAdminEmails
          .filter(email => {
            const valid = email != null;
            if (!valid) console.log('Filtered out null/undefined email');
            return valid;
          })
          .map(email => {
            const processed = processEmail(email);
            console.log(`Processed co-admin email: ${email} -> ${processed}`);
            return processed;
          })
          .filter(email => {
            const valid = !!email;
            if (!valid) console.log('Filtered out empty email after processing');
            return valid;
          })
        );
      }
      
      // Check for the other possible field name (in case of typo)
      if (Array.isArray(organization.coAdminEmails)) {
        console.log('Found coAdminEmails (alt spelling):', organization.coAdminEmails);
        coAdminEmails.push(...organization.coAdminEmails
          .filter(email => {
            const valid = email != null;
            if (!valid) console.log('Filtered out null/undefined email (alt)');
            return valid;
          })
          .map(email => {
            const processed = processEmail(email);
            console.log(`Processed co-admin email (alt): ${email} -> ${processed}`);
            return processed;
          })
          .filter(email => {
            const valid = !!email;
            if (!valid) console.log('Filtered out empty email after processing (alt)');
            return valid;
          })
        );
      }
      
      // Remove duplicates and empty values
      const uniqueCoAdminEmails = [...new Set(coAdminEmails)].filter(Boolean);
      
      // Check if user is either the admin or a co-admin of this organization
      const isAdmin = adminEmail === userEmail;
      const isCoAdmin = uniqueCoAdminEmails.includes(userEmail);
      
      console.log('Access check results:', {
        userEmail,
        isAdmin,
        isCoAdmin,
        adminEmail,
        coAdminEmails: uniqueCoAdminEmails,
        userRole: req.user.role,
        orgId: organization._id,
        organizationFields: Object.keys(organization)
      });
      
      if (!isAdmin && !isCoAdmin) {
        console.error('Access denied - User is neither admin nor co-admin', {
          userEmail,
          adminEmail,
          isAdmin,
          isCoAdmin,
          coAdminEmails: uniqueCoAdminEmails
        });
        return { hasAccess: false, message: 'Access denied: Not authorized to access this organization' };
      }
      
      // If user is a co-admin, elevate to admin role for this request
      if (isCoAdmin && !isAdmin) {
        console.log(`Elevating co-admin ${userEmail} to admin role for org ${orgId}`);
        req.user.role = 'admin';
        req.user.isCoAdmin = true; // Add flag to indicate this is a co-admin
      }
      
      console.log('Access granted to organization');
      return { hasAccess: true, organization };
    } 
    
    // For regular employees, check if this is their verified organization
    console.log('User is not an admin/co-admin, checking organization membership');
    if (!req.user.organizationId || req.user.organizationId.toString() !== orgId.toString()) {
      console.error(`User ${req.user._id} is not a member of org ${orgId}`, {
        userOrgId: req.user.organizationId,
        requestedOrgId: orgId
      });
      return { hasAccess: false, message: 'Access denied: Not a member of this organization' };
    }
    
    console.log('Access granted - Regular user is a member of the organization');
    return { hasAccess: true };
  } catch (error) {
    console.error('Error in checkOrgAccess:', error);
    return { hasAccess: false, message: 'Error checking organization access' };
  }
};

exports.getPostStats = async (req, res) => {
  try {
    const { orgId } = req.params;

    // Check organization access
    const { hasAccess, message } = await checkOrgAccess(req, orgId);
    if (!hasAccess) {
      return res.status(403).json({ message: message || 'Access denied' });
    }

    const stats = await Post.aggregate([
      { $match: { orgId: new mongoose.Types.ObjectId(orgId) } },
      { $group: { _id: "$postType", count: { $sum: 1 } } }
    ]);

    const postTypes = ['feedback', 'complaint', 'suggestion', 'public'];
    const formattedStats = postTypes.map(type => {
      const stat = stats.find(s => s._id === type);
      return { _id: type, count: stat ? stat.count : 0 };
    });

    res.status(200).json(formattedStats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Error getting stats' });
  }
};

exports.editPost = async (req, res) => {
  try {
    const { content, postType, mediaUrls, region, department, isAnonymous } = req.body;
    const { postId } = req.params;

    const updates = {};
    if (content !== undefined) updates.content = content;
    if (postType !== undefined) updates.postType = postType;
    if (mediaUrls !== undefined) updates.mediaUrls = mediaUrls;
    if (region !== undefined) updates.region = region;
    if (department !== undefined) updates.department = department;
    if (isAnonymous !== undefined) updates.isAnonymous = isAnonymous;

    if (Object.keys(updates).length === 0) {
       return res.status(400).json({ message: 'No update data provided' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Verify post ownership
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to edit this post' });
    }

    updates.updatedAt = new Date();
    const updatedPost = await Post.findByIdAndUpdate(postId, updates, { new: true });

    const { decryptContent } = require('../utils/cryptoUtils');
    const broadcastMessage = req.app.get('broadcastMessage');
    if (broadcastMessage && updatedPost) {
      // Decrypt post content before broadcasting
      const decryptedPost = await decryptContent(updatedPost.toObject());
      const broadcastPayload = { ...decryptedPost, organization: updatedPost.orgId };
      broadcastMessage({
        type: 'POST_UPDATED',
        payload: broadcastPayload
      });
    }

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error('Edit post error:', err);
    res.status(500).json({ message: 'Error updating post' });
  }
};

exports.editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text required' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Verify comment ownership
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to edit this comment' });
    }

    // Encrypt the comment text before saving
    if (text && typeof text === 'string') {
      comment.text = await encrypt(text);
    }

    comment.updatedAt = new Date();
    await post.save();

    // Broadcast the update to all connected clients
    const broadcastMessage = req.app.get('broadcastMessage');
    if (broadcastMessage) {
      // Decrypt the comment text before broadcasting
      const { decrypt } = require('../utils/cryptoUtils');
      const commentObj = comment.toObject();
      let decryptedCommentText = commentObj.text;
      
      // Decrypt the comment text if it's encrypted
      if (commentObj.text && typeof commentObj.text === 'object' && commentObj.text.isEncrypted) {
        try {
          decryptedCommentText = await decrypt(commentObj.text);
        } catch (decryptError) {
          console.error('Error decrypting comment for WebSocket broadcast:', decryptError);
          decryptedCommentText = commentObj.text; // Fallback to original
        }
      }
      
      const commentToBroadcast = {
        ...commentObj,
        text: decryptedCommentText // Use decrypted text
      };
      
      broadcastMessage({
        type: 'COMMENT_UPDATED',
        payload: {
          postId: post._id,
          comment: commentToBroadcast,
          organizationId: post.orgId
        }
      });
    }

    // Decrypt the comment text for the response
    const commentObj = comment.toObject();
    if (commentObj.text && typeof commentObj.text === 'object' && commentObj.text.isEncrypted) {
      commentObj.text = await decrypt(commentObj.text);
    }
    res.status(200).json({ 
      message: 'Comment updated successfully', 
      post: post.toObject(), 
      comment: commentObj 
    });
  } catch (err) {
    console.error('Edit comment error:', err);
    res.status(500).json({ message: 'Error editing comment' });
  }
};

// Toggle post pinning - only admins can pin/unpin posts
exports.togglePostPin = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Only admins can pin/unpin posts
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Only administrators can pin/unpin posts' 
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    // Check organization access
    const { hasAccess, message } = await checkOrgAccess(req, post.orgId.toString());
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false,
        message: message || 'Access denied' 
      });
    }

    // If we're pinning this post, unpin all other posts in the organization first
    if (!post.isPinned) {
      await Post.updateMany(
        { orgId: post.orgId, _id: { $ne: postId } },
        { isPinned: false }
      );
    }

    // Toggle the pin status
    post.isPinned = !post.isPinned;
    await post.save({ timestamps: false });

    // Broadcast the update
    const broadcastMessage = req.app.get('broadcastMessage');
    if (broadcastMessage) {
      const { decryptContent } = require('../utils/cryptoUtils');
      const decryptedPost = await decryptContent(post.toObject());
      broadcastMessage({
        type: 'POST_UPDATED',
        payload: {
          ...decryptedPost,
          organization: post.orgId
        }
      });
    }

    res.status(200).json({
      success: true,
      message: post.isPinned ? 'Post pinned successfully' : 'Post unpinned successfully',
      post: post.toObject()
    });

  } catch (err) {
    console.error('Toggle post pin error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error toggling post pin status' 
    });
  }
};

// Toggle comment pinning - only admins can pin/unpin comments
exports.toggleCommentPin = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Only admins can pin/unpin comments
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Only administrators can pin/unpin comments' 
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    // Check organization access
    const { hasAccess, message } = await checkOrgAccess(req, post.orgId.toString());
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false,
        message: message || 'Access denied' 
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ 
        success: false,
        message: 'Comment not found' 
      });
    }

    // If we're pinning this comment, unpin all other comments in this post first
    if (!comment.isPinned) {
      post.comments.forEach(c => {
        if (c._id.toString() !== commentId) {
          c.isPinned = false;
        }
      });
    }

    // Store the original updatedAt value to preserve it
    const originalUpdatedAt = comment.updatedAt;

    // Toggle the pin status
    comment.isPinned = !comment.isPinned;
    
    // Explicitly set updatedAt back to its original value to prevent "(edited)" from showing
    comment.updatedAt = originalUpdatedAt;
    
    await post.save({ timestamps: false });

    // Broadcast the update
    const broadcastMessage = req.app.get('broadcastMessage');
    if (broadcastMessage) {
      // Decrypt the comment text before broadcasting
      const { decrypt } = require('../utils/cryptoUtils');
      const commentObj = comment.toObject();
      let decryptedCommentText = commentObj.text;
      
      if (commentObj.text && typeof commentObj.text === 'object' && commentObj.text.isEncrypted) {
        try {
          decryptedCommentText = await decrypt(commentObj.text);
        } catch (decryptError) {
          console.error('Error decrypting comment for WebSocket broadcast:', decryptError);
          decryptedCommentText = commentObj.text;
        }
      }
      
      const commentToBroadcast = {
        ...commentObj,
        text: decryptedCommentText
      };
      
      broadcastMessage({
        type: 'COMMENT_UPDATED',
        payload: {
          postId: post._id,
          comment: commentToBroadcast,
          organizationId: post.orgId
        }
      });
    }

    // Decrypt the comment text for the response
    const commentObj = comment.toObject();
    if (commentObj.text && typeof commentObj.text === 'object' && commentObj.text.isEncrypted) {
      commentObj.text = await decrypt(commentObj.text);
    }

    res.status(200).json({
      success: true,
      message: comment.isPinned ? 'Comment pinned successfully' : 'Comment unpinned successfully',
      comment: commentObj
    });

  } catch (err) {
    console.error('Toggle comment pin error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error toggling comment pin status' 
    });
  }
};

// --- Poll Controllers ---
// Create a poll (admin only)
exports.createPoll = async (req, res) => {
  try {
    const { orgId, pollQuestion, pollOptions } = req.body;
    if (!orgId || !pollQuestion || !Array.isArray(pollOptions) || pollOptions.length < 2 || pollOptions.length > 5) {
      return res.status(400).json({ message: 'Invalid poll data' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create polls' });
    }
    // Encrypt handled by model pre-save
    const newPoll = new Post({
      orgId,
      isPoll: true,
      pollQuestion,
      pollOptions: pollOptions.map(opt => ({ text: opt, voteCount: 0 })),
      pollStatus: 'active',
      pollVotes: [],
      author: req.user._id,
      createdByRole: req.user.role
    });
    await newPoll.save();
    await newPoll.decryptPoll();
    // WebSocket broadcast
    const broadcastMessage = req.app.get('broadcastMessage');
    if (broadcastMessage) {
      broadcastMessage({
        type: 'POLL_CREATED',
        payload: { ...newPoll.toObject(), organization: newPoll.orgId }
      });
    }
    res.status(201).json(newPoll);
  } catch (err) {
    console.error('Create poll error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Edit a poll (admin only, only if active)
exports.editPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { pollQuestion, pollOptions } = req.body;
    const poll = await Post.findById(pollId);
    if (!poll || !poll.isPoll) return res.status(404).json({ message: 'Poll not found' });
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can edit polls' });
    if (poll.pollStatus !== 'active') return res.status(400).json({ message: 'Cannot edit a stopped poll' });
    if (pollQuestion) poll.pollQuestion = pollQuestion;
    if (pollOptions && Array.isArray(pollOptions) && pollOptions.length >= 2 && pollOptions.length <= 5) {
      poll.pollOptions = pollOptions.map(opt => ({ text: opt, voteCount: 0 }));
      poll.pollVotes = [];
    }
    await poll.save();
    await poll.decryptPoll();
    // WebSocket broadcast
    const broadcastMessage = req.app.get('broadcastMessage');
    if (broadcastMessage) {
      broadcastMessage({
        type: 'POLL_UPDATED',
        payload: { ...poll.toObject(), organization: poll.orgId }
      });
    }
    res.status(200).json(poll);
  } catch (err) {
    console.error('Edit poll error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Delete a poll (admin only)
exports.deletePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await Post.findById(pollId);
    if (!poll || !poll.isPoll) return res.status(404).json({ message: 'Poll not found' });
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can delete polls' });
    await Post.findByIdAndDelete(pollId);
    // WebSocket broadcast
    const broadcastMessage = req.app.get('broadcastMessage');
    if (broadcastMessage) {
      broadcastMessage({
        type: 'POLL_DELETED',
        payload: { pollId, organization: poll.orgId }
      });
    }
    res.status(200).json({ message: 'Poll deleted' });
  } catch (err) {
    console.error('Delete poll error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Vote in a poll (employee only, one vote per user)
exports.votePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    const poll = await Post.findById(pollId);
    if (!poll || !poll.isPoll) return res.status(404).json({ message: 'Poll not found' });
    if (poll.pollStatus !== 'active') return res.status(400).json({ message: 'Poll is not active' });
    // Only employees can vote (not admin)
    if (req.user.role !== 'employee') return res.status(403).json({ message: 'Only employees can vote' });
    // Check if user already voted
    if (poll.pollVotes.some(v => v.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You have already voted' });
    }
    // Find option
    const option = poll.pollOptions.find(opt => opt._id.toString() === optionId);
    if (!option) return res.status(400).json({ message: 'Invalid option' });
    option.voteCount += 1;
    poll.pollVotes.push({ user: req.user._id, optionId });
    await poll.save();
    await poll.decryptPoll();
    // WebSocket broadcast
    const broadcastMessage = req.app.get('broadcastMessage');
    if (broadcastMessage) {
      broadcastMessage({
        type: 'POLL_VOTED',
        payload: { ...poll.toObject(), organization: poll.orgId }
      });
    }
    res.status(200).json(poll);
  } catch (err) {
    console.error('Vote poll error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Stop a poll (admin only, cannot be restarted)
exports.stopPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await Post.findById(pollId);
    if (!poll || !poll.isPoll) return res.status(404).json({ message: 'Poll not found' });
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can stop polls' });
    if (poll.pollStatus !== 'active') return res.status(400).json({ message: 'Poll already stopped' });
    poll.pollStatus = 'stopped';
    poll.pollStoppedAt = new Date();
    await poll.save();
    await poll.decryptPoll();
    // WebSocket broadcast
    const broadcastMessage = req.app.get('broadcastMessage');
    if (broadcastMessage) {
      broadcastMessage({
        type: 'POLL_STOPPED',
        payload: { ...poll.toObject(), organization: poll.orgId }
      });
    }
    res.status(200).json(poll);
  } catch (err) {
    console.error('Stop poll error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};