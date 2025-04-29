// src/api/auth.js
import API from './axios';

export const verifyEmployee = async (data) => {
  const res = await API.post('/auth/verify', data);
  return res.data;
};
