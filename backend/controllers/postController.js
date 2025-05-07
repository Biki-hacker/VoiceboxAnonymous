// backend/controllers/postController.js
const Post = require('../models/Post');

// Create new post
exports.createPost = async (req, res) => {
  try {
    const {
      orgId,
      postType,
      content,
      mediaUrls,
      region,
      department,
      isAnonymous
    } = req.body;

    if (!orgId || !postType || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newPost = new Post({
      orgId,
      postType,
      content,
      mediaUrls: mediaUrls || [],
      region: region || null,
      department: department || null,
      isAnonymous: isAnonymous !== false
    });

    await newPost.save();
    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getPostsByOrg = async (req, res) => {
  try {
    const { orgId } = req.params;
    const posts = await Post.find({ orgId }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

exports.getPostStats = async (req, res) => {
  try {
    const { orgId } = req.params;
    const stats = await Post.aggregate([
      { $match: { orgId } },
      { $group: { _id: "$postType", count: { $sum: 1 } } }
    ]);
    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Error getting stats' });
  }
};

exports.reactToPost = async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.likes += 1;
    await post.save();
    res.status(200).json({ message: 'Post liked!', post });
  } catch (err) {
    res.status(500).json({ message: 'Error reacting to post' });
  }
};

exports.commentOnPost = async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  try {
    const updated = await Post.findByIdAndUpdate(
      postId,
      { $push: { comments: { text, createdAt: new Date() } } },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error commenting' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    await Post.findByIdAndUpdate(postId, {
      $pull: { comments: { _id: commentId } }
    });
    res.status(200).json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

exports.editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;

    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId, 'comments._id': commentId },
      {
        $set: {
          'comments.$.text': text,
          'comments.$.updatedAt': new Date()
        }
      },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: 'Error editing comment' });
  }
};

exports.reactToComment = async (req, res) => {
  const { postId, commentId } = req.params;
  const { type, undo } = req.body;

  if (!['like', 'love', 'laugh', 'angry'].includes(type)) {
    return res.status(400).json({ message: 'Invalid reaction type' });
  }

  try {
    const update = undo
      ? { $inc: { [`comments.$.reactions.${type}`]: -1 } }
      : { $inc: { [`comments.$.reactions.${type}`]: 1 } };

    const post = await Post.findOneAndUpdate(
      { _id: postId, 'comments._id': commentId },
      update,
      { new: true }
    );

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Error reacting to comment' });
  }
};

exports.editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, postType, mediaUrls } = req.body;

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        ...(content && { content }),
        ...(postType && { postType }),
        ...(mediaUrls && { mediaUrls }),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json({ message: 'Post updated', post: updatedPost });
  } catch (err) {
    res.status(500).json({ message: 'Error editing post' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const deleted = await Post.findByIdAndDelete(postId);
    if (!deleted) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting post' });
  }
};
