package com.tunesphere.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SongResponse {
    private Long id;
    private String title;
    private String artistName;
    private Integer duration;
    private String audioUrl;
    private String coverUrl;
    private Long playCount;
    private String genre;
}