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
      author: req.user._id,
      mediaUrls: mediaUrls || [],
      region: region || null,
      department: department || null,
      isAnonymous: isAnonymous !== false,
      // Initialize reactions with empty users array and count 0
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
    // For admin users, check if they created this organization
    if (req.user.role === 'admin') {
      const organization = await Organization.findById(req.params.orgId);
      if (!organization || organization.adminEmail !== req.user.email) {
        return res.status(403).json({ message: 'Access denied: Not authorized to view this organization' });
      }
    } else {
      // For employees, check if this is their verified organization
      if (!req.user.organizationId || req.user.organizationId.toString() !== req.params.orgId.toString()) {
        return res.status(403).json({ message: 'Access denied: Not a member of this organization' });
      }
    }

    const posts = await Post.find({ orgId: req.params.orgId })
      .sort({ createdAt: -1 });
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
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (!req.body.text || req.body.text.trim() === '') {
       return res.status(400).json({ message: 'Comment text is required' });
    }

    const newComment = {
      text: req.body.text,
      author: req.user._id,
      // Initialize comment reactions
      reactions: {
        like: { count: 0, users: [] },
        love: { count: 0, users: [] },
        laugh: { count: 0, users: [] },
        angry: { count: 0, users: [] }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();
    res.status(200).json(post);
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ message: 'Error commenting' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const commentId = req.params.commentId;
    const comment = post.comments.id(commentId);

    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Check if the authenticated user is the author of the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    post.comments.pull(commentId);
    await post.save();

    res.status(200).json({ message: 'Comment deleted successfully' });
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
    
    // Mark the comment as modified to ensure it gets saved
    post.markModified('comments');
    
    await post.save({ session });
    await session.commitTransaction();
    
    // Get updated reaction status
    const updatedComment = await Post.findOne(
      { _id: postId, 'comments._id': commentId },
      { 'comments.$': 1 }
    );
    
    if (!updatedComment) {
      return res.status(404).json({ message: 'Failed to update comment reaction' });
    }
    
    const updatedReaction = updatedComment.comments[0].reactions.get(type) || { count: 0, users: [] };
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

    // Check if the authenticated user is the author of the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Post deleted successfully' });
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