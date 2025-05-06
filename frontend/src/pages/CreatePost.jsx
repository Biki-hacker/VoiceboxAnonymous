// src/pages/CreatePost.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../api/axios';
import { uploadMedia } from '../utils/uploadMedia';

const CreatePost = () => {
  const [postType, setPostType] = useState('feedback');
  const [content, setContent] = useState('');
  const [region, setRegion] = useState('');
  const [department, setDepartment] = useState('');
  const [media, setMedia] = useState([]);
  const [mediaFile, setMediaFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [posts, setPosts] = useState([]);

  const ORG_ID = 'your_org_id'; // Replace with real orgId or prop/context

  // Fetch existing posts
  const fetchPosts = async () => {
    try {
      const res = await api.get(`/posts/${ORG_ID}`);
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleMediaUpload = async () => {
    if (!mediaFile) return;
    setIsUploading(true);
    try {
      const url = await uploadMedia(mediaFile);
      setMedia((prev) => [...prev, url]);
      setMediaFile(null);
    } catch (err) {
      console.error('Media upload failed:', err);
      alert('Failed to upload media.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setPostType('feedback');
    setContent('');
    setRegion('');
    setDepartment('');
    setMedia([]);
    setEditingPostId(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingPostId) {
        // Edit mode
        await api.put(`/posts/${editingPostId}`, {
          postType,
          content,
          media: media,
          region: region || undefined,
          department: department || undefined,
        });
        alert('Post updated successfully!');
      } else {
        // Create mode
        await api.post('/posts', {
          organizationId: ORG_ID,
          postType,
          content,
          region: region || undefined,
          department: department || undefined,
          media,
          isAnonymous: true,
        });
        alert('Post created successfully!');
      }
      resetForm();
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert('Error submitting post');
    }
  };

  const handleMediaRemove = (index) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  const handleEdit = (post) => {
    setEditingPostId(post._id);
    setPostType(post.postType);
    setContent(post.content);
    setRegion(post.region || '');
    setDepartment(post.department || '');
    setMedia(post.media || []);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      alert('Post deleted');
      fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
      <h2>{editingPostId ? 'Edit Post' : 'Create a Post'}</h2>

      <label>
        Post Type:
        <select value={postType} onChange={(e) => setPostType(e.target.value)}>
          <option value="feedback">Feedback</option>
          <option value="complaint">Complaint</option>
          <option value="suggestion">Suggestion</option>
          <option value="discussion">Public Discussion</option>
        </select>
      </label>

      <br />

      <label>
        Message:
        <textarea
          rows="5"
          placeholder="Write your message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: '100%', marginTop: 8 }}
        ></textarea>
      </label>

      <br />

      <label>
        Region (optional):
        <input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="e.g. East Zone, APAC"
        />
      </label>

      <br />

      <label>
        Department (optional):
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="e.g. HR, Engineering"
        />
      </label>

      <br />

      <label>
        Upload Media:
        <input
          type="file"
          onChange={(e) => setMediaFile(e.target.files[0])}
        />
      </label>
      <button onClick={handleMediaUpload} disabled={isUploading || !mediaFile}>
        {isUploading ? 'Uploading...' : 'Upload Media'}
      </button>

      {media.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <strong>Uploaded Media:</strong>
          <ul>
            {media.map((url, i) => (
              <li key={i}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Media {i + 1}
                </a>{' '}
                <button onClick={() => handleMediaRemove(i)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <br />
      <button onClick={handleSubmit} style={{ marginTop: 20 }}>
        {editingPostId ? 'Update Post' : 'Submit Post'}
      </button>
      {editingPostId && (
        <button onClick={resetForm} style={{ marginLeft: 10 }}>
          Cancel Edit
        </button>
      )}

      {/* List of existing posts */}
      <hr style={{ margin: '40px 0' }} />
      <h3>Your Posts</h3>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post._id} style={{ marginBottom: 20 }}>
              <p><strong>{post.postType.toUpperCase()}</strong> — {post.content}</p>
              <small>Region: {post.region || 'N/A'} | Department: {post.department || 'N/A'}</small>
              <br />
              <button onClick={() => handleEdit(post)}>Edit</button>{' '}
              <button onClick={() => handleDelete(post._id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CreatePost;
