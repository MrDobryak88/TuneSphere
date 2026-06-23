package com.tunesphere.mapper;

import com.tunesphere.dto.SongRequest;
import com.tunesphere.dto.SongResponse;
import com.tunesphere.entity.Artist;
import com.tunesphere.entity.Song;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Set;

@Mapper(componentModel = "spring")
public interface SongMapper {

    @Mapping(target = "artistName", source = "artists", qualifiedByName = "getMainArtistName")
    SongResponse toResponse(Song song);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "playCount", ignore = true)
    @Mapping(target = "lyrics", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "album", ignore = true)
    @Mapping(target = "playlists", ignore = true)
    @Mapping(target = "artists", ignore = true)  // <-- ИГНОРИРУЕМ, артисты добавляются вручную
    Song toEntity(SongRequest request);

    @Named("getMainArtistName")
    default String getMainArtistName(Set<Artist> artists) {
        if (artists == null || artists.isEmpty()) {
            return "Unknown Artist";
        }
        return artists.iterator().next().getName();
    }
}