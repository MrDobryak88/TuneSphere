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
export const fetchSongs = async () => (await api.get('/songs')).data;
export const fetchArtists = async () => (await api.get('/artists')).data;
export const getArtistById = async (id) => (await api.get(`/artists/${id}`)).data;

export const uploadSong = async (formData) => {
  const res = await api.post('/songs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const updateSong = async (id, data) => (await api.put(`/songs/${id}`, data)).data;
export const deleteSong = async (id) => { await api.delete(`/songs/${id}`); };

export const recordPlay = async (songId, user) => {
  const params = {};
  if (user) {
    params.userId = user.id;
    params.username = user.username;
  }
  await api.post(`/songs/${songId}/play`, null, { params });
};

// ===== MY SONGS =====
export const getMySongs = async () => (await api.get('/my/songs')).data;
export const updateMySong = async (id, data) => (await api.put(`/my/songs/${id}`, data)).data;
export const deleteMySong = async (id) => { await api.delete(`/my/songs/${id}`); };

// ===== PROFILE =====
export const getMyProfile = async () => (await api.get('/users/me')).data;
export const updateMyProfile = async (data) => (await api.put('/users/me', data)).data;
export const getUserById = async (id) => (await api.get(`/users/${id}`)).data;

export const uploadAvatar = async (formData) => {
  const res = await api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ===== PLAYLISTS =====
export const createPlaylist = async (data) => (await api.post('/playlists', data)).data;
export const getPlaylistById = async (id) => (await api.get(`/playlists/${id}`)).data;
export const getUserPlaylists = async (userId) => (await api.get(`/playlists/user/${userId}`)).data;
export const getPublicPlaylists = async () => (await api.get('/playlists/public')).data;
export const updatePlaylist = async (id, data) => (await api.put(`/playlists/${id}`, data)).data;
export const deletePlaylist = async (id) => { await api.delete(`/playlists/${id}`); };
export const addSongToPlaylist = async (playlistId, songId) =>
  (await api.post(`/playlists/${playlistId}/songs/${songId}`)).data;
export const removeSongFromPlaylist = async (playlistId, songId) =>
  (await api.delete(`/playlists/${playlistId}/songs/${songId}`)).data;

// ===== LIKES & FAVORITES =====
export const likeSong = async (songId) => { await api.post(`/users/me/likes/songs/${songId}`); };
export const unlikeSong = async (songId) => { await api.delete(`/users/me/likes/songs/${songId}`); };
export const getLikedSongs = async () => (await api.get('/users/me/likes/songs')).data;

export const addToFavorites = async (songId) => { await api.post(`/users/me/favorites/songs/${songId}`); };
export const removeFromFavorites = async (songId) => { await api.delete(`/users/me/favorites/songs/${songId}`); };
export const getFavoriteSongs = async () => (await api.get('/users/me/favorites/songs')).data;

// ===== FOLLOWS =====
export const followArtist = async (artistId) => { await api.post(`/users/me/follows/artists/${artistId}`); };
export const unfollowArtist = async (artistId) => { await api.delete(`/users/me/follows/artists/${artistId}`); };
export const getFollowedArtists = async () => (await api.get('/users/me/follows/artists')).data;

// ===== ACTIVITY =====
export const getMyActivity = async () => (await api.get('/activity/me')).data;
export const getGlobalActivity = async () => (await api.get('/activity/global')).data;

// ===== ADMIN =====
export const getAdminStats = async () => (await api.get('/admin/stats')).data;
export const adminDeleteSong = async (id) => { await api.delete(`/admin/songs/${id}`); };

// ===== UTILS =====
export const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `http://localhost:8080${url}`;
  return url;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tunesphere_auth');
};