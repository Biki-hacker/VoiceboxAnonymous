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
const { param } = require('express-validator');

const { authMiddleware } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Post routes with stats first (more specific)
router.post('/', createPost);
router.get('/stats/:orgId', getPostStats);

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

// Post CRUD operations (less specific routes last)
router.get('/:orgId', [
  param('orgId').isMongoId().withMessage('Invalid organization ID')
], getPostsByOrg);

router.put('/:postId', [
  param('postId').isMongoId().withMessage('Invalid post ID')
], editPost);

router.delete('/:postId', [
  param('postId').isMongoId().withMessage('Invalid post ID')
], deletePost);

module.exports = router;