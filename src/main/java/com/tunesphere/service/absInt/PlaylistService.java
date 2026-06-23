package com.tunesphere.service.absInt;

import com.tunesphere.dto.PlaylistRequest;
import com.tunesphere.dto.PlaylistResponse;
import java.util.List;

public interface PlaylistService {
    PlaylistResponse createPlaylist(PlaylistRequest request, Long userId);
    PlaylistResponse getPlaylistById(Long id);
    List<PlaylistResponse> getUserPlaylists(Long userId);
    List<PlaylistResponse> getPublicPlaylists();
    PlaylistResponse updatePlaylist(Long id, PlaylistRequest request, Long userId);
    void deletePlaylist(Long id, Long userId);
    PlaylistResponse addSongToPlaylist(Long playlistId, Long songId, Long userId);
    PlaylistResponse removeSongFromPlaylist(Long playlistId, Long songId, Long userId);
}