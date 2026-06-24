package com.tunesphere.controller;

import com.tunesphere.repository.UserRepository;
import com.tunesphere.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final SongRepository songRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalSongs", songRepository.count());
        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/songs/{id}")
    public ResponseEntity<Void> deleteAnySong(@PathVariable Long id) {
        songRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}