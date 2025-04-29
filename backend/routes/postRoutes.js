// backend/routes/postRoutes.js
const express = require('express');
const {
  createPost,
  reactToPost,
  commentOnPost,
  deleteComment,
  editComment,
  getPostsByOrg,
  getPostStats,
  reactToComment
} = require('../controllers/postController');

const router = express.Router();

// Create, react to, and comment on posts
router.post('/', createPost);                                // POST /api/posts
router.post('/:postId/like', reactToPost);                   // POST /api/posts/:postId/like
router.post('/:postId/comment', commentOnPost);              // POST /api/posts/:postId/comment
router.post('/:postId/comment/:commentId/react', reactToComment); // POST /api/posts/:postId/comment/:commentId/react

// Edit and delete comments
router.put('/:postId/comment/:commentId', editComment);      // PUT  /api/posts/:postId/comment/:commentId
router.delete('/:postId/comment/:commentId', deleteComment); // DELETE /api/posts/:postId/comment/:commentId

// Stats and fetching
router.get('/stats/:orgId', getPostStats);                   // GET /api/posts/stats/:orgId
router.get('/:orgId', getPostsByOrg);                        // GET /api/posts/:orgId

module.exports = router;
