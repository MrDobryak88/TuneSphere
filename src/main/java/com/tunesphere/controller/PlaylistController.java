package com.tunesphere.controller;

import com.tunesphere.dto.PlaylistRequest;
import com.tunesphere.dto.PlaylistResponse;
import com.tunesphere.security.CustomUserDetails;
import com.tunesphere.service.absInt.PlaylistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/playlists")
@RequiredArgsConstructor
public class PlaylistController {

    private final PlaylistService playlistService;

    @PostMapping
    public ResponseEntity<PlaylistResponse> createPlaylist(
            @Valid @RequestBody PlaylistRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getUserIdFromDetails(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(playlistService.createPlaylist(request, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaylistResponse> getPlaylistById(@PathVariable Long id) {
        return ResponseEntity.ok(playlistService.getPlaylistById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PlaylistResponse>> getUserPlaylists(@PathVariable Long userId) {
        return ResponseEntity.ok(playlistService.getUserPlaylists(userId));
    }

    @GetMapping("/public")
    public ResponseEntity<List<PlaylistResponse>> getPublicPlaylists() {
        return ResponseEntity.ok(playlistService.getPublicPlaylists());
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaylistResponse> updatePlaylist(
            @PathVariable Long id,
            @Valid @RequestBody PlaylistRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getUserIdFromDetails(userDetails);
        return ResponseEntity.ok(playlistService.updatePlaylist(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlaylist(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getUserIdFromDetails(userDetails);
        playlistService.deletePlaylist(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/songs/{songId}")
    public ResponseEntity<PlaylistResponse> addSong(
            @PathVariable Long id,
            @PathVariable Long songId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getUserIdFromDetails(userDetails);
        return ResponseEntity.ok(playlistService.addSongToPlaylist(id, songId, userId));
    }

    @DeleteMapping("/{id}/songs/{songId}")
    public ResponseEntity<PlaylistResponse> removeSong(
            @PathVariable Long id,
            @PathVariable Long songId,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long userId = getUserIdFromDetails(userDetails);
        return ResponseEntity.ok(playlistService.removeSongFromPlaylist(id, songId, userId));
    }

    private Long getUserIdFromDetails(UserDetails userDetails) {
        if (userDetails instanceof CustomUserDetails customUserDetails) {
            return customUserDetails.getId();
        }
        throw new RuntimeException("Invalid user details");
    }
}