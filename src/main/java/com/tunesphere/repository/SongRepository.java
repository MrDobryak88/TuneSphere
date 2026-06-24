package com.tunesphere.repository;

import com.tunesphere.entity.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SongRepository extends JpaRepository<Song, Long> {
    long countByUserId(Long userId);
    List<Song> findByUserId(Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
    @Query("SELECT DISTINCT s FROM Song s LEFT JOIN FETCH s.artists")
    List<Song> findAllWithArtists();
    @Query("SELECT s FROM Song s LEFT JOIN FETCH s.artists WHERE s.id = :id")
    Optional<Song> findByIdWithArtists(Long id);

    @Query("SELECT s.id, a.name FROM Song s LEFT JOIN s.artists a")
    List<Object[]> findSongArtistNames();

    List<Song> findByArtistsId(Long artistId);   // ← важно!

    List<Song> findByGenre(String genre);

    @Modifying
    @Query("UPDATE Song s SET s.playCount = s.playCount + 1 WHERE s.id = :songId")
    void incrementPlayCount(Long songId);
}