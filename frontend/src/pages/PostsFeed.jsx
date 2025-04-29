import React, { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { formatDistanceToNow } from 'date-fns';

// Reaction memory using localStorage
const hasReacted = (commentId, type) => {
  const reacted = JSON.parse(localStorage.getItem('reactions') || '{}');
  return reacted[`${commentId}_${type}`] === true;
};

const markReacted = (commentId, type) => {
  const reacted = JSON.parse(localStorage.getItem('reactions') || '{}');
  reacted[`${commentId}_${type}`] = true;
  localStorage.setItem('reactions', JSON.stringify(reacted));
};

const PostsFeed = () => {
  const [posts, setPosts] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedText, setEditedText] = useState('');
  const orgId = localStorage.getItem('orgId');

  useEffect(() => {
    if (!orgId) return;
    api.get(`/posts/${orgId}`)
      .then(res => setPosts(res.data))
      .catch(err => console.error('Error fetching posts:', err));
  }, [orgId]);

  const refreshPosts = () => {
    api.get(`/posts/${orgId}`).then(res => setPosts(res.data));
  };

  const handleReact = async (postId, commentId, type) => {
    if (hasReacted(commentId, type)) {
      return alert(`You've already reacted with ${type}.`);
    }
    await api.post(`/posts/${postId}/comment/${commentId}/react`, { type });
    markReacted(commentId, type);
    refreshPosts();
  };

  const handleComment = async (postId) => {
    if (!commentText[postId]) return;
    await api.post(`/posts/${postId}/comment`, { text: commentText[postId] });
    setCommentText({ ...commentText, [postId]: '' });
    refreshPosts();
  };

  const handleDelete = async (postId, commentId) => {
    await api.delete(`/posts/${postId}/comment/${commentId}`);
    refreshPosts();
  };

  const handleEdit = async (postId, commentId) => {
    await api.put(`/posts/${postId}/comment/${commentId}`, { text: editedText });
    setEditingCommentId(null);
    refreshPosts();
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Anonymous Posts</h2>
      {posts.map((post) => (
        <div key={post._id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px' }}>
          <h4>{post.postType.toUpperCase()}</h4>
          <p>{post.content}</p>
          <p><small>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</small></p>

          {post.mediaUrl && (
            <div style={{ marginTop: '1rem' }}>
              {post.mediaUrl.match(/\.(jpg|jpeg|png|gif)$/) ? (
                <img src={post.mediaUrl} alt="media" style={{ width: '300px' }} />
              ) : post.mediaUrl.match(/\.(mp4)$/) ? (
                <video src={post.mediaUrl} controls width="300" />
              ) : post.mediaUrl.match(/\.(mp3)$/) ? (
                <audio controls src={post.mediaUrl} />
              ) : (
                <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer">Open Media</a>
              )}
            </div>
          )}

          <div style={{ marginTop: '1rem' }}>
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText[post._id] || ''}
              onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
              style={{ marginRight: '0.5rem' }}
            />
            <button onClick={() => handleComment(post._id)}>Comment</button>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <strong>Comments:</strong>
            <ul>
              {[...(post.comments || [])]
                .sort((a, b) => {
                  const aReacts = Object.values(a.reactions || {}).reduce((sum, v) => sum + v, 0);
                  const bReacts = Object.values(b.reactions || {}).reduce((sum, v) => sum + v, 0);
                  return bReacts - aReacts;
                })
                .map((c) => (
                  <li key={c._id} style={{ marginBottom: '1rem' }}>
                    {editingCommentId === c._id ? (
                      <>
                        <input
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                        />
                        <button onClick={() => handleEdit(post._id, c._id)}>Save</button>
                        <button onClick={() => setEditingCommentId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        {c.text}
                        <br />
                        <small>
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                          {c.updatedAt && ' (edited)'}
                        </small>
                        <br />
                        <button onClick={() => {
                          setEditingCommentId(c._id);
                          setEditedText(c.text);
                        }}>✏️ Edit</button>
                        <button onClick={() => handleDelete(post._id, c._id)}>🗑️ Delete</button>
                        <br />
                        <p><strong>Total Reactions:</strong> {
                          Object.values(c.reactions || {}).reduce((sum, v) => sum + v, 0)
                        }</p>
                        <span style={{ fontSize: '1.2rem' }}>
                          <button onClick={() => handleReact(post._id, c._id, 'like')}>👍 {c.reactions?.like || 0}</button>
                          <button onClick={() => handleReact(post._id, c._id, 'love')}>❤️ {c.reactions?.love || 0}</button>
                          <button onClick={() => handleReact(post._id, c._id, 'laugh')}>😂 {c.reactions?.laugh || 0}</button>
                          <button onClick={() => handleReact(post._id, c._id, 'angry')}>😡 {c.reactions?.angry || 0}</button>
                        </span>
                      </>
                    )}
                  </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostsFeed;
