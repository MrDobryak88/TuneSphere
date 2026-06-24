-- Добавляем владельца песни
ALTER TABLE songs ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_songs_user ON songs(user_id);