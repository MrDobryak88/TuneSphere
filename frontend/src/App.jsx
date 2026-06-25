import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import * as api from './api';
import './App.css';

const AUTH_KEY = 'tunesphere_auth';
const loadAuth = () => {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
};
const saveAuth = (auth) => {
  if (auth) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    localStorage.setItem('token', auth.accessToken);
  } else {
    api.logout();
  }
};

// НОВАЯ ФУНКЦИЯ - загружает реальный id пользователя
const loadUserProfile = async () => {
  try {
    const profile = await api.getMyProfile();
    const currentAuth = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    const updatedAuth = { ...currentAuth, id: profile.id, avatarUrl: profile.avatarUrl };
    localStorage.setItem(AUTH_KEY, JSON.stringify(updatedAuth));
    return updatedAuth;
  } catch {
    return null;
  }
};

// ==================== LAYOUT ====================
function Layout({ user, setUser, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Главная', icon: '🏠', public: true },
    { path: '/profile', label: 'Профиль', icon: '👤', auth: true },
    { path: '/playlists', label: 'Плейлисты', icon: '📋', auth: true },
    { path: '/my-songs', label: 'Мои песни', icon: '🎵', auth: true, roles: ['ARTIST', 'ADMIN'] },
    { path: '/liked', label: 'Понравилось', icon: '❤️', auth: true },
    { path: '/activity', label: 'Активность', icon: '📊', auth: true },
    { path: '/settings', label: 'Настройки', icon: '⚙️', auth: true },
    { path: '/admin', label: 'Админ-панель', icon: '🛡️', auth: true, roles: ['ADMIN'] },
  ];

  const visibleItems = menuItems.filter(item => {
    if (item.public) return true;
    if (!user) return false;
    if (item.roles) return item.roles.includes(user.role);
    return true;
  });

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="brand-logo">♫</div>
          <div>
            <h2>TuneSphere</h2>
            <span className="brand-subtitle">Music Streaming</span>
          </div>
        </div>

        <nav className="nav-menu">
          {visibleItems.map(item => (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => { e.preventDefault(); navigate(item.path); }}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </a>
          ))}
        </nav>

        {user && (
          <div className="sidebar-footer">
            <div className="user-chip" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
              <div className="user-avatar">
                {user.avatarUrl ? <img src={api.mediaUrl(user.avatarUrl)} alt="" /> : user.username[0]?.toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-name">{user.username}</div>
                <div className="user-role">{user.role}</div>
              </div>
            </div>
            <button onClick={() => { api.logout(); setUser(null); navigate('/login'); toast.success('До встречи!'); }} className="btn-logout">
              Выйти
            </button>
          </div>
        )}
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

function ProtectedRoute({ user, children, roles }) {
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

// ==================== LOGIN PAGE ====================
function LoginPage({ setUser }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'register') {
        await api.register(form.username, form.email, form.password);
        toast.success('Аккаунт создан! Войдите.');
        setMode('login');
        return;
      }
      const data = await api.login(form.username, form.password);
      saveAuth(data);

      // СРАЗУ загружаем реальный профиль с id
      const profile = await loadUserProfile();
      setUser(profile || data);

      toast.success(`Добро пожаловать, ${data.username}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка входа');
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg"></div>
      <div className="login-card">
        <div className="login-logo">♫</div>
        <h1>TuneSphere</h1>
        <p className="login-subtitle">Твой музыкальный мир</p>

        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Вход</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Регистрация</button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <input placeholder="Имя пользователя" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
          {mode === 'register' && (
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          )}
          <input type="password" placeholder="Пароль" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button type="submit" className="btn btn-primary btn-full btn-glow">
            {mode === 'login' ? '🔐 Войти' : '✨ Создать аккаунт'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==================== HOME PAGE ====================
function HomePage({ user, onPlay, currentSong, isPlaying }) {
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [addToPlaylistSong, setAddToPlaylistSong] = useState(null);

  useEffect(() => {
    Promise.all([api.fetchSongs(), api.fetchArtists()])
      .then(([s, a]) => { setSongs(s); setArtists(a); })
      .catch(() => toast.error('Не удалось загрузить данные'));
  }, []);

  const filtered = songs.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.artistName?.toLowerCase().includes(search.toLowerCase()) ||
    s.genre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Главная</h1>
          <p className="page-subtitle">Слушай любимую музыку</p>
        </div>
        {user && (
          <button className="btn btn-primary btn-glow" onClick={() => setShowUpload(true)}>
            ↑ Загрузить трек
          </button>
        )}
      </div>

      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="Поиск по названию, артисту или жанру..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {artists.length > 0 && (
        <section className="section">
          <h2 className="section-title">🎤 Артисты</h2>
          <div className="artist-row">
            {artists.map(a => (
              <div key={a.id} className="artist-card">
                <div className="artist-avatar">
                  <img src={api.mediaUrl(a.avatarUrl) || `https://api.dicebear.com/7.x/initials/svg?seed=${a.name}&backgroundColor=10b981`} alt={a.name} />
                </div>
                <strong>{a.name}</strong>
                <span>{a.followersCount?.toLocaleString()} подписчиков</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">🎶 Все треки ({filtered.length})</h2>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎵</div>
            <p>Треки не найдены</p>
          </div>
        ) : (
          <div className="song-grid">
            {filtered.map(song => (
              <SongCard
                key={song.id}
                song={song}
                user={user}
                onPlay={onPlay}
                isActive={currentSong?.id === song.id}
                isPlaying={isPlaying && currentSong?.id === song.id}
                onAddToPlaylist={() => setAddToPlaylistSong(song)}
                onRefresh={() => api.fetchSongs().then(setSongs)}
              />
            ))}
          </div>
        )}
      </section>

      {showUpload && (
        <UploadModal
          artists={artists}
          user={user}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { api.fetchSongs().then(setSongs); setShowUpload(false); }}
        />
      )}

      {addToPlaylistSong && user && (
        <AddToPlaylistModal
          song={addToPlaylistSong}
          onClose={() => setAddToPlaylistSong(null)}
        />
      )}
    </div>
  );
}

// ==================== SONG CARD ====================
function SongCard({ song, user, onPlay, isActive, isPlaying, onAddToPlaylist, onRefresh }) {
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) { toast.error('Войдите в аккаунт'); return; }
    try {
      if (liked) { await api.unlikeSong(song.id); setLiked(false); }
      else { await api.likeSong(song.id); setLiked(true); toast.success('❤️'); }
    } catch { toast.error('Ошибка'); }
  };

  const handleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) { toast.error('Войдите в аккаунт'); return; }
    try {
      if (favorited) { await api.removeFromFavorites(song.id); setFavorited(false); }
      else { await api.addToFavorites(song.id); setFavorited(true); toast.success('⭐ В избранном'); }
    } catch { toast.error('Ошибка'); }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Удалить эту песню?')) return;
    try {
      await api.deleteSong(song.id);
      toast.success('Удалено');
      onRefresh?.();
    } catch { toast.error('Не удалось удалить'); }
  };

  const formatDuration = (s) => {
    if (!s) return '0:00';
    return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  };

  return (
    <div className={`song-card ${isActive ? 'active' : ''}`}>
      <div className="song-cover" onClick={() => onPlay(song)}>
        <img src={api.mediaUrl(song.coverUrl) || `https://picsum.photos/seed/${song.id}/300/300`} alt={song.title} />
        <div className="play-overlay">
          <div className="play-btn-large">{isActive && isPlaying ? '❚❚' : '▶'}</div>
        </div>
        <div className="song-badge">{song.genre || 'Music'}</div>
      </div>
      <div className="song-info">
        <h3 className="song-title">{song.title}</h3>
        <p className="song-artist">{song.artistName || 'Неизвестный артист'}</p>
        <div className="song-meta">
          <span>🎧 {song.playCount?.toLocaleString() || 0}</span>
          <span>⏱ {formatDuration(song.duration)}</span>
        </div>
        {user && (
          <div className="song-actions">
            <button className={`action-btn ${liked ? 'active' : ''}`} onClick={handleLike} title="Лайк">
              {liked ? '❤️' : '🤍'}
            </button>
            <button className={`action-btn ${favorited ? 'active' : ''}`} onClick={handleFavorite} title="Избранное">
              {favorited ? '⭐' : '☆'}
            </button>
            <button className="action-btn" onClick={onAddToPlaylist} title="В плейлист">📋</button>
            {(user.role === 'ADMIN' || song.userId === user.id) && (
              <button className="action-btn danger" onClick={handleDelete} title="Удалить">🗑️</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== UPLOAD MODAL ====================
function UploadModal({ artists, user, onClose, onUploaded }) {
  const [form, setForm] = useState({ title: '', genre: '', artistId: '' });
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => setDuration(Math.round(audio.duration)));
      return () => URL.revokeObjectURL(url);
    }
  }, [audioFile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) { toast.error('Выберите аудиофайл'); return; }
    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('genre', form.genre || 'Other');
      data.append('duration', String(duration || 1));
      if (form.artistId) data.append('artistId', form.artistId);
      data.append('audio', audioFile);
      if (coverFile) data.append('cover', coverFile);

      await api.uploadSong(data);
      toast.success('🎵 Трек загружен!');
      onUploaded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('audio/')) {
      setAudioFile(file);
      setForm(prev => ({ ...prev, title: prev.title || file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>🎵 Загрузить трек</h2>

        <form onSubmit={handleSubmit} className="form">
          <div
            className={`drop-zone ${dragActive ? 'active' : ''} ${audioFile ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('audio-input').click()}
          >
            {audioFile ? (
              <>
                <div className="drop-icon">🎵</div>
                <strong>{audioFile.name}</strong>
                <span className="muted">{(audioFile.size/1024/1024).toFixed(2)} MB • {Math.floor(duration/60)}:{(duration%60).toString().padStart(2,'0')}</span>
                <button type="button" className="btn-remove" onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}>✕</button>
              </>
            ) : (
              <>
                <div className="drop-icon">📤</div>
                <strong>Перетащите аудио сюда</strong>
                <span className="muted">или нажмите для выбора</span>
              </>
            )}
            <input id="audio-input" type="file" accept="audio/*" style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setAudioFile(f); setForm(p => ({...p, title: p.title || f.name.replace(/\.[^/.]+$/,'')})); }
              }} />
          </div>

          <label>Название
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Название трека" />
          </label>

          <div className="form-row">
            <label>Жанр
              <input value={form.genre} onChange={e => setForm({...form, genre: e.target.value})} placeholder="Rock, Pop..." />
            </label>
            <label>Артист
              <select value={form.artistId} onChange={e => setForm({...form, artistId: e.target.value})}>
                <option value="">Не указан</option>
                {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
          </div>

          <label>Обложка (опционально)
            <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0])} />
          </label>

          <button type="submit" className="btn btn-primary btn-full btn-glow" disabled={loading || !audioFile}>
            {loading ? '⏳ Загрузка...' : '📤 Загрузить'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==================== ADD TO PLAYLIST MODAL ====================
function AddToPlaylistModal({ song, onClose }) {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    api.getPublicPlaylists().then(setPlaylists).catch(() => {});
  }, []);

  const handleAdd = async (plId) => {
    try {
      await api.addSongToPlaylist(plId, song.id);
      toast.success('Добавлено в плейлист!');
      onClose();
    } catch { toast.error('Ошибка'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Добавить в плейлист</h2>
        <p className="muted">Трек: <strong>{song.title}</strong></p>
        {playlists.length === 0 ? (
          <p className="empty">Нет доступных плейлистов</p>
        ) : (
          <div className="playlist-list">
            {playlists.map(pl => (
              <div key={pl.id} className="playlist-item" onClick={() => handleAdd(pl.id)}>
                <span>📋</span>
                <strong>{pl.title}</strong>
                <span className="muted">{pl.songCount || 0} треков</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== PROFILE PAGE ====================
function ProfilePage({ user, setUser }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.getMyProfile().then(setProfile).catch(() => toast.error('Ошибка загрузки'));
  }, []);

  if (!profile) return <div className="loading">Загрузка...</div>;

  return (
    <div className="page">
      <h1 className="page-title">Мой профиль</h1>
      <div className="profile-hero">
        <div className="profile-avatar-large">
          {profile.avatarUrl ? <img src={api.mediaUrl(profile.avatarUrl)} alt="" /> : profile.username[0].toUpperCase()}
        </div>
        <div className="profile-info">
          <h2>{profile.username}</h2>
          <p>{profile.email}</p>
          <span className="role-badge">{profile.role}</span>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎵</div>
          <div className="stat-value">{profile.songsCount}</div>
          <div className="stat-label">Треков</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{profile.playlistsCount}</div>
          <div className="stat-label">Плейлистов</div>
        </div>
      </div>
    </div>
  );
}

// ==================== PLAYLISTS PAGE ====================
function PlaylistsPage({ user }) {
  const [playlists, setPlaylists] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [viewing, setViewing] = useState(null);

  const load = () => {
    if (user) api.getUserPlaylists(user.id).then(setPlaylists).catch(() => {});
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📋 Мои плейлисты</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Создать</button>
      </div>

      {playlists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>У вас пока нет плейлистов</p>
        </div>
      ) : (
        <div className="playlist-grid">
          {playlists.map(pl => (
            <div key={pl.id} className="playlist-card-big" onClick={() => setViewing(pl.id)}>
              <div className="playlist-icon-big">🎵</div>
              <h3>{pl.title}</h3>
              <p className="muted">{pl.description || 'Без описания'}</p>
              <div className="playlist-meta">
                <span>{pl.songCount || 0} треков</span>
                <span>{pl.isPublic ? '🌍 Публичный' : '🔒 Приватный'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreatePlaylistModal onClose={() => setShowCreate(false)} onCreated={() => { load(); setShowCreate(false); }} />}
      {viewing && <ViewPlaylistModal playlistId={viewing} onClose={() => setViewing(null)} onRefresh={load} user={user} />}
    </div>
  );
}

function CreatePlaylistModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', isPublic: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createPlaylist(form);
      toast.success('Плейлист создан!');
      onCreated();
    } catch { toast.error('Ошибка'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Новый плейлист</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>Название
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          </label>
          <label>Описание
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="3" />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})} />
            Публичный плейлист
          </label>
          <button type="submit" className="btn btn-primary btn-full">Создать</button>
        </form>
      </div>
    </div>
  );
}

function ViewPlaylistModal({ playlistId, onClose, onRefresh, user }) {
  const [playlist, setPlaylist] = useState(null);

  useEffect(() => {
    api.getPlaylistById(playlistId).then(setPlaylist).catch(() => toast.error('Ошибка'));
  }, [playlistId]);

  const handleRemove = async (songId) => {
    try {
      await api.removeSongFromPlaylist(playlistId, songId);
      toast.success('Удалено');
      const updated = await api.getPlaylistById(playlistId);
      setPlaylist(updated);
      onRefresh();
    } catch { toast.error('Ошибка'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить плейлист?')) return;
    try {
      await api.deletePlaylist(playlistId);
      toast.success('Удалён');
      onClose();
      onRefresh();
    } catch { toast.error('Ошибка'); }
  };

  if (!playlist) return <div className="modal-overlay"><div className="modal">Загрузка...</div></div>;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{playlist.title}</h2>
        {playlist.description && <p className="muted">{playlist.description}</p>}
        <button className="btn btn-danger btn-sm" onClick={handleDelete} style={{ marginTop: '1rem' }}>🗑️ Удалить плейлист</button>

        {(!playlist.songs || playlist.songs.length === 0) ? (
          <p className="empty" style={{ marginTop: '1rem' }}>Плейлист пуст</p>
        ) : (
          <div className="playlist-songs-list">
            {playlist.songs.map(song => (
              <div key={song.id} className="playlist-song-row">
                <div>
                  <strong>{song.title}</strong>
                  <div className="muted">{song.artistName}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(song.id)}>Удалить</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== LIKED SONGS PAGE ====================
function LikedPage({ onPlay, currentSong, isPlaying }) {
  const [liked, setLiked] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [tab, setTab] = useState('liked');

  useEffect(() => {
    api.getLikedSongs().then(setLiked).catch(() => {});
    api.getFavoriteSongs().then(setFavorites).catch(() => {});
  }, []);

  const currentList = tab === 'liked' ? liked : favorites;

  return (
    <div className="page">
      <h1 className="page-title">{tab === 'liked' ? '❤️ Понравившиеся' : '⭐ Избранное'}</h1>
      <div className="tabs">
        <button className={tab === 'liked' ? 'active' : ''} onClick={() => setTab('liked')}>❤️ Лайки ({liked.length})</button>
        <button className={tab === 'favorites' ? 'active' : ''} onClick={() => setTab('favorites')}>⭐ Избранное ({favorites.length})</button>
      </div>

      {currentList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{tab === 'liked' ? '❤️' : '⭐'}</div>
          <p>Пока пусто</p>
        </div>
      ) : (
        <div className="song-grid">
          {currentList.map(song => (
            <SongCard key={song.id} song={song} user={{}} onPlay={onPlay}
              isActive={currentSong?.id === song.id} isPlaying={isPlaying && currentSong?.id === song.id} />
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== MY SONGS PAGE ====================
function MySongsPage() {
  const [songs, setSongs] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => api.getMySongs().then(setSongs).catch(() => toast.error('Ошибка'));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить?')) return;
    try { await api.deleteMySong(id); toast.success('Удалено'); load(); }
    catch { toast.error('Ошибка'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updateMySong(editing.id, { title: editing.title, genre: editing.genre });
      toast.success('Обновлено');
      setEditing(null);
      load();
    } catch { toast.error('Ошибка'); }
  };

  return (
    <div className="page">
      <h1 className="page-title">🎵 Мои песни</h1>
      {songs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎵</div>
          <p>Загрузите свой первый трек!</p>
        </div>
      ) : (
        <div className="my-songs-list">
          {songs.map(song => (
            <div key={song.id} className="my-song-item">
              <div className="my-song-info">
                <strong>{song.title}</strong>
                <div className="muted">{song.genre} • {song.playCount} прослушиваний</div>
              </div>
              <div className="actions">
                <button onClick={() => setEditing(song)} className="btn btn-ghost">✏️ Изменить</button>
                <button onClick={() => handleDelete(song.id)} className="btn btn-danger">🗑️ Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditing(null)}>×</button>
            <h2>Редактировать</h2>
            <form onSubmit={handleUpdate} className="form">
              <label>Название
                <input value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})} />
              </label>
              <label>Жанр
                <input value={editing.genre || ''} onChange={e => setEditing({...editing, genre: e.target.value})} />
              </label>
              <div className="modal-actions">
                <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost">Отмена</button>
                <button type="submit" className="btn btn-primary">💾 Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SETTINGS PAGE ====================
function SettingsPage({ user, setUser }) {
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      const updated = await api.updateMyProfile(data);
      setUser({ ...user, username: updated.username, email: updated.email, avatarUrl: updated.avatarUrl });
      toast.success('Сохранено!');
    } catch (err) { toast.error(err.response?.data?.message || 'Ошибка'); }
  };

const handleAvatarUpload = async (e) => {
  e.preventDefault();
  if (!avatarFile) return;
  const formData = new FormData();
  formData.append('file', avatarFile);  // <-- ИСПРАВЛЕНО: было 'avatar', стало 'file'
  try {
    const res = await api.uploadAvatar(formData);
    setUser({ ...user, avatarUrl: res.avatarUrl });
    toast.success('Аватар обновлён!');
  } catch (err) {
    console.error(err);
    toast.error(err.response?.data?.message || 'Не удалось загрузить аватар');
  }
};
  return (
    <div className="page">
      <h1 className="page-title">⚙️ Настройки</h1>

      <div className="settings-card">
        <h3>📷 Аватар</h3>
        <form onSubmit={handleAvatarUpload} className="settings-form">
          <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0])} />
          <button type="submit" className="btn btn-primary" disabled={!avatarFile}>Загрузить</button>
        </form>
      </div>

      <div className="settings-card">
        <h3>👤 Личные данные</h3>
        <form onSubmit={handleSubmit} className="settings-form">
          <label>Имя пользователя
            <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          </label>
          <label>Email
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </label>
          <label>Новый пароль
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Оставьте пустым" />
          </label>
          <button type="submit" className="btn btn-primary">💾 Сохранить</button>
        </form>
      </div>
    </div>
  );
}

// ==================== ACTIVITY PAGE ====================
function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [tab, setTab] = useState('my');

  useEffect(() => {
    const load = async () => {
      try {
        const data = tab === 'my' ? await api.getMyActivity() : await api.getGlobalActivity();
        setActivities(data);
      } catch { toast.error('Ошибка'); }
    };
    load();
  }, [tab]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = (new Date() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff/60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff/3600)} ч назад`;
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  return (
    <div className="page">
      <h1 className="page-title">📊 Активность</h1>
      <div className="tabs">
        <button className={tab === 'my' ? 'active' : ''} onClick={() => setTab('my')}>👤 Моя</button>
        <button className={tab === 'global' ? 'active' : ''} onClick={() => setTab('global')}>🌍 Общая</button>
      </div>

      {activities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>{tab === 'my' ? 'Вы ещё ничего не слушали' : 'Пока нет активности'}</p>
        </div>
      ) : (
        <div className="activity-list">
          {activities.map(a => (
            <div key={a.id} className="activity-item">
              <div className="activity-icon">🎵</div>
              <div className="activity-info">
                <strong>{a.songTitle}</strong>
                <span className="muted">{a.artistName}</span>
                {tab === 'global' && <span className="muted">• {a.username}</span>}
              </div>
              <div className="activity-time">{formatTime(a.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== ADMIN PAGE ====================
function AdminPage() {
  const [stats, setStats] = useState(null);
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    api.getAdminStats().then(setStats).catch(() => {});
    api.fetchSongs().then(setSongs).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить песню?')) return;
    try {
      await api.adminDeleteSong(id);
      toast.success('Удалено');
      setSongs(songs.filter(s => s.id !== id));
    } catch { toast.error('Ошибка'); }
  };

  return (
    <div className="page">
      <h1 className="page-title">🛡️ Админ-панель</h1>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Пользователей</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎵</div>
            <div className="stat-value">{stats.totalSongs}</div>
            <div className="stat-label">Треков</div>
          </div>
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>Все треки</h2>
      <table className="admin-table">
        <thead>
          <tr><th>ID</th><th>Название</th><th>Артист</th><th>Прослушиваний</th><th>Действия</th></tr>
        </thead>
        <tbody>
          {songs.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.title}</td>
              <td>{s.artistName}</td>
              <td>{s.playCount}</td>
              <td><button onClick={() => handleDelete(s.id)} className="btn btn-danger btn-sm">Удалить</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==================== PLAYER ====================
function Player({ currentSong, isPlaying, setIsPlaying, user }) {
  const audioRef = useRef(new Audio());
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  useEffect(() => {
    if (currentSong) {
      audioRef.current.src = api.mediaUrl(currentSong.audioUrl);
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
        if (user) api.recordPlay(currentSong.id, user).catch(() => {});
      }
    }
  }, [currentSong]);

  useEffect(() => {
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying]);

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  };

  if (!currentSong) return null;

  return (
    <footer className="player">
      <img src={api.mediaUrl(currentSong.coverUrl) || `https://picsum.photos/seed/${currentSong.id}/80/80`} alt="" className="player-cover" />
      <div className="player-info">
        <strong>{currentSong.title}</strong>
        <span>{currentSong.artistName}</span>
      </div>
      <button className="player-btn" onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <div className="progress-container">
        <span className="time">{formatTime(currentTime)}</span>
        <div className="progress-bar" onClick={handleSeek}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="time">{formatTime(duration)}</span>
      </div>
    </footer>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [user, setUser] = useState(loadAuth);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // При загрузке - получаем реальный id пользователя
  useEffect(() => {
    if (user && !user.id) {
      loadUserProfile().then(updated => {
        if (updated) setUser(updated);
      });
    }
  }, [user]);

  const handlePlay = (song) => {
    if (currentSong?.id === song.id) setIsPlaying(!isPlaying);
    else { setCurrentSong(song); setIsPlaying(true); }
  };

  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage setUser={setUser} />} />
        <Route path="/*" element={
          user ? (
            <>
              <Layout user={user} setUser={setUser}>
                <Routes>
                  <Route path="/" element={<HomePage user={user} onPlay={handlePlay} currentSong={currentSong} isPlaying={isPlaying} />} />
                  <Route path="/profile" element={<ProtectedRoute user={user}><ProfilePage user={user} setUser={setUser} /></ProtectedRoute>} />
                  <Route path="/playlists" element={<ProtectedRoute user={user}><PlaylistsPage user={user} /></ProtectedRoute>} />
                  <Route path="/liked" element={<ProtectedRoute user={user}><LikedPage onPlay={handlePlay} currentSong={currentSong} isPlaying={isPlaying} /></ProtectedRoute>} />
                  <Route path="/my-songs" element={<ProtectedRoute user={user} roles={['ARTIST', 'ADMIN']}><MySongsPage /></ProtectedRoute>} />
                  <Route path="/activity" element={<ProtectedRoute user={user}><ActivityPage /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute user={user}><SettingsPage user={user} setUser={setUser} /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute user={user} roles={['ADMIN']}><AdminPage /></ProtectedRoute>} />
                </Routes>
              </Layout>
              <Player currentSong={currentSong} isPlaying={isPlaying} setIsPlaying={setIsPlaying} user={user} />
            </>
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  );
}