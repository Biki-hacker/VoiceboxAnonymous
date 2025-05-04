// src/pages/CreatePost.jsx
import React, { useState } from 'react';
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

  const handleSubmit = async () => {
    try {
      await api.post('/posts', {
        organizationId: 'your_org_id', // Replace with actual orgId logic
        postType,
        content,
        region: region || undefined,
        department: department || undefined,
        media,
        isAnonymous: true,
      });
      alert('Post created successfully!');
      // Reset form
      setContent('');
      setRegion('');
      setDepartment('');
      setMedia([]);
    } catch (err) {
      console.error(err);
      alert('Error creating post');
    }
  };

  const handleMediaRemove = (index) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h2>Create a Post</h2>

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
        Submit Post
      </button>
    </div>
  );
};

export default CreatePost;
