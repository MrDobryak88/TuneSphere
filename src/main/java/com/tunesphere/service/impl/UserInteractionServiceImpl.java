package com.tunesphere.service.impl;

import com.tunesphere.dto.ArtistResponse;
import com.tunesphere.dto.SongResponse;
import com.tunesphere.entity.Artist;
import com.tunesphere.entity.Song;
import com.tunesphere.entity.User;
import com.tunesphere.repository.ArtistRepository;
import com.tunesphere.repository.SongRepository;
import com.tunesphere.repository.UserRepository;
import com.tunesphere.service.absInt.UserInteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserInteractionServiceImpl implements UserInteractionService {

    private final UserRepository userRepository;
    private final SongRepository songRepository;
    private final ArtistRepository artistRepository;
    private final SongServiceImpl songService;

    @Override
    @Transactional
    public void likeSong(Long userId, Long songId) {
        User user = getUser(userId);
        Song song = getSong(songId);
        user.getLikesSong().add(song);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void unlikeSong(Long userId, Long songId) {
        User user = getUser(userId);
        user.getLikesSong().removeIf(s -> s.getId().equals(songId));
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SongResponse> getUserLikedSongs(Long userId) {
        User user = getUser(userId);
        return user.getLikesSong().stream()
                .map(song -> songService.mapToResponse(song, getArtistName(song)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addToFavorites(Long userId, Long songId) {
        User user = getUser(userId);
        Song song = getSong(songId);
        user.getFavoriteSongs().add(song);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void removeFromFavorites(Long userId, Long songId) {
        User user = getUser(userId);
        user.getFavoriteSongs().removeIf(s -> s.getId().equals(songId));
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SongResponse> getUserFavoriteSongs(Long userId) {
        User user = getUser(userId);
        return user.getFavoriteSongs().stream()
                .map(song -> songService.mapToResponse(song, getArtistName(song)))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void followArtist(Long userId, Long artistId) {
        User user = getUser(userId);
        Artist artist = getArtist(artistId);
        user.getFollowedArtists().add(artist);
        artist.setFollowersCount(artist.getFollowersCount() + 1);
        userRepository.save(user);
        artistRepository.save(artist);
    }

    @Override
    @Transactional
    public void unfollowArtist(Long userId, Long artistId) {
        User user = getUser(userId);
        Artist artist = getArtist(artistId);
        user.getFollowedArtists().removeIf(a -> a.getId().equals(artistId));
        artist.setFollowersCount(Math.max(0, artist.getFollowersCount() - 1));
        userRepository.save(user);
        artistRepository.save(artist);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ArtistResponse> getUserFollowedArtists(Long userId) {
        User user = getUser(userId);
        return user.getFollowedArtists().stream()
                .map(this::mapArtistToResponse)
                .collect(Collectors.toList());
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Song getSong(Long songId) {
        return songRepository.findById(songId)
                .orElseThrow(() -> new RuntimeException("Song not found"));
    }

    private Artist getArtist(Long artistId) {
        return artistRepository.findById(artistId)
                .orElseThrow(() -> new RuntimeException("Artist not found"));
    }

    private String getArtistName(Song song) {
        if (song.getArtists() == null || song.getArtists().isEmpty()) {
            return "Unknown Artist";
        }
        return song.getArtists().iterator().next().getName();
    }

    public ArtistResponse mapArtistToResponse(Artist artist) {
        return ArtistResponse.builder()
                .id(artist.getId())
                .name(artist.getName())
                .bio(artist.getBio())
                .avatarUrl(artist.getAvatarUrl())
                .followersCount(artist.getFollowersCount())
                .build();
    }
}