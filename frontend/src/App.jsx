import { useState, useEffect, useRef, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  fetchSongs,
  fetchArtists,
  login,
  register,
  uploadSong,
  recordPlay,
  mediaUrl,
} from './api';
import './App.css';

const AUTH_KEY = 'tunesphere_auth';

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAuth(auth) {
  if (auth) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    localStorage.setItem('token', auth.accessToken);
  } else {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('token');
  }
}

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getAudioDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      const duration = Math.max(1, Math.round(audio.duration));
      URL.revokeObjectURL(url);
      resolve(duration);
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(1);
    });
  });
}

function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await login(form.username, form.password);
        const auth = { ...data, id: null };
        saveAuth(auth);
        onSuccess(auth);
        toast.success(`Welcome, ${data.username}!`);
      } else {
        await register(form.username, form.email, form.password);
        const data = await login(form.username, form.password);
        saveAuth(data);
        onSuccess(data);
        toast.success('Account created!');
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Auth failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} type="button">×</button>
        <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
        <div className="tabs">
          <button
            type="button"
            className={mode === 'login' ? 'tab active' : 'tab'}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'tab active' : 'tab'}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Username
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="yourname"
            />
          </label>
          {mode === 'register' && (
            <label>
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@email.com"
              />
            </label>
          )}
          <label>
            Password
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••"
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}

function UploadModal({ artists, onClose, onUploaded }) {
  const [form, setForm] = useState({ title: '', genre: '', artistId: '' });
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) {
      toast.error('Select an audio file');
      return;
    }
    setLoading(true);
    try {
      const duration = await getAudioDuration(audioFile);
      const data = new FormData();
      data.append('title', form.title);
      data.append('genre', form.genre || 'Other');
      data.append('duration', String(duration));
      if (form.artistId) data.append('artistId', form.artistId);
      data.append('audio', audioFile);
      if (coverFile) data.append('cover', coverFile);

      await uploadSong(data);
      toast.success('Track uploaded!');
      onUploaded();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} type="button">×</button>
        <h2>Upload track</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Title
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Track name"
            />
          </label>
          <label>
            Genre
            <input
              value={form.genre}
              onChange={(e) => setForm({ ...form, genre: e.target.value })}
              placeholder="Synthwave, Electronic…"
            />
          </label>
          <label>
            Artist
            <select
              value={form.artistId}
              onChange={(e) => setForm({ ...form, artistId: e.target.value })}
            >
              <option value="">No artist</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <label>
            Audio file (MP3, WAV…)
            <input
              required
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            />
          </label>
          <label>
            Cover image (optional)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Uploading…' : 'Upload'}
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [user, setUser] = useState(loadAuth);
  const [search, setSearch] = useState('');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const audioRef = useRef(new Audio());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [songsData, artistsData] = await Promise.all([fetchSongs(), fetchArtists()]);
      setSongs(songsData);
      setArtists(artistsData);
    } catch {
      toast.error('Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const audio = audioRef.current;
    const onTime = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, []);

  const playSong = async (song) => {
    const audio = audioRef.current;
    const url = mediaUrl(song.audioUrl);
    if (currentSong?.id === song.id && isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    if (currentSong?.id === song.id) {
      audio.play();
      setIsPlaying(true);
      return;
    }
    audio.src = url;
    setCurrentSong(song);
    setProgress(0);
    try {
      await audio.play();
      setIsPlaying(true);
      recordPlay(song.id, user).catch(() => {});
    } catch {
      toast.error('Cannot play this track');
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!currentSong) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const logout = () => {
    saveAuth(null);
    setUser(null);
    toast.success('Signed out');
  };

  const filtered = songs.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.artistName?.toLowerCase().includes(q) ||
      s.genre?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="app">
      <Toaster position="top-center" toastOptions={{ className: 'toast' }} />

      <header className="header">
        <div className="brand">
          <span className="brand-icon">♫</span>
          <h1>TuneSphere</h1>
        </div>
        <div className="search-wrap">
          <input
            className="search"
            placeholder="Search tracks, artists, genres…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="header-actions">
          {user ? (
            <>
              <button className="btn btn-primary" type="button" onClick={() => setShowUpload(true)}>
                ↑ Upload
              </button>
              <div className="user-chip">
                <span className="user-avatar">{user.username[0]?.toUpperCase()}</span>
                <span>{user.username}</span>
                <span className="role-badge">{user.role}</span>
              </div>
              <button className="btn btn-ghost" type="button" onClick={logout}>Logout</button>
            </>
          ) : (
            <button className="btn btn-primary" type="button" onClick={() => setShowAuth(true)}>
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {artists.length > 0 && (
          <section className="section">
            <h2>Artists</h2>
            <div className="artist-row">
              {artists.map((artist) => (
                <div key={artist.id} className="artist-card">
                  <img
                    src={mediaUrl(artist.avatarUrl) || `https://api.dicebear.com/7.x/initials/svg?seed=${artist.name}`}
                    alt={artist.name}
                  />
                  <strong>{artist.name}</strong>
                  <span>{artist.followersCount?.toLocaleString() ?? 0} followers</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <h2>Tracks {loading && <span className="muted">loading…</span>}</h2>
          {filtered.length === 0 && !loading ? (
            <p className="empty">No tracks found. Upload one or clear search.</p>
          ) : (
            <div className="song-grid">
              {filtered.map((song) => (
                <article
                  key={song.id}
                  className={`song-card ${currentSong?.id === song.id ? 'active' : ''}`}
                  onClick={() => playSong(song)}
                >
                  <div className="cover-wrap">
                    <img
                      src={mediaUrl(song.coverUrl) || `https://picsum.photos/seed/${song.id}/300/300`}
                      alt={song.title}
                    />
                    <button className="play-overlay" type="button" aria-label="Play">
                      {currentSong?.id === song.id && isPlaying ? '❚❚' : '▶'}
                    </button>
                  </div>
                  <div className="song-info">
                    <h3>{song.title}</h3>
                    <p>{song.artistName}</p>
                    <div className="song-meta">
                      <span>{song.genre || '—'}</span>
                      <span>{formatDuration(song.duration)}</span>
                      <span>{song.playCount?.toLocaleString() ?? 0} plays</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {currentSong && (
        <footer className="player">
          <img
            src={mediaUrl(currentSong.coverUrl) || `https://picsum.photos/seed/${currentSong.id}/80/80`}
            alt=""
            className="player-cover"
          />
          <div className="player-info">
            <strong>{currentSong.title}</strong>
            <span>{currentSong.artistName}</span>
          </div>
          <button className="player-btn" type="button" onClick={togglePlay}>
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </footer>
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={setUser}
        />
      )}

      {showUpload && user && (
        <UploadModal
          artists={artists}
          onClose={() => setShowUpload(false)}
          onUploaded={loadData}
        />
      )}
    </div>
  );
}

export default App;
