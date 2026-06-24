import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== AUTH =====
export const login = async (username, password) => {
  const res = await api.post('/auth/login', { usernameOrEmail: username, password });
  return res.data;
};

export const register = async (username, email, password) => {
  const res = await api.post('/auth/register', { username, email, password });
  return res.data;
};

// ===== SONGS =====
export const fetchSongs = async () => {
  const res = await api.get('/songs');
  return res.data;
};

export const fetchArtists = async () => {
  const res = await api.get('/artists');
  return res.data;
};

export const uploadSong = async (formData) => {
  const res = await api.post('/songs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const updateSong = async (songId, data) => {
  const res = await api.put(`/songs/${songId}`, data);
  return res.data;
};

export const deleteSong = async (songId) => {
  await api.delete(`/songs/${songId}`);
};

export const recordPlay = async (songId, user) => {
  const params = {};
  if (user) {
    params.userId = user.id;
    params.username = user.username;
  }
  await api.post(`/songs/${songId}/play`, null, { params });
};

// ===== MY SONGS =====
export const getMySongs = async () => {
  const res = await api.get('/my/songs');
  return res.data;
};

export const updateMySong = async (id, data) => {
  const res = await api.put(`/my/songs/${id}`, data);
  return res.data;
};

export const deleteMySong = async (id) => {
  await api.delete(`/my/songs/${id}`);
};

// ===== PROFILE =====
export const getMyProfile = async () => {
  const res = await api.get('/users/me');
  return res.data;
};

export const updateMyProfile = async (data) => {
  const res = await api.put('/users/me', data);
  return res.data;
};

export const uploadAvatar = async (formData) => {
  const res = await api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ===== ADMIN =====
export const getAdminStats = async () => {
  const res = await api.get('/admin/stats');
  return res.data;
};

export const adminDeleteSong = async (id) => {
  await api.delete(`/admin/songs/${id}`);
};

export const adminGetAllUsers = async () => {
  const res = await api.get('/admin/users');
  return res.data;
};

export const adminUpdateUserRole = async (userId, role) => {
  const res = await api.put(`/admin/users/${userId}/role`, { role });
  return res.data;
};

// ===== UTILS =====
export const mediaUrl = (url) => {
  if (!url) return null;
  // Если URL уже внешний (начинается с http/https) - возвращаем как есть
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Если URL локальный (начинается с /uploads/) - добавляем базовый URL
  if (url.startsWith('/uploads/')) {
    return `http://localhost:8080${url}`;
  }
  // Если URL локальный без префикса - добавляем /uploads/songs/
  return `http://localhost:8080/uploads/songs/${url}`;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tunesphere_auth');
};

// ===== ACTIVITY =====
export const getMyActivity = async () => {
  const res = await api.get('/activity/me');
  return res.data;
};

export const getGlobalActivity = async () => {
  const res = await api.get('/activity/global');
  return res.data;
};