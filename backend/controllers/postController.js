// backend/controllers/postController.js
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
    // Populate author's email in the response if needed
    // await newPost.populate('author', 'email');
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getPostsByOrg = async (req, res) => {
  try {
    // Ensure the authenticated user belongs to the organization they are trying to fetch posts for
    if (req.user.organizationId.toString() !== req.params.orgId.toString()) {
      return res.status(403).json({ message: 'Access denied: Not a member of this organization' });
    }

    const posts = await Post.find({ orgId: req.params.orgId })
      .sort({ createdAt: -1 })
      // Populate author's email if you need it on the frontend
      // .populate('author', 'email')
      // If you want to populate comment authors too:
      // .populate({
      //   path: 'comments.author',
      //   select: 'email'
      // });
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

    if (!post.reactions.hasOwnProperty(reactionType)) {
        return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const reactionUsers = post.reactions[reactionType].users;
    const userIndex = reactionUsers.indexOf(userId);

    if (userIndex === -1) {
      // User has not reacted, add reaction
      reactionUsers.push(userId);
      post.reactions[reactionType].count += 1;
    } else {
      // User has reacted, remove reaction
      reactionUsers.splice(userIndex, 1);
      post.reactions[reactionType].count -= 1;
    }

    await post.save();

    // Return the updated post or just the reaction counts
    // Returning the whole post is simpler if frontend uses the whole post object
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
      createdAt: new Date(), // Set creation time
      updatedAt: new Date() // Set initial update time
    };

    post.comments.push(newComment);
    await post.save();

    // Optionally populate the author of the newly added comment
    // await post.populate('comments.author', 'email');

    // Return the updated post or just the new comment
    // Returning the whole post is simpler if frontend updates its state with the full post
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

    // Use Mongoose's pull to remove the comment from the array
    post.comments.pull(commentId);
    await post.save();

    res.status(200).json({ message: 'Comment deleted successfully' });
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

     if (!comment.reactions.hasOwnProperty(reactionType)) {
        return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const reactionUsers = comment.reactions[reactionType].users;
    const userIndex = reactionUsers.indexOf(userId);

    if (userIndex === -1) {
      // User has not reacted, add reaction
      reactionUsers.push(userId);
      comment.reactions[reactionType].count += 1;
    } else {
      // User has reacted, remove reaction
      reactionUsers.splice(userIndex, 1);
      comment.reactions[reactionType].count -= 1;
    }

    await post.save();

    // Return the updated post or the comment with updated reactions
    res.status(200).json(post); // Returning the whole post for consistency
  } catch (err) {
    console.error('Comment reaction error:', err);
    res.status(500).json({ message: 'Error reacting to comment' });
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

    // Use Mongoose's findByIdAndDelete
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

    // Verify user belongs to the organization
    if (req.user.organizationId.toString() !== orgId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await Post.aggregate([
      { $match: { orgId: new mongoose.Types.ObjectId(orgId) } }, // Ensure orgId is ObjectId
      { $group: { _id: "$postType", count: { $sum: 1 } } }
    ]);

    // Format the output to include all post types, even those with 0 count
    const postTypes = ['feedback', 'complaint', 'suggestion', 'public'];
    const formattedStats = postTypes.map(type => {
      const stat = stats.find(s => s._id === type);
      return { type, count: stat ? stat.count : 0 };
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

    // Construct updates object dynamically
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

    // Add updatedAt timestamp
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
    comment.updatedAt = new Date(); // Update timestamp
    await post.save();

    // Return the updated post or just the updated comment
    res.status(200).json(post); // Returning the whole post for consistency
  } catch (err) {
    console.error('Edit comment error:', err);
    res.status(500).json({ message: 'Error editing comment' });
  }
};
