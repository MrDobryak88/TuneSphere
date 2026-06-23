package com.tunesphere.service.impl;

import com.tunesphere.dto.SongRequest;
import com.tunesphere.dto.SongResponse;
import com.tunesphere.entity.Artist;
import com.tunesphere.entity.Song;
import com.tunesphere.event.KafkaProducerService;
import com.tunesphere.event.SongPlayedEvent;
import com.tunesphere.repository.ArtistRepository;
import com.tunesphere.repository.SongRepository;
import com.tunesphere.service.FileStorageService;
import com.tunesphere.service.absInt.SongService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Реализация SongService.
 * Отвечает за бизнес-логику треков + интеграцию с Kafka.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SongServiceImpl implements SongService {

    private final SongRepository songRepository;
    private final ArtistRepository artistRepository;
    private final FileStorageService fileStorageService;
    private final KafkaProducerService kafkaProducerService;

    @Override
    @Transactional
    public SongResponse updateSong(Long id, SongRequest request, Long userId) {
        Song song = songRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Song not found"));

        // TODO: Проверить, что пользователь — владелец трека или админ
        // Пока разрешаем всем обновлять (для простоты)

        if (request.getTitle() != null) song.setTitle(request.getTitle());
        if (request.getGenre() != null) song.setGenre(request.getGenre());
        if (request.getDuration() != null) song.setDuration(request.getDuration());

        Song saved = songRepository.save(song);
        String artistName = getArtistName(saved);
        return mapToResponse(saved, artistName);
    }

    @Override
    @Transactional
    public void deleteSong(Long id, Long userId) {
        Song song = songRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Song not found"));

        // TODO: Проверить права доступа
        songRepository.delete(song);
    }

    private String getArtistName(Song song) {
        if (song.getArtists() == null || song.getArtists().isEmpty()) {
            return "Unknown Artist";
        }
        return song.getArtists().iterator().next().getName();
    }
    @Override
    @Transactional
    public SongResponse uploadSong(SongRequest request, MultipartFile audioFile, MultipartFile coverFile) throws IOException {


        String audioFilename = fileStorageService.saveFile(audioFile, "song");

        String coverFilename = null;
        if (coverFile != null && !coverFile.isEmpty()) {
            coverFilename = fileStorageService.saveFile(coverFile, "cover");
        }

        Song song = Song.builder()
                .title(request.getTitle())
                .duration(request.getDuration() != null ? request.getDuration() : 1)
                .audioUrl(audioFilename)
                .coverUrl(coverFilename)
                .genre(request.getGenre())
                .playCount(0L)
                .isActive(true)
                .build();

        if (request.getArtistId() != null) {
            Artist artist = artistRepository.findById(request.getArtistId())
                    .orElseThrow(() -> new RuntimeException("Artist not found: " + request.getArtistId()));
            song.getArtists().add(artist);
        }

        Song savedSong = songRepository.save(song);

        String artistName = request.getArtistId() != null
                ? artistRepository.findById(request.getArtistId()).map(Artist::getName).orElse("Unknown Artist")
                : "Unknown Artist";

        log.info("Song uploaded: {} (ID: {})", savedSong.getTitle(), savedSong.getId());
        return mapToResponse(savedSong, artistName);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SongResponse> getAllSongs() {
        Map<Long, String> artistNames = songRepository.findSongArtistNames().stream()
                .filter(row -> row[1] != null)
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (String) row[1],
                        (left, right) -> left
                ));

        return songRepository.findAll().stream()
                .map(song -> mapToResponse(song, artistNames.getOrDefault(song.getId(), "Unknown Artist")))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SongResponse getSongById(Long id) {
        Map<Long, String> artistNames = songRepository.findSongArtistNames().stream()
                .filter(row -> row[1] != null)
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (String) row[1],
                        (left, right) -> left
                ));

        Song song = songRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Song not found: " + id));
        return mapToResponse(song, artistNames.getOrDefault(song.getId(), "Unknown Artist"));
    }

    @Override
    @Transactional
    public void incrementPlayCount(Long songId, Long userId, String username) {
        songRepository.incrementPlayCount(songId);

        // Отправляем событие в Kafka
        SongPlayedEvent event = SongPlayedEvent.builder()
                .songId(songId)
                .userId(userId)
                .username(username)
                .playedAt(LocalDateTime.now())
                .build();

        kafkaProducerService.sendSongPlayedEvent(event);

        log.info("Play count +1 for songId={}, user={}", songId, username);
    }

    public SongResponse mapToResponse(Song song, String artistName) {
        return SongResponse.builder()
                .id(song.getId())
                .title(song.getTitle())
                .artistName(artistName)
                .duration(song.getDuration())
                .audioUrl(resolveMediaUrl(song.getAudioUrl(), "/uploads/songs/"))
                .coverUrl(song.getCoverUrl() != null ? resolveMediaUrl(song.getCoverUrl(), "/uploads/covers/") : null)
                .playCount(song.getPlayCount())
                .genre(song.getGenre())
                .build();
    }

    private String resolveMediaUrl(String stored, String localPrefix) {
        if (stored == null) return null;
        if (stored.startsWith("http://") || stored.startsWith("https://")) {
            return stored;
        }
        return localPrefix + stored;
    }
}