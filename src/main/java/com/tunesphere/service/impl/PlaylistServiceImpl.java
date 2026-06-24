package com.tunesphere.service.impl;

import com.tunesphere.dto.PlaylistRequest;
import com.tunesphere.dto.PlaylistResponse;
import com.tunesphere.dto.SongResponse;
import com.tunesphere.entity.Playlist;
import com.tunesphere.entity.Song;
import com.tunesphere.entity.User;
import com.tunesphere.repository.PlaylistRepository;
import com.tunesphere.repository.SongRepository;
import com.tunesphere.repository.UserRepository;
import com.tunesphere.service.absInt.PlaylistService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaylistServiceImpl implements PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final SongRepository songRepository;
    private final UserRepository userRepository;
    private final SongServiceImpl songService; // для маппинга Song -> SongResponse

    @Override
    @Transactional
    public PlaylistResponse createPlaylist(PlaylistRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Playlist playlist = Playlist.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
                .user(user)
                .build();

        if (request.getSongIds() != null && !request.getSongIds().isEmpty()) {
            List<Song> songs = songRepository.findAllById(request.getSongIds());
            playlist.setSongs(songs.stream().collect(Collectors.toSet()));
        }

        Playlist saved = playlistRepository.save(playlist);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PlaylistResponse getPlaylistById(Long id) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));

        // Если плейлист приватный, проверяем права (упрощённо — разрешаем просмотр всем)
        return mapToResponse(playlist);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlaylistResponse> getUserPlaylists(Long userId) {
        return playlistRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlaylistResponse> getPublicPlaylists() {
        return playlistRepository.findByIsPublicTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PlaylistResponse updatePlaylist(Long id, PlaylistRequest request, Long userId) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));

        if (!playlist.getUser().getId().equals(userId)) {
            throw new RuntimeException("You don't have permission to edit this playlist");
        }

        playlist.setTitle(request.getTitle());
        playlist.setDescription(request.getDescription());
        if (request.getIsPublic() != null) {
            playlist.setIsPublic(request.getIsPublic());
        }

        Playlist saved = playlistRepository.save(playlist);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deletePlaylist(Long id, Long userId) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));

        if (!playlist.getUser().getId().equals(userId)) {
            throw new RuntimeException("You don't have permission to delete this playlist");
        }

        playlistRepository.delete(playlist);
    }

    @Override
    @Transactional
    public PlaylistResponse addSongToPlaylist(Long playlistId, Long songId, Long userId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));

        if (!playlist.getUser().getId().equals(userId)) {
            throw new RuntimeException("You don't have permission to edit this playlist");
        }

        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new RuntimeException("Song not found"));

        playlist.getSongs().add(song);
        Playlist saved = playlistRepository.save(playlist);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public PlaylistResponse removeSongFromPlaylist(Long playlistId, Long songId, Long userId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new RuntimeException("Playlist not found"));

        if (!playlist.getUser().getId().equals(userId)) {
            throw new RuntimeException("You don't have permission to edit this playlist");
        }

        playlist.getSongs().removeIf(s -> s.getId().equals(songId));
        Playlist saved = playlistRepository.save(playlist);
        return mapToResponse(saved);
    }

    public PlaylistResponse mapToResponse(Playlist playlist) {
        List<SongResponse> songs = playlist.getSongs() != null
                ? playlist.getSongs().stream()
                .map(song -> songService.mapToResponse(song, getArtistName(song)))
                .collect(Collectors.toList())
                : Collections.emptyList();

        String username = playlist.getUser() != null ? playlist.getUser().getUsername() : "Unknown";
        Long userId = playlist.getUser() != null ? playlist.getUser().getId() : null;

        return PlaylistResponse.builder()
                .id(playlist.getId())
                .title(playlist.getTitle())
                .description(playlist.getDescription())
                .isPublic(playlist.getIsPublic())
                .userId(userId)
                .username(username)
                .songs(songs)
                .songCount(songs.size())
                .build();
    }
    private String getArtistName(Song song) {
        if (song.getArtists() == null || song.getArtists().isEmpty()) {
            return "Unknown Artist";
        }
        return song.getArtists().iterator().next().getName();
    }
}