// src/utils/uploadMedia.js
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export const uploadMedia = async (file, onProgress) => {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload an image or video file.');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `posts/${fileName}`;
    const fileType = file.type.startsWith('image/') ? 'image' : 'video';

    console.log('Starting upload for file:', file.name, 'Type:', fileType, 'Size:', file.size);

    // Upload the file to Supabase Storage with error handling
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        onUploadProgress: (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log(`Upload progress: ${percent}%`);
          if (onProgress) {
            onProgress(percent);
          }
        }
      });

    if (uploadError) {
      console.error('Supabase upload error:', {
        message: uploadError.message,
        status: uploadError.statusCode,
        details: uploadError.error
      });
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('File uploaded successfully:', uploadData);

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    console.log('Generated public URL:', publicUrl);
    
    if (!publicUrl) {
      throw new Error('Failed to generate public URL for the uploaded file');
    }

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadMedia:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
};

// Helper function to check if a URL is a video
const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

export const getMediaType = (url) => {
  return isVideoUrl(url) ? 'video' : 'image';
};
