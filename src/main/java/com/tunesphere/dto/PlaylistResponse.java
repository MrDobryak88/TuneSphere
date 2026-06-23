package com.tunesphere.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaylistResponse {
    private Long id;
    private String title;
    private String description;
    private Boolean isPublic;
    private Long userId;
    private String username;
    private List<SongResponse> songs;
    private Integer songCount;
}