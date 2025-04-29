// src/utils/uploadMedia.js
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export const uploadMedia = async (file) => {
  const fileExt = file.name.split('.').pop();
  const filePath = `posts/${uuidv4()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('media')
    .upload(filePath, file);

  if (error) throw error;

  const { data: urlData } = await supabase.storage
    .from('media')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};
