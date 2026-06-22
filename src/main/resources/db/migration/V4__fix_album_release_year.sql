-- V4__fix_album_release_year.sql
ALTER TABLE albums
ALTER COLUMN release_year TYPE TIMESTAMP(6)
USING release_year::timestamp;