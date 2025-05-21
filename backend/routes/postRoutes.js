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
  deletePost
} = require('../controllers/postController');

const auth = require('../middleware/auth');

router.post('/', auth, createPost);
router.get('/stats/:orgId', auth, getPostStats);
router.get('/:orgId', auth, getPostsByOrg);
router.post('/:postId/like', auth, reactToPost);
router.post('/:postId/comment', auth, commentOnPost);
router.delete('/:postId/comment/:commentId', auth, deleteComment);
router.put('/:postId/comment/:commentId', auth, editComment);
router.post('/:postId/comment/:commentId/react', auth, reactToComment);
router.put('/:postId', auth, editPost);
router.delete('/:postId', auth, deletePost);

module.exports = router;