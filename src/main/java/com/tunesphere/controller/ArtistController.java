    package com.tunesphere.controller;

    import com.tunesphere.dto.ArtistResponse;
    import com.tunesphere.service.impl.ArtistServiceImpl;
    import lombok.RequiredArgsConstructor;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;

    import java.util.List;

    @RestController
    @RequestMapping("/api/v1/artists")
    @RequiredArgsConstructor
    public class ArtistController {

        private final ArtistServiceImpl artistService;

        @GetMapping
        public ResponseEntity<List<ArtistResponse>> getAllArtists() {
            return ResponseEntity.ok(artistService.getAllArtists());
        }

        @GetMapping("/{id}")
        public ResponseEntity<ArtistResponse> getArtistById(@PathVariable Long id) {
            return ResponseEntity.ok(artistService.getArtistById(id));
        }
    }
