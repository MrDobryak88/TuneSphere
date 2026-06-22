-- ManyToMany связи
CREATE TABLE songs_artists (
    song_id BIGINT REFERENCES songs(id) ON DELETE CASCADE,
    artist_id BIGINT REFERENCES artists(id) ON DELETE CASCADE,
    PRIMARY KEY (song_id, artist_id)
);

CREATE TABLE playlist_songs (
    playlist_id BIGINT REFERENCES playlists(id) ON DELETE CASCADE,
    song_id BIGINT REFERENCES songs(id) ON DELETE CASCADE,
    PRIMARY KEY (playlist_id, song_id)
);

CREATE TABLE user_liked_songs (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    song_id BIGINT REFERENCES songs(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, song_id)
);

CREATE TABLE user_favorite_songs (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    song_id BIGINT REFERENCES songs(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, song_id)
);

CREATE TABLE user_followed_artists (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    artist_id BIGINT REFERENCES artists(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, artist_id)
);

-- Индексы для производительности
CREATE INDEX idx_songs_artist ON songs_artists(artist_id);
CREATE INDEX idx_songs_genre ON songs(genre);
CREATE INDEX idx_playlists_user ON playlists(user_id);
