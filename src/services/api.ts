import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
});

// LocalStorage থেকে টোকেন নিয়ে রিকোয়েস্টের সাথে পাঠানো
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});