// src/pages/CreatePost.jsx
import React, { useState } from 'react';
import { api } from '../api/axios';
import { uploadMedia } from '../utils/uploadMedia';

const CreatePost = () => {
  const [postType, setPostType] = useState('feedback');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [mediaFile, setMediaFile] = useState(null);

  const handleMediaUpload = async () => {
    if (mediaFile) {
      const url = await uploadMedia(mediaFile);
      setMedia([...media, url]);
    }
  };

  const handleSubmit = async () => {
    try {
      await api.post('/posts', {
        organizationId: 'your_org_id',
        postType,
        content,
        media,
        isAnonymous: true,
      });
      alert('Post created successfully!');
    } catch (err) {
      console.error(err);
      alert('Error creating post');
    }
  };

  return (
    <div>
      <h2>Create a Post</h2>

      <select value={postType} onChange={(e) => setPostType(e.target.value)}>
        <option value="feedback">Feedback</option>
        <option value="complaint">Complaint</option>
        <option value="suggestion">Suggestion</option>
        <option value="discussion">Public Discussion</option>
      </select>

      <textarea
        placeholder="Write your message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      ></textarea>

      <input type="file" onChange={(e) => setMediaFile(e.target.files[0])} />
      <button onClick={handleMediaUpload}>Upload Media</button>

      <button onClick={handleSubmit}>Submit Post</button>

      <ul>
        {media.map((url, i) => (
          <li key={i}>
            <a href={url} target="_blank" rel="noopener noreferrer">
              Media {i + 1}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CreatePost;
