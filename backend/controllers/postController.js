const Post = require('../models/Post');

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
      isAnonymous: isAnonymous !== false
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
    const posts = await Post.find({ orgId: req.params.orgId })
      .sort({ createdAt: -1 })
      .populate('author', 'email');
    res.status(200).json(posts);
  } catch (err) {
    console.error('Fetch posts error:', err);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

exports.reactToPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const reactionType = req.body.type;
    const userId = req.user._id;
    
    const reaction = post.reactions[reactionType];
    const userIndex = reaction.users.indexOf(userId);

    if (userIndex === -1) {
      reaction.users.push(userId);
      reaction.count += 1;
    } else {
      reaction.users.splice(userIndex, 1);
      reaction.count -= 1;
    }

    await post.save();
    res.status(200).json(post);
  } catch (err) {
    console.error('Reaction error:', err);
    res.status(500).json({ message: 'Error reacting to post' });
  }
};

exports.commentOnPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const newComment = {
      text: req.body.text,
      author: req.user._id,
      reactions: {
        like: { users: [], count: 0 },
        love: { users: [], count: 0 },
        laugh: { users: [], count: 0 },
        angry: { users: [], count: 0 }
      }
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

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    comment.remove();
    await post.save();
    res.status(200).json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

exports.reactToComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const reactionType = req.body.type;
    const userId = req.user._id;
    
    const reaction = comment.reactions[reactionType];
    const userIndex = reaction.users.indexOf(userId);

    if (userIndex === -1) {
      reaction.users.push(userId);
      reaction.count += 1;
    } else {
      reaction.users.splice(userIndex, 1);
      reaction.count -= 1;
    }

    await post.save();
    res.status(200).json(post);
  } catch (err) {
    console.error('Comment reaction error:', err);
    res.status(500).json({ message: 'Error reacting to comment' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await post.remove();
    res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Error deleting post' });
  }
};

exports.getPostStats = async (req, res) => {
  try {
    const { orgId } = req.params;
    
    // Verify user belongs to the organization
    if (req.user.organizationId.toString() !== orgId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await Post.aggregate([
      { $match: { orgId: req.user.organizationId } },
      { $group: { _id: "$postType", count: { $sum: 1 } } }
    ]);
    
    res.status(200).json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Error getting stats' });
  }
};

exports.editPost = async (req, res) => {
  try {
    const { content, postType, mediaUrls } = req.body;
    const { postId } = req.params;

    if (!content && !postType && !mediaUrls) {
      return res.status(400).json({ message: 'No update data provided' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Verify post ownership
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to edit this post' });
    }

    const updates = {
      ...(content && { content }),
      ...(postType && { postType }),
      ...(mediaUrls && { mediaUrls }),
      updatedAt: new Date()
    };

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