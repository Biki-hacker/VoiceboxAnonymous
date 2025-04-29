import React, { useState } from 'react';
import { uploadMedia } from '../utils/uploadMedia';

const CreatePost = () => {
  const [mediaFile, setMediaFile] = useState(null);
  const [uploadedURL, setUploadedURL] = useState('');

  const handleUpload = async () => {
    try {
      if (mediaFile) {
        const url = await uploadMedia(mediaFile);
        setUploadedURL(url);
        console.log('Uploaded URL:', url);
      }
    } catch (err) {
      console.error('Upload failed:', err.message);
    }
  };

  return (
    <div>
      <h3>Upload Media</h3>
      <input
        type="file"
        accept="image/*,audio/*,video/*"
        onChange={(e) => setMediaFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Upload</button>

      {uploadedURL && <p>Uploaded: <a href={uploadedURL}>{uploadedURL}</a></p>}
    </div>
  );
};

export default CreatePost;
