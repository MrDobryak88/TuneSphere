import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return path;
}

export async function login(usernameOrEmail, password) {
  const { data } = await api.post('/auth/login', { usernameOrEmail, password });
  return data;
}

export async function register(username, email, password) {
  const { data } = await api.post('/auth/register', { username, email, password });
  return data;
}

export async function fetchSongs() {
  const { data } = await api.get('/songs');
  return data;
}

export async function fetchArtists() {
  const { data } = await api.get('/artists');
  return data;
}

export async function uploadSong(formData) {
  const { data } = await api.post('/songs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function recordPlay(songId, user) {
  const params = new URLSearchParams();
  if (user?.id) params.set('userId', user.id);
  if (user?.username) params.set('username', user.username);
  await api.post(`/songs/${songId}/play?${params.toString()}`);
}

export default api;
