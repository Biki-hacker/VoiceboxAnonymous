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
  reactToComment,
  editPost,
  deletePost
} = require('../controllers/postController');

const router = express.Router();

router.post('/', createPost);
router.post('/:postId/like', reactToPost);
router.post('/:postId/comment', commentOnPost);
router.post('/:postId/comment/:commentId/react', reactToComment);

router.put('/:postId', editPost);
router.delete('/:postId', deletePost);

router.put('/:postId/comment/:commentId', editComment);
router.delete('/:postId/comment/:commentId', deleteComment);

router.get('/stats/:orgId', getPostStats);
router.get('/:orgId', getPostsByOrg);

module.exports = router;
