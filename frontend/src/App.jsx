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
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addSongToPlaylist,
  removeSongFromPlaylist,
  deletePlaylist,
  likeSong,
  unlikeSong,
  getLikedSongs,
  addToFavorites,
  removeFromFavorites,
  getFavoriteSongs,
  followArtist,
  unfollowArtist,
  getFollowedArtists,
  deleteSong,
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

// ===== AUTH MODAL =====
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

// ===== UPLOAD MODAL =====
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

// ===== CREATE PLAYLIST MODAL =====
function CreatePlaylistModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', isPublic: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createPlaylist(form);
      toast.success('Playlist created!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create playlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} type="button">×</button>
        <h2>Create Playlist</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Title
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="My Playlist"
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
              rows="3"
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
            />
            Public playlist
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ===== ADD TO PLAYLIST MODAL =====
function AddToPlaylistModal({ song, playlists, onClose, onAdded }) {
  const handleAdd = async (playlistId) => {
    try {
      await addSongToPlaylist(playlistId, song.id);
      toast.success(`Added to playlist!`);
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} type="button">×</button>
        <h2>Add to Playlist</h2>
        {playlists.length === 0 ? (
          <p className="empty">No playlists yet. Create one first!</p>
        ) : (
          <div className="playlist-list">
            {playlists.map((pl) => (
              <div key={pl.id} className="playlist-item" onClick={() => handleAdd(pl.id)}>
                <strong>{pl.title}</strong>
                <span>{pl.songCount || 0} tracks</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== VIEW PLAYLIST MODAL =====
function ViewPlaylistModal({ playlistId, onClose, onRefresh }) {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPlaylistById(playlistId);
        setPlaylist(data);
      } catch {
        toast.error('Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [playlistId]);

  const handleRemove = async (songId) => {
    try {
      await removeSongFromPlaylist(playlistId, songId);
      toast.success('Removed from playlist');
      const data = await getPlaylistById(playlistId);
      setPlaylist(data);
      onRefresh();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this playlist?')) return;
    try {
      await deletePlaylist(playlistId);
      toast.success('Playlist deleted');
      onClose();
      onRefresh();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="modal-overlay"><div className="modal">Loading…</div></div>;
  if (!playlist) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} type="button">×</button>
        <h2>{playlist.title}</h2>
        {playlist.description && <p className="muted">{playlist.description}</p>}
        <button className="btn btn-ghost" onClick={handleDelete} style={{ marginBottom: '1rem' }}>
          Delete Playlist
        </button>
        {playlist.songs?.length === 0 ? (
          <p className="empty">No tracks in this playlist</p>
        ) : (
          <div className="playlist-songs">
            {playlist.songs?.map((song) => (
              <div key={song.id} className="playlist-song-item">
                <div>
                  <strong>{song.title}</strong>
                  <span className="muted">{song.artistName}</span>
                </div>
                <button className="btn btn-ghost" onClick={() => handleRemove(song.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== MAIN APP =====
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
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(null);
  const [showViewPlaylist, setShowViewPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, liked, favorites, playlists
  const [likedSongs, setLikedSongs] = useState([]);
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [likedSongIds, setLikedSongIds] = useState(new Set());
  const [favoriteSongIds, setFavoriteSongIds] = useState(new Set());
  const [followedArtistIds, setFollowedArtistIds] = useState(new Set());

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

  const loadUserData = useCallback(async () => {
    if (!user) return;
    try {
      const [liked, favorites, followed, playlists] = await Promise.all([
        getLikedSongs(),
        getFavoriteSongs(),
        getFollowedArtists(),
        getUserPlaylists(user.id || 1), // TODO: fix userId
      ]);
      setLikedSongs(liked);
      setFavoriteSongs(favorites);
      setFollowedArtists(followed);
      setUserPlaylists(playlists);
      setLikedSongIds(new Set(liked.map(s => s.id)));
      setFavoriteSongIds(new Set(favorites.map(s => s.id)));
      setFollowedArtistIds(new Set(followed.map(a => a.id)));
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (user) loadUserData();
  }, [user, loadUserData]);

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
    setLikedSongIds(new Set());
    setFavoriteSongIds(new Set());
    setFollowedArtistIds(new Set());
    toast.success('Signed out');
  };

  const handleLike = async (songId) => {
    if (!user) { toast.error('Please sign in'); return; }
    try {
      if (likedSongIds.has(songId)) {
        await unlikeSong(songId);
        setLikedSongIds(prev => { const n = new Set(prev); n.delete(songId); return n; });
        toast.success('Unliked');
      } else {
        await likeSong(songId);
        setLikedSongIds(prev => new Set(prev).add(songId));
        toast.success('Liked!');
      }
    } catch {
      toast.error('Failed');
    }
  };

  const handleFavorite = async (songId) => {
    if (!user) { toast.error('Please sign in'); return; }
    try {
      if (favoriteSongIds.has(songId)) {
        await removeFromFavorites(songId);
        setFavoriteSongIds(prev => { const n = new Set(prev); n.delete(songId); return n; });
        toast.success('Removed from favorites');
      } else {
        await addToFavorites(songId);
        setFavoriteSongIds(prev => new Set(prev).add(songId));
        toast.success('Added to favorites!');
      }
    } catch {
      toast.error('Failed');
    }
  };

  const handleFollow = async (artistId) => {
    if (!user) { toast.error('Please sign in'); return; }
    try {
      if (followedArtistIds.has(artistId)) {
        await unfollowArtist(artistId);
        setFollowedArtistIds(prev => { const n = new Set(prev); n.delete(artistId); return n; });
        toast.success('Unfollowed');
      } else {
        await followArtist(artistId);
        setFollowedArtistIds(prev => new Set(prev).add(artistId));
        toast.success('Following!');
      }
      loadUserData();
    } catch {
      toast.error('Failed');
    }
  };

  const handleDeleteSong = async (songId) => {
    if (!window.confirm('Delete this track?')) return;
    try {
      await deleteSong(songId);
      toast.success('Track deleted');
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = songs.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.artistName?.toLowerCase().includes(q) ||
      s.genre?.toLowerCase().includes(q)
    );
  });

  const displayedSongs = activeTab === 'liked'
    ? songs.filter(s => likedSongIds.has(s.id))
    : activeTab === 'favorites'
    ? songs.filter(s => favoriteSongIds.has(s.id))
    : filtered;

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
        {user && (
          <div className="tabs-section">
            <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Tracks</button>
            <button className={`tab ${activeTab === 'liked' ? 'active' : ''}`} onClick={() => setActiveTab('liked')}>❤️ Liked ({likedSongIds.size})</button>
            <button className={`tab ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>⭐ Favorites ({favoriteSongIds.size})</button>
            <button className={`tab ${activeTab === 'playlists' ? 'active' : ''}`} onClick={() => setActiveTab('playlists')}>📋 Playlists ({userPlaylists.length})</button>
          </div>
        )}

        {activeTab === 'playlists' ? (
          <section className="section">
            <div className="section-header">
              <h2>My Playlists</h2>
              <button className="btn btn-primary" onClick={() => setShowCreatePlaylist(true)}>+ Create</button>
            </div>
            {userPlaylists.length === 0 ? (
              <p className="empty">No playlists yet. Create your first one!</p>
            ) : (
              <div className="playlist-grid">
                {userPlaylists.map((pl) => (
                  <div key={pl.id} className="playlist-card" onClick={() => setShowViewPlaylist(pl.id)}>
                    <div className="playlist-icon">🎵</div>
                    <strong>{pl.title}</strong>
                    <span>{pl.songCount || 0} tracks</span>
                    <span className="muted">{pl.isPublic ? 'Public' : 'Private'}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {artists.length > 0 && activeTab === 'all' && (
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
                      {user && (
                        <button
                          className={`btn ${followedArtistIds.has(artist.id) ? 'btn-ghost' : 'btn-primary'}`}
                          onClick={() => handleFollow(artist.id)}
                          style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                        >
                          {followedArtistIds.has(artist.id) ? '✓ Following' : '+ Follow'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="section">
              <h2>
                {activeTab === 'all' && 'Tracks'}
                {activeTab === 'liked' && 'Liked Tracks'}
                {activeTab === 'favorites' && 'Favorite Tracks'}
                {loading && <span className="muted">loading…</span>}
              </h2>
              {displayedSongs.length === 0 && !loading ? (
                <p className="empty">
                  {activeTab === 'all' ? 'No tracks found. Upload one or clear search.' : 'No tracks here yet.'}
                </p>
              ) : (
                <div className="song-grid">
                  {displayedSongs.map((song) => (
                    <article
                      key={song.id}
                      className={`song-card ${currentSong?.id === song.id ? 'active' : ''}`}
                    >
                      <div className="cover-wrap" onClick={() => playSong(song)}>
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
                        {user && (
                          <div className="song-actions">
                            <button
                              className={`icon-btn ${likedSongIds.has(song.id) ? 'active' : ''}`}
                              onClick={() => handleLike(song.id)}
                              title="Like"
                            >
                              {likedSongIds.has(song.id) ? '❤️' : '🤍'}
                            </button>
                            <button
                              className={`icon-btn ${favoriteSongIds.has(song.id) ? 'active' : ''}`}
                              onClick={() => handleFavorite(song.id)}
                              title="Favorite"
                            >
                              {favoriteSongIds.has(song.id) ? '⭐' : '☆'}
                            </button>
                            <button
                              className="icon-btn"
                              onClick={() => setShowAddToPlaylist(song)}
                              title="Add to playlist"
                            >
                              📋
                            </button>
                            <button
                              className="icon-btn"
                              onClick={() => handleDeleteSong(song.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
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

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={setUser} />}
      {showUpload && user && <UploadModal artists={artists} onClose={() => setShowUpload(false)} onUploaded={loadData} />}
      {showCreatePlaylist && user && <CreatePlaylistModal onClose={() => setShowCreatePlaylist(false)} onCreated={loadUserData} />}
      {showAddToPlaylist && user && (
        <AddToPlaylistModal
          song={showAddToPlaylist}
          playlists={userPlaylists}
          onClose={() => setShowAddToPlaylist(null)}
          onAdded={loadUserData}
        />
      )}
      {showViewPlaylist && user && (
        <ViewPlaylistModal
          playlistId={showViewPlaylist}
          onClose={() => setShowViewPlaylist(null)}
          onRefresh={loadUserData}
        />
      )}
    </div>
  );
}

export default App;