// backend/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const {
  createPost,
  reactToPost,
  commentOnPost,
  deleteComment,
  editComment,
  getPostsByOrg,
  getPostStats,
  reactToComment,
  editPost,
  deletePost,
  getReactionStatus
} = require('../controllers/postController');

const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Post routes
router.post('/', createPost);
router.get('/stats/:orgId', getPostStats);
router.get('/:orgId', getPostsByOrg);
router.put('/:postId', editPost);
router.delete('/:postId', deletePost);

// Post reactions
router.route('/:postId/reactions')
  .get(getReactionStatus) // Get post reactions
  .post(reactToPost);      // React to post

// Comments
router.route('/:postId/comments')
  .post(commentOnPost);    // Create comment

// Comment-specific routes
router.route('/:postId/comments/:commentId')
  .put(editComment)        // Edit comment
  .delete(deleteComment);   // Delete comment

// Comment reactions
router.route('/:postId/comments/:commentId/reactions')
  .get(getReactionStatus)  // Get comment reactions
  .post(reactToComment);    // React to comment

module.exports = router;