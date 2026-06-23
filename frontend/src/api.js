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

// ===== SONGS =====
export const fetchSongs = async () => {
  const res = await api.get('/songs');
  return res.data;
};

export const fetchArtists = async () => {
  const res = await api.get('/artists');
  return res.data;
};

export const login = async (username, password) => {
  const res = await api.post('/auth/login', { usernameOrEmail: username, password });
  return res.data;
};

export const register = async (username, email, password) => {
  const res = await api.post('/auth/register', { username, email, password });
  return res.data;
};

export const uploadSong = async (formData) => {
  const res = await api.post('/songs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const recordPlay = async (songId, user) => {
  const params = {};
  if (user) {
    params.userId = user.id;
    params.username = user.username;
  }
  await api.post(`/songs/${songId}/play`, null, { params });
};

export const updateSong = async (songId, data) => {
  const res = await api.put(`/songs/${songId}`, data);
  return res.data;
};

export const deleteSong = async (songId) => {
  await api.delete(`/songs/${songId}`);
};

export const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
};

// ===== PLAYLISTS =====
export const createPlaylist = async (data) => {
  const res = await api.post('/playlists', data);
  return res.data;
};

export const getUserPlaylists = async (userId) => {
  const res = await api.get(`/playlists/user/${userId}`);
  return res.data;
};

export const getPublicPlaylists = async () => {
  const res = await api.get('/playlists/public');
  return res.data;
};

export const getPlaylistById = async (id) => {
  const res = await api.get(`/playlists/${id}`);
  return res.data;
};

export const addSongToPlaylist = async (playlistId, songId) => {
  const res = await api.post(`/playlists/${playlistId}/songs/${songId}`);
  return res.data;
};

export const removeSongFromPlaylist = async (playlistId, songId) => {
  const res = await api.delete(`/playlists/${playlistId}/songs/${songId}`);
  return res.data;
};

export const deletePlaylist = async (playlistId) => {
  await api.delete(`/playlists/${playlistId}`);
};

// ===== LIKES =====
export const likeSong = async (songId) => {
  await api.post(`/users/me/likes/songs/${songId}`);
};

export const unlikeSong = async (songId) => {
  await api.delete(`/users/me/likes/songs/${songId}`);
};

export const getLikedSongs = async () => {
  const res = await api.get('/users/me/likes/songs');
  return res.data;
};

// ===== FAVORITES =====
export const addToFavorites = async (songId) => {
  await api.post(`/users/me/favorites/songs/${songId}`);
};

export const removeFromFavorites = async (songId) => {
  await api.delete(`/users/me/favorites/songs/${songId}`);
};

export const getFavoriteSongs = async () => {
  const res = await api.get('/users/me/favorites/songs');
  return res.data;
};

// ===== FOLLOWS =====
export const followArtist = async (artistId) => {
  await api.post(`/users/me/follows/artists/${artistId}`);
};

export const unfollowArtist = async (artistId) => {
  await api.delete(`/users/me/follows/artists/${artistId}`);
};

export const getFollowedArtists = async () => {
  const res = await api.get('/users/me/follows/artists');
  return res.data;
};