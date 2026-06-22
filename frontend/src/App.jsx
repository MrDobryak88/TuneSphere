import { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Upload, Heart, User } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [audio] = useState(new Audio());

  useEffect(() => {
    loadSongs();
    loadArtists();
  }, []);

  const loadSongs = async () => {
    const res = await axios.get('http://localhost:8080/api/v1/songs');
    setSongs(res.data);
  };

  const loadArtists = async () => {
    const res = await axios.get('http://localhost:8080/api/v1/artists');
    setArtists(res.data);
  };

  const playSong = (song) => {
    audio.src = `http://localhost:8080${song.audioUrl}`;
    audio.play();
    setCurrentSong(song);

    // Уведомляем бэкенд о прослушивании
    axios.post(`http://localhost:8080/api/v1/songs/${song.id}/play`, {
      userId: 1, // заменить на реального пользователя после авторизации
      username: "testuser"
    });

    toast.success(`Now playing: ${song.title}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Toaster position="top-center" />

      <header className="bg-black p-6 flex justify-between items-center border-b border-zinc-800">
        <h1 className="text-4xl font-bold text-emerald-500">TuneSphere</h1>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-emerald-600 px-6 py-3 rounded-xl hover:bg-emerald-700">
            <Upload size={20} /> Upload
          </button>
          <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-xl">
            <User /> testuser
          </div>
        </div>
      </header>

      <div className="p-8">
        <h2 className="text-2xl mb-6">Popular Songs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {songs.map(song => (
            <div key={song.id}
                 className="bg-zinc-900 rounded-2xl overflow-hidden hover:scale-105 transition cursor-pointer"
                 onClick={() => playSong(song)}>
              <img
                src={song.coverUrl || '/placeholder.jpg'}
                className="w-full h-48 object-cover"
                alt={song.title}
              />
              <div className="p-4">
                <h3 className="font-semibold">{song.title}</h3>
                <p className="text-zinc-400 text-sm">{song.playCount} plays</p>
                <button className="mt-3 text-emerald-500">
                  <Play size={28} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-700 p-4">
          Now playing: <strong>{currentSong.title}</strong>
        </div>
      )}
    </div>
  );
}

export default App;