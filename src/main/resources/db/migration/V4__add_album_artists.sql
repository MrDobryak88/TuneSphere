-- Таблица связи альбомов с артистами (требуется entity Album)
CREATE TABLE IF NOT EXISTS album_artists (
    album_id BIGINT REFERENCES albums(id) ON DELETE CASCADE,
    artist_id BIGINT REFERENCES artists(id) ON DELETE CASCADE,
    PRIMARY KEY (album_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_album_artists_artist ON album_artists(artist_id);
