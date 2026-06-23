package com.tunesphere.controller;

import com.tunesphere.dto.ArtistResponse;
import com.tunesphere.dto.SongResponse;
import com.tunesphere.security.CustomUserDetails;
import com.tunesphere.service.absInt.UserInteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserInteractionController {

    private final UserInteractionService userInteractionService;

    // ===== ЛАЙКИ =====
    @PostMapping("/likes/songs/{songId}")
    public ResponseEntity<Void> likeSong(
            @PathVariable Long songId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        userInteractionService.likeSong(userDetails.getId(), songId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/likes/songs/{songId}")
    public ResponseEntity<Void> unlikeSong(
            @PathVariable Long songId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        userInteractionService.unlikeSong(userDetails.getId(), songId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/likes/songs")
    public ResponseEntity<List<SongResponse>> getLikedSongs(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(userInteractionService.getUserLikedSongs(userDetails.getId()));
    }

    // ===== ИЗБРАННОЕ =====
    @PostMapping("/favorites/songs/{songId}")
    public ResponseEntity<Void> addToFavorites(
            @PathVariable Long songId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        userInteractionService.addToFavorites(userDetails.getId(), songId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/favorites/songs/{songId}")
    public ResponseEntity<Void> removeFromFavorites(
            @PathVariable Long songId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        userInteractionService.removeFromFavorites(userDetails.getId(), songId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/favorites/songs")
    public ResponseEntity<List<SongResponse>> getFavoriteSongs(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(userInteractionService.getUserFavoriteSongs(userDetails.getId()));
    }

    // ===== ПОДПИСКИ =====
    @PostMapping("/follows/artists/{artistId}")
    public ResponseEntity<Void> followArtist(
            @PathVariable Long artistId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        userInteractionService.followArtist(userDetails.getId(), artistId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/follows/artists/{artistId}")
    public ResponseEntity<Void> unfollowArtist(
            @PathVariable Long artistId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        userInteractionService.unfollowArtist(userDetails.getId(), artistId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/follows/artists")
    public ResponseEntity<List<ArtistResponse>> getFollowedArtists(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(userInteractionService.getUserFollowedArtists(userDetails.getId()));
    }
}