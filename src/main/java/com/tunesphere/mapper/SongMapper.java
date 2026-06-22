package com.tunesphere.mapper;

import com.tunesphere.dto.SongRequest;
import com.tunesphere.dto.SongResponse;
import com.tunesphere.entity.Song;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SongMapper {

    @Mapping(target = "artistName", source = "artists", qualifiedByName = "getMainArtistName")
    SongResponse toResponse(Song song);

    Song toEntity(SongRequest request);
}