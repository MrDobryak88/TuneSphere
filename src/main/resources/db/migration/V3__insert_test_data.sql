-- =============================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- =============================================

-- Пароль для всех тестовых пользователей: "password"
-- (захэшировано через BCrypt)

INSERT INTO users (username, email, password, role, avatar_url) VALUES
('admin', 'admin@tunesphere.com', '$2a$10$8K1p2rW8vL9mN7xQjRtY5uZ3vPqWvX9kLmN7xQjRtY5uZ3vPqWvX9', 'ADMIN', 'https://i.pravatar.cc/150?img=1'),
('artist1', 'artist1@tunesphere.com', '$2a$10$8K1p2rW8vL9mN7xQjRtY5uZ3vPqWvX9kLmN7xQjRtY5uZ3vPqWvX9', 'ARTIST', 'https://i.pravatar.cc/150?img=2'),
('user1', 'user1@tunesphere.com', '$2a$10$8K1p2rW8vL9mN7xQjRtY5uZ3vPqWvX9kLmN7xQjRtY5uZ3vPqWvX9', 'USER', 'https://i.pravatar.cc/150?img=3');

-- Артисты
INSERT INTO artists (name, bio, avatar_url, followers_count) VALUES
('The Midnight', 'Synthwave duo from Los Angeles', 'https://i.pravatar.cc/150?img=4', 12400),
('Odesza', 'Electronic music duo', 'https://i.pravatar.cc/150?img=5', 8900),
('Tycho', 'Ambient / Electronic artist', 'https://i.pravatar.cc/150?img=6', 6700);

-- Альбомы
INSERT INTO albums (title, description, release_year, cover_url) VALUES
('Nocturnal', 'Classic synthwave album', 2022, 'https://picsum.photos/id/1015/300/300'),
('A Moment Apart', 'Beautiful electronic album', 2017, 'https://picsum.photos/id/201/300/300');

-- Песни
INSERT INTO songs (title, duration, audio_url, cover_url, genre, play_count, album_id) VALUES
('Los Angeles', 245, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://picsum.photos/id/1015/300/300', 'Synthwave', 15420, 1),
('A Moment Apart', 312, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://picsum.photos/id/201/300/300', 'Electronic', 8740, 2),
('Sunset', 198, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', null, 'Synthwave', 5430, 1);

-- Плейлисты
INSERT INTO playlists (title, description, is_public, user_id) VALUES
('Chill Synthwave', 'Best relaxing synth tracks', true, 1),
('My Favorites 2025', 'Personal playlist', false, 3);