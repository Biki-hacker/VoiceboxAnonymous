// backend/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
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
  getReactionStatus,
  togglePostPin,
  toggleCommentPin,
  // Poll controllers
  getPollsByOrg,
  createPoll,
  editPoll,
  deletePoll,
  votePoll,
  stopPoll
} = require('../controllers/postController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create a new post
router.post('/', createPost);

// Get post statistics for an organization
router.get('/stats/:orgId', [
  param('orgId').isMongoId().withMessage('Invalid organization ID')
], getPostStats);

// Get posts by organization
router.get('/org/:orgId', [
  param('orgId').isMongoId().withMessage('Invalid organization ID')
], getPostsByOrg);

// Post reactions
router.route('/:postId/reactions')
  .all([
    param('postId').isMongoId().withMessage('Invalid post ID')
  ])
  .get(getReactionStatus)
  .post(reactToPost)
  .delete(reactToPost);

// Comments
router.route('/:postId/comments')
  .all([
    param('postId').isMongoId().withMessage('Invalid post ID')
  ])
  .post(commentOnPost);

// Comment-specific routes
router.route('/:postId/comments/:commentId')
  .all([
    param('postId').isMongoId().withMessage('Invalid post ID'),
    param('commentId').isMongoId().withMessage('Invalid comment ID')
  ])
  .put(editComment)
  .delete(deleteComment);

// Comment reactions
router.route('/:postId/comments/:commentId/reactions')
  .all([
    param('postId').isMongoId().withMessage('Invalid post ID'),
    param('commentId').isMongoId().withMessage('Invalid comment ID')
  ])
  .get(getReactionStatus)
  .post(reactToComment)
  .delete(reactToComment);

// Update and delete posts
router.route('/:postId')
  .all([
    param('postId').isMongoId().withMessage('Invalid post ID')
  ])
  .put(editPost)
  .delete(deletePost);

// Pin/unpin a post (admin only)
router.post('/:postId/pin', [
  param('postId').isMongoId().withMessage('Invalid post ID')
], togglePostPin);

// Pin/unpin a comment (admin only)
router.post('/:postId/comments/:commentId/pin', [
  param('postId').isMongoId().withMessage('Invalid post ID'),
  param('commentId').isMongoId().withMessage('Invalid comment ID')
], toggleCommentPin);

// --- Poll routes ---
router.get('/polls/org/:orgId', getPollsByOrg); // Get all polls for org
router.post('/polls', createPoll); // Create poll (admin)
router.put('/polls/:pollId', editPoll); // Edit poll (admin)
router.delete('/polls/:pollId', deletePoll); // Delete poll (admin)
router.post('/polls/:pollId/vote', votePoll); // Vote (employee)
router.post('/polls/:pollId/stop', stopPoll); // Stop poll (admin)

module.exports = router;