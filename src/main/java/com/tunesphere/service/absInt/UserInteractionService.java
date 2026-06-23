package com.tunesphere.service.absInt;

import com.tunesphere.dto.SongResponse;
import com.tunesphere.dto.ArtistResponse;
import java.util.List;

public interface UserInteractionService {
    // Лайки
    void likeSong(Long userId, Long songId);
    void unlikeSong(Long userId, Long songId);
    List<SongResponse> getUserLikedSongs(Long userId);

    // Избранное
    void addToFavorites(Long userId, Long songId);
    void removeFromFavorites(Long userId, Long songId);
    List<SongResponse> getUserFavoriteSongs(Long userId);

    // Подписки
    void followArtist(Long userId, Long artistId);
    void unfollowArtist(Long userId, Long artistId);
    List<ArtistResponse> getUserFollowedArtists(Long userId);
}