// backend/controllers/postController.js
const Post = require('../models/Post');
const Organization = require('../models/Organization');
const mongoose = require('mongoose');

exports.createPost = async (req, res) => {
  try {
    const { orgId, postType, content, mediaUrls, region, department, isAnonymous } = req.body;

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
    
    // For admin users, check if they created this organization
    if (req.user.role === 'admin') {
      const organization = await Organization.findById(orgId);
      if (!organization || organization.adminEmail !== req.user.email) {
        return res.status(403).json({ message: 'Access denied: Not authorized to view this organization' });
      }
    } else {
      // For employees, check if this is their verified organization
      if (!req.user.organizationId || req.user.organizationId.toString() !== orgId.toString()) {
        return res.status(403).json({ message: 'Access denied: Not a member of this organization' });
      }
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
    
    // Return updated reaction status
    res.status(200).json({
      type,
      count: reaction.count,
      hasReacted: userIndex === -1  // If userIndex was -1, now they have reacted
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
    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      text: req.body.text.trim(),
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

    res.status(200).json({ 
      message: 'Comment deleted successfully',
      deletedByAdmin: isAdmin && !isAuthor // Indicate if deleted by admin who wasn't the author
    });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ message: 'Error deleting comment' });
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
    
    // Use the comment's addReaction method
    await comment.addReaction(userId, type);
    
    // Mark the comments array as modified
    post.markModified('comments');
    
    // Save the parent document (post) which will save the comment
    await post.save({ session, validateModifiedOnly: true });
    await session.commitTransaction();
    
    // Get the updated reaction directly from the comment we just modified
    const updatedReaction = comment.reactions.get(type) || { count: 0, users: [] };
    const hasReacted = updatedReaction.users.some(id => id.equals(userId));
    
    res.status(200).json({
      success: true,
      reaction: {
        type,
        count: updatedReaction.count || 0,
        hasReacted
      },
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
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Allow admin to delete any post, otherwise check if the user is the author
    const isAdmin = req.user.role === 'admin';
    const isAuthor = post.author && post.author.toString() === req.user._id.toString();
    
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ 
      message: 'Post deleted successfully',
      deletedByAdmin: isAdmin && !isAuthor // Indicate if deleted by admin who wasn't the author
    });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Error deleting post' });
  }
};

exports.getPostStats = async (req, res) => {
  try {
    const { orgId } = req.params;

    // For admin users, check if they created this organization
    if (req.user.role === 'admin') {
      const organization = await Organization.findById(orgId);
      if (!organization || organization.adminEmail !== req.user.email) {
        return res.status(403).json({ message: 'Access denied: Not authorized to view this organization' });
      }
    } else {
      // For employees, check if this is their verified organization
      if (!req.user.organizationId || req.user.organizationId.toString() !== orgId.toString()) {
        return res.status(403).json({ message: 'Access denied: Not a member of this organization' });
      }
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
    res.status(200).json(updatedPost);
  } catch (err) {
    console.error('Edit post error:', err);
    res.status(500).json({ message: 'Error editing post' });
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

    comment.text = text;
    comment.updatedAt = new Date();
    await post.save();
    res.status(200).json(post);
  } catch (err) {
    console.error('Edit comment error:', err);
    res.status(500).json({ message: 'Error editing comment' });
  }
};