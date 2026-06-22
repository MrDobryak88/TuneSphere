package com.tunesphere.service.absInt;

import com.tunesphere.dto.ArtistResponse;
import java.util.List;

public interface ArtistService {
    List<ArtistResponse> getAllArtists();
    ArtistResponse getArtistById(Long id);
}