-- Тестовые связи альбомов и песен с артистами
INSERT INTO album_artists (album_id, artist_id) VALUES
(1, 1),
(2, 2)
ON CONFLICT DO NOTHING;

INSERT INTO songs_artists (song_id, artist_id) VALUES
(1, 1),
(2, 2),
(3, 1)
ON CONFLICT DO NOTHING;
