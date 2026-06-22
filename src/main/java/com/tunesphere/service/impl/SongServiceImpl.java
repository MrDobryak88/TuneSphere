package com.tunesphere.service.impl;

import com.tunesphere.dto.SongRequest;
import com.tunesphere.dto.SongResponse;
import com.tunesphere.entity.Song;
import com.tunesphere.event.KafkaProducerService;
import com.tunesphere.event.SongPlayedEvent;
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
    private final FileStorageService fileStorageService;
    private final KafkaProducerService kafkaProducerService;

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
                .duration(request.getDuration())
                .audioUrl(audioFilename)
                .coverUrl(coverFilename)
                .genre(request.getGenre())
                .playCount(0L)
                .isActive(true)
                .build();

        Song savedSong = songRepository.save(song);

        log.info("Song uploaded: {} (ID: {})", savedSong.getTitle(), savedSong.getId());
        return mapToResponse(savedSong);
    }

    @Override
    public List<SongResponse> getAllSongs() {
        return songRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SongResponse getSongById(Long id) {
        Song song = songRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Song not found: " + id));
        return mapToResponse(song);
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

    private SongResponse mapToResponse(Song song) {
        return SongResponse.builder()
                .id(song.getId())
                .title(song.getTitle())
                .duration(song.getDuration())
                .audioUrl("/uploads/songs/" + song.getAudioUrl())
                .coverUrl(song.getCoverUrl() != null ? "/uploads/covers/" + song.getCoverUrl() : null)
                .playCount(song.getPlayCount())
                .genre(song.getGenre())
                .build();
    }
}