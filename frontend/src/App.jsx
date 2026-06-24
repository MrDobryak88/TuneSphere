import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { getMyActivity, getGlobalActivity } from './api';
import {
  login, register, logout, fetchSongs, fetchArtists, uploadSong,
  updateSong, deleteSong, recordPlay, getMySongs, updateMySong,
  deleteMySong, getMyProfile, updateMyProfile, uploadAvatar,
  getAdminStats, adminDeleteSong, adminGetAllUsers, adminUpdateUserRole,
  mediaUrl
} from './api';
import './App.css';

// ===== AUTH HELPERS =====
const AUTH_KEY = 'tunesphere_auth';
const loadAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveAuth = (auth) => {
  if (auth) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    localStorage.setItem('token', auth.accessToken);
  } else {
    logout();
  }
};

// ===== LAYOUT COMPONENT =====
function Layout({ user, setUser, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/login');
    toast.success('Вы вышли из системы');
  };

  const menuItems = [
    { path: '/', label: '🏠 Главная', icon: '🏠', public: true },
    { path: '/profile', label: '👤 Профиль', icon: '👤', auth: true },
    { path: '/my-songs', label: '🎵 Мои песни', icon: '🎵', auth: true, roles: ['ARTIST', 'ADMIN'] },
    { path: '/activity', label: '📊 Активность', icon: '📊', auth: true },
    { path: '/settings', label: '⚙️ Настройки', icon: '⚙️', auth: true },
    { path: '/admin', label: '🛡 Админ-панель', icon: '🛡', auth: true, roles: ['ADMIN'] },
  ];

  const visibleItems = menuItems.filter(item => {
    if (item.public) return true;
    if (!item.auth) return true;
    if (!user) return false;
    if (item.roles) return item.roles.includes(user.role);
    return true;
  });

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span>♫</span>
          <h2>TuneSphere</h2>
        </div>
        <nav>
          {visibleItems.map(item => (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => { e.preventDefault(); navigate(item.path); }}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        {user && (
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="avatar">
                {user.avatarUrl ? <img src={mediaUrl(user.avatarUrl)} alt="" /> : user.username[0]?.toUpperCase()}
              </div>
              <div>
                <div className="username">{user.username}</div>
                <div className="role">{user.role}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout">Выйти</button>
          </div>
        )}
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

// ===== PROTECTED ROUTE =====
function ProtectedRoute({ user, children, roles }) {
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

// ===== LOGIN PAGE =====
function LoginPage({ setUser }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'register') {
        await register(form.username, form.email, form.password);
        toast.success('Аккаунт создан! Войдите.');
        setMode('login');
        return;
      }
      const data = await login(form.username, form.password);
      saveAuth(data);
      setUser(data);
      toast.success(`Добро пожаловать, ${data.username}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка входа');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">♫</div>
        <h1>TuneSphere</h1>
        <p className="login-subtitle">Музыкальный стриминг нового поколения</p>

        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Вход</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Регистрация</button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <input
            placeholder="Имя пользователя"
            value={form.username}
            onChange={e => setForm({...form, username: e.target.value})}
            required
          />
          {mode === 'register' && (
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />
          )}
          <input
            type="password"
            placeholder="Пароль"
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            required
          />
          <button type="submit" className="btn btn-primary btn-full">
            {mode === 'login' ? '🔐 Войти' : '✨ Создать аккаунт'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ===== HOME PAGE =====
function HomePage({ user, onPlay, currentSong, isPlaying }) {
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    Promise.all([fetchSongs(), fetchArtists()])
      .then(([s, a]) => { setSongs(s); setArtists(a); })
      .catch(err => toast.error('Не удалось загрузить данные'));
  }, []);

  const filtered = songs.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.artistName?.toLowerCase().includes(search.toLowerCase()) ||
    s.genre?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту песню?')) return;
    try {
      await deleteSong(id);
      toast.success('Песня удалена');
      setSongs(songs.filter(s => s.id !== id));
    } catch {
      toast.error('Не удалось удалить');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>🎵 Каталог треков</h1>
        {user && (
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            ↑ Загрузить песню
          </button>
        )}
      </div>

      <input
        className="search-input"
        placeholder="🔍 Поиск по названию, артисту или жанру..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {artists.length > 0 && (
        <section className="section">
          <h2>🎤 Артисты</h2>
          <div className="artist-row">
            {artists.map(a => (
              <div key={a.id} className="artist-card">
                <img src={mediaUrl(a.avatarUrl) || `https://api.dicebear.com/7.x/initials/svg?seed=${a.name}`} alt={a.name} />
                <strong>{a.name}</strong>
                <span>{a.followersCount?.toLocaleString()} подписчиков</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2>🎶 Все треки ({filtered.length})</h2>
        {filtered.length === 0 ? (
          <p className="empty">Треки не найдены</p>
        ) : (
          <div className="song-grid">
            {filtered.map(song => (
              <div key={song.id} className={`song-card ${currentSong?.id === song.id ? 'active' : ''}`}>
                <div className="cover-wrap" onClick={() => onPlay(song)}>
                  <img src={mediaUrl(song.coverUrl) || `https://picsum.photos/seed/${song.id}/300/300`} alt={song.title} />
                  <button className="play-overlay">
                    {currentSong?.id === song.id && isPlaying ? '❚❚' : '▶'}
                  </button>
                </div>
                <div className="song-info">
                  <h3>{song.title}</h3>
                  <p>{song.artistName || 'Неизвестный артист'}</p>
                  <div className="song-meta">
                    <span>{song.genre || '—'}</span>
                    <span>{song.playCount?.toLocaleString()} plays</span>
                  </div>
                  {user && (user.role === 'ADMIN' || (user.role === 'ARTIST' && song.userId === user.id)) && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(song.id)}>
                      🗑️ Удалить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showUpload && (
        <UploadModal
          artists={artists}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            fetchSongs().then(setSongs);
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
}

// ===== UPLOAD MODAL =====
function UploadModal({ artists, onClose, onUploaded, user }) {
  const [form, setForm] = useState({
    title: '',
    genre: '',
    artistId: '',
    description: ''
  });
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);
  const [duration, setDuration] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Автоматическое определение длительности
  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        setDuration(Math.round(audio.duration));
        setAudioPreview(url);
      });
      return () => URL.revokeObjectURL(url);
    }
  }, [audioFile]);

  // Если пользователь — артист, автоматически выбираем его
  useEffect(() => {
    if (user?.role === 'ARTIST' && artists.length > 0) {
      // Ищем артиста, связанного с пользователем
      const userArtist = artists.find(a => a.name === user.username);
      if (userArtist) {
        setForm(prev => ({ ...prev, artistId: userArtist.id }));
      }
    }
  }, [user, artists]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        if (!form.title) {
          setForm(prev => ({
            ...prev,
            title: file.name.replace(/\.[^/.]+$/, '')
          }));
        }
      } else {
        toast.error('Можно загружать только аудиофайлы');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) {
      toast.error('Выберите аудиофайл');
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('genre', form.genre || 'Other');
      data.append('duration', String(duration || 1));
      if (form.artistId) data.append('artistId', form.artistId);
      if (form.description) data.append('description', form.description);
      data.append('audio', audioFile);
      if (coverFile) data.append('cover', coverFile);

      await uploadSong(data);
      toast.success('🎵 Песня загружена!');
      onUploaded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>🎵 Загрузить песню</h2>

        <form onSubmit={handleSubmit} className="form">
          {/* Drag & Drop зона */}
          <div
            className={`drop-zone ${dragActive ? 'active' : ''} ${audioFile ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('audio-input').click()}
          >
            {audioFile ? (
              <div className="drop-zone-content">
                <div className="audio-icon">🎵</div>
                <div className="file-info">
                  <strong>{audioFile.name}</strong>
                  <span>{(audioFile.size / 1024 / 1024).toFixed(2)} MB • {formatDuration(duration)}</span>
                </div>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAudioFile(null);
                    setAudioPreview(null);
                    setDuration(0);
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="drop-zone-content">
                <div className="upload-icon">📤</div>
                <p><strong>Перетащите аудиофайл сюда</strong></p>
                <p className="muted">или нажмите для выбора</p>
                <p className="muted">MP3, WAV, FLAC до 50MB</p>
              </div>
            )}
            <input
              id="audio-input"
              type="file"
              accept="audio/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  setAudioFile(file);
                  if (!form.title) {
                    setForm(prev => ({
                      ...prev,
                      title: file.name.replace(/\.[^/.]+$/, '')
                    }));
                  }
                }
              }}
              style={{ display: 'none' }}
            />
          </div>

          {/* Превью аудио */}
          {audioPreview && (
            <div className="audio-preview">
              <audio controls src={audioPreview} style={{ width: '100%' }} />
            </div>
          )}

          <label>
            Название
            <input
              required
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Название трека"
            />
          </label>

          <div className="form-row">
            <label>
              Жанр
              <input
                value={form.genre}
                onChange={e => setForm({...form, genre: e.target.value})}
                placeholder="Rock, Pop, Electronic..."
                list="genres"
              />
              <datalist id="genres">
                <option value="Rock" />
                <option value="Pop" />
                <option value="Electronic" />
                <option value="Hip-Hop" />
                <option value="Jazz" />
                <option value="Classical" />
                <option value="Synthwave" />
                <option value="Lo-Fi" />
              </datalist>
            </label>

            <label>
              Артист
              <select
                value={form.artistId}
                onChange={e => setForm({...form, artistId: e.target.value})}
              >
                <option value="">Не указан</option>
                {artists.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Описание (опционально)
            <textarea
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="О чём эта песня..."
              rows="2"
            />
          </label>

          <label>
            Обложка (опционально)
            <div className="cover-upload">
              {coverFile && (
                <img
                  src={URL.createObjectURL(coverFile)}
                  alt="Preview"
                  className="cover-preview"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={e => setCoverFile(e.target.files?.[0])}
              />
            </div>
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !audioFile}
          >
            {loading ? '⏳ Загрузка...' : '📤 Загрузить песню'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ===== PROFILE PAGE =====
function ProfilePage({ user, setUser }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getMyProfile().then(setProfile).catch(() => toast.error('Не удалось загрузить профиль'));
  }, []);

  if (!profile) return <div className="loading">Загрузка...</div>;

  return (
    <div>
      <h1>👤 Мой профиль</h1>
      <div className="profile-card">
        <div className="profile-avatar">
          {profile.avatarUrl ? <img src={mediaUrl(profile.avatarUrl)} alt="" /> : profile.username[0].toUpperCase()}
        </div>
        <div className="profile-info">
          <h2>{profile.username}</h2>
          <p>{profile.email}</p>
          <span className="role-badge">{profile.role}</span>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{profile.songsCount}</div>
          <div className="stat-label">Песен загружено</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile.playlistsCount}</div>
          <div className="stat-label">Плейлистов</div>
        </div>
      </div>
    </div>
  );
}

// ===== SETTINGS PAGE =====
function SettingsPage({ user, setUser }) {
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    avatarUrl: user?.avatarUrl || ''
  });
  const [avatarFile, setAvatarFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      const updated = await updateMyProfile(data);
      setUser({ ...user, username: updated.username, email: updated.email, avatarUrl: updated.avatarUrl });
      toast.success('Профиль обновлён!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка обновления');
    }
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      const res = await uploadAvatar(formData);
      setUser({ ...user, avatarUrl: res.avatarUrl });
      toast.success('Аватар обновлён!');
    } catch {
      toast.error('Не удалось загрузить аватар');
    }
  };

  return (
    <div>
      <h1>⚙️ Настройки</h1>
      <div className="settings-section">
        <h3>📷 Аватар</h3>
        <form onSubmit={handleAvatarUpload} className="settings-form">
          <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files?.[0])} />
          <button type="submit" className="btn btn-primary" disabled={!avatarFile}>Загрузить аватар</button>
        </form>
      </div>
      <div className="settings-section">
        <h3>👤 Личные данные</h3>
        <form onSubmit={handleSubmit} className="settings-form">
          <label>
            Имя пользователя
            <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </label>
          <label>
            Новый пароль (оставьте пустым, чтобы не менять)
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••" />
          </label>
          <button type="submit" className="btn btn-primary">💾 Сохранить изменения</button>
        </form>
      </div>
    </div>
  );
}

// ===== MY SONGS PAGE =====
function MySongsPage() {
  const [songs, setSongs] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => getMySongs().then(setSongs).catch(() => toast.error('Не удалось загрузить'));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту песню?')) return;
    try {
      await deleteMySong(id);
      toast.success('Удалено');
      load();
    } catch {
      toast.error('Не удалось удалить');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateMySong(editing.id, editing);
      toast.success('Обновлено');
      setEditing(null);
      load();
    } catch {
      toast.error('Не удалось обновить');
    }
  };

  return (
    <div>
      <h1>🎵 Мои песни</h1>
      {songs.length === 0 ? (
        <p className="empty">У вас пока нет песен. Загрузите первую!</p>
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
            <h2>Редактировать песню</h2>
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
// Новая страница
function ActivityPage({ user }) {
  const [activities, setActivities] = useState([]);
  const [tab, setTab] = useState('my');

  useEffect(() => {
    const load = async () => {
      try {
        const data = tab === 'my'
          ? await getMyActivity()
          : await getGlobalActivity();
        setActivities(data);
      } catch {
        toast.error('Не удалось загрузить активность');
      }
    };
    load();
  }, [tab]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff/60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff/3600)} ч назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div>
      <h1> Активность</h1>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={tab === 'my' ? 'active' : ''} onClick={() => setTab('my')}>
          👤 Моя активность
        </button>
        <button className={tab === 'global' ? 'active' : ''} onClick={() => setTab('global')}>
          🌍 Общая лента
        </button>
      </div>

      {activities.length === 0 ? (
        <p className="empty">
          {tab === 'my' ? 'Вы ещё ничего не слушали' : 'Пока нет активности'}
        </p>
      ) : (
        <div className="activity-list">
          {activities.map(a => (
            <div key={a.id} className="activity-item">
              <div className="activity-icon">🎵</div>
              <div className="activity-info">
                <strong>{a.songTitle}</strong>
                <span className="muted">{a.artistName}</span>
                {tab === 'global' && (
                  <span className="muted">• {a.username}</span>
                )}
              </div>
              <div className="activity-time">{formatTime(a.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// ===== ADMIN PAGE =====
function AdminPage() {
  const [stats, setStats] = useState(null);
  const [songs, setSongs] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('songs');

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {});
    fetchSongs().then(setSongs).catch(() => {});
    adminGetAllUsers().then(setUsers).catch(() => {});
  }, []);

  const handleDeleteSong = async (id) => {
    if (!window.confirm('Удалить песню (админ)?')) return;
    try {
      await adminDeleteSong(id);
      toast.success('Удалено');
      setSongs(songs.filter(s => s.id !== id));
    } catch {
      toast.error('Не удалось удалить');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await adminUpdateUserRole(userId, newRole);
      toast.success('Роль изменена');
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      toast.error('Не удалось изменить роль');
    }
  };

  return (
    <div>
      <h1>🛡 Админ-панель</h1>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Пользователей</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalSongs}</div>
            <div className="stat-label">Песен</div>
          </div>
        </div>
      )}

      <div className="tabs" style={{ marginTop: '2rem' }}>
        <button className={activeTab === 'songs' ? 'active' : ''} onClick={() => setActiveTab('songs')}>🎵 Песни</button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>👥 Пользователи</button>
      </div>

      {activeTab === 'songs' && (
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
                <td>
                  <button onClick={() => handleDeleteSong(s.id)} className="btn btn-danger btn-sm">Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === 'users' && (
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>Имя</th><th>Email</th><th>Роль</th><th>Действия</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td><span className="role-badge">{u.role}</span></td>
                <td>
                  <select value={u.role} onChange={e => handleChangeRole(u.id, e.target.value)} className="role-select">
                    <option value="USER">USER</option>
                    <option value="ARTIST">ARTIST</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ===== PLAYER COMPONENT =====
function Player({ currentSong, isPlaying, setIsPlaying, user }) {
  const audioRef = useRef(new Audio());
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  useEffect(() => {
    if (currentSong) {
      audioRef.current.src = mediaUrl(currentSong.audioUrl);
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
        if (user) recordPlay(currentSong.id, user).catch(() => {});
      }
    }
  }, [currentSong]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  return (
    <footer className="player">
      <img src={mediaUrl(currentSong.coverUrl) || `https://picsum.photos/seed/${currentSong.id}/80/80`} alt="" className="player-cover" />
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

// ===== MAIN APP =====
export default function App() {
  const [user, setUser] = useState(loadAuth);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
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
                  <Route path="/settings" element={<ProtectedRoute user={user}><SettingsPage user={user} setUser={setUser} /></ProtectedRoute>} />
                  <Route path="/my-songs" element={<ProtectedRoute user={user} roles={['ARTIST', 'ADMIN']}><MySongsPage /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute user={user} roles={['ADMIN']}><AdminPage /></ProtectedRoute>} />
                  <Route path="/activity" element={
                    <ProtectedRoute user={user}>
                      <ActivityPage user={user} />
                    </ProtectedRoute>
                  } />
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