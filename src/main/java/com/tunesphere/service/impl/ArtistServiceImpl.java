package com.tunesphere.service.impl;

import com.tunesphere.dto.ArtistResponse;
import com.tunesphere.entity.Artist;
import com.tunesphere.repository.ArtistRepository;
import com.tunesphere.service.absInt.ArtistService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArtistServiceImpl implements ArtistService {

    private final ArtistRepository artistRepository;

    @Override
    public List<ArtistResponse> getAllArtists() {
        return artistRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ArtistResponse getArtistById(Long id) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artist not found"));
        return mapToResponse(artist);
    }

    private ArtistResponse mapToResponse(Artist artist) {
        return ArtistResponse.builder()
                .id(artist.getId())
                .name(artist.getName())
                .bio(artist.getBio())
                .avatarUrl(artist.getAvatarUrl() != null ? "/uploads/avatars/" + artist.getAvatarUrl() : null)
                .build();
    }
}