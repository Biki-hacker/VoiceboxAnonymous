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
router.post('/', createPost);
router.post('/:postId/like', reactToPost);
router.post('/:postId/comment', commentOnPost);
router.post('/:postId/comment/:commentId/react', reactToComment);

// Edit and delete comments
router.put('/:postId/comment/:commentId', editComment);
router.delete('/:postId/comment/:commentId', deleteComment);

// Stats and fetching
router.get('/stats/:orgId', getPostStats);
router.get('/:orgId', getPostsByOrg);

module.exports = router;
