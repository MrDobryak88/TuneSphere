-- Добавляем связь user -> artist
ALTER TABLE artists ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_artists_user ON artists(user_id);

-- Создаем артистов для всех пользователей с ролью ARTIST
INSERT INTO artists (name, bio, avatar_url, followers_count, user_id, created_at, updated_at)
SELECT
    username as name,
    'Artist profile' as bio,
    avatar_url,
    0 as followers_count,
    id as user_id,
    NOW() as created_at,
    NOW() as updated_at
FROM users
WHERE role = 'ARTIST'
AND id NOT IN (SELECT user_id FROM artists WHERE user_id IS NOT NULL);