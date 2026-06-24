package com.tunesphere.service.impl;

import com.tunesphere.dto.SongRequest;
import com.tunesphere.dto.SongResponse;
import com.tunesphere.entity.Artist;
import com.tunesphere.entity.Song;
import com.tunesphere.entity.User;
import com.tunesphere.event.KafkaProducerService;
import com.tunesphere.event.SongPlayedEvent;
import com.tunesphere.repository.ArtistRepository;
import com.tunesphere.repository.SongRepository;
import com.tunesphere.repository.UserRepository;
import com.tunesphere.service.FileStorageService;
import com.tunesphere.service.absInt.SongService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SongServiceImpl implements SongService {

    private final SongRepository songRepository;
    private final ArtistRepository artistRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final KafkaProducerService kafkaProducerService;

    @Override
    @Transactional
    public SongResponse uploadSong(SongRequest request, MultipartFile audioFile, MultipartFile coverFile, Long userId) throws IOException {
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

        // Привязываем пользователя
        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            song.setUser(user);
        }

        // Инициализируем коллекцию артистов
        if (song.getArtists() == null) {
            song.setArtists(new HashSet<>());
        }

        // Добавляем артиста
        if (request.getArtistId() != null) {
            Artist artist = artistRepository.findById(request.getArtistId())
                    .orElseThrow(() -> new RuntimeException("Artist not found: " + request.getArtistId()));
            song.getArtists().add(artist);
        }

        Song savedSong = songRepository.save(song);

        String artistName = song.getArtists() != null && !song.getArtists().isEmpty()
                ? song.getArtists().iterator().next().getName()
                : "Unknown Artist";

        log.info("Song uploaded: {} (ID: {}, Artist: {})", savedSong.getTitle(), savedSong.getId(), artistName);
        return mapToResponse(savedSong, artistName);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SongResponse> getAllSongs() {
        return songRepository.findAll().stream()
                .map(song -> mapToResponse(song, getArtistName(song)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SongResponse getSongById(Long id) {
        Song song = songRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Song not found: " + id));
        return mapToResponse(song, getArtistName(song));
    }

    @Override
    @Transactional
    public void incrementPlayCount(Long songId, Long userId, String username) {
        songRepository.incrementPlayCount(songId);

        SongPlayedEvent event = SongPlayedEvent.builder()
                .songId(songId)
                .userId(userId)
                .username(username)
                .playedAt(LocalDateTime.now())
                .build();

        kafkaProducerService.sendSongPlayedEvent(event);
        log.info("Play count +1 for songId={}, user={}", songId, username);
    }

    @Override
    @Transactional
    public SongResponse updateSong(Long id, SongRequest request, Long userId) {
        Song song = songRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Song not found"));

        // Проверяем права (только владелец или админ)
        if (song.getUser() != null && song.getUser().getId() != null &&
                !song.getUser().getId().equals(userId)) {
            throw new RuntimeException("You don't have permission to update this song");
        }

        if (request.getTitle() != null) song.setTitle(request.getTitle());
        if (request.getGenre() != null) song.setGenre(request.getGenre());
        if (request.getDuration() != null) song.setDuration(request.getDuration());

        Song saved = songRepository.save(song);
        return mapToResponse(saved, getArtistName(saved));
    }

    @Override
    @Transactional
    public void deleteSong(Long id, Long userId) {
        Song song = songRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Song not found"));

        // Проверяем права
        if (song.getUser() != null && song.getUser().getId() != null &&
                !song.getUser().getId().equals(userId)) {
            throw new RuntimeException("You don't have permission to delete this song");
        }

        songRepository.delete(song);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SongResponse> getSongsByUser(Long userId) {
        return songRepository.findByUserId(userId).stream()
                .map(song -> mapToResponse(song, getArtistName(song)))
                .collect(Collectors.toList());
    }

    private String getArtistName(Song song) {
        if (song.getArtists() == null || song.getArtists().isEmpty()) {
            return "Unknown Artist";
        }
        return song.getArtists().iterator().next().getName();
    }
    public SongResponse mapToResponse(Song song, String artistName) {
        return SongResponse.builder()
                .id(song.getId())
                .title(song.getTitle())
                .artistName(artistName)
                .duration(song.getDuration())
                .audioUrl(resolveMediaUrl(song.getAudioUrl()))
                .coverUrl(resolveCoverUrl(song.getCoverUrl()))
                .playCount(song.getPlayCount())
                .genre(song.getGenre())
                .build();
    }

    private String resolveMediaUrl(String stored) {
        if (stored == null) return null;
        // Если URL уже внешний - возвращаем как есть
        if (stored.startsWith("http://") || stored.startsWith("https://")) {
            return stored;
        }
        // Если URL локальный - добавляем префикс
        return "/uploads/songs/" + stored;
    }
    private String resolveCoverUrl(String stored) {
        if (stored == null) return null;
        // Если URL уже внешний - возвращаем как есть
        if (stored.startsWith("http://") || stored.startsWith("https://")) {
            return stored;
        }
        // Если URL локальный - добавляем префикс для обложек
        return "/uploads/covers/" + stored;
    }
}