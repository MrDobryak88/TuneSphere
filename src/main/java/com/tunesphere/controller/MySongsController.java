package com.tunesphere.controller;

import com.tunesphere.dto.SongRequest;
import com.tunesphere.dto.SongResponse;
import com.tunesphere.security.CustomUserDetails;
import com.tunesphere.service.absInt.SongService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/my/songs")
@RequiredArgsConstructor
public class MySongsController {

    private final SongService songService;

    @GetMapping
    public ResponseEntity<List<SongResponse>> getMySongs(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(songService.getSongsByUser(userDetails.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SongResponse> updateMySong(
            @PathVariable Long id,
            @RequestBody SongRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(songService.updateSong(id, request, userDetails.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMySong(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        songService.deleteSong(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}