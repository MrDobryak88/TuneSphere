package com.tunesphere.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SongRequest {

    @NotBlank
    private String title;

    @NotNull
    private Long artistId;

    private Long albumId;

    @Positive
    private Integer duration;

    @NotBlank
    private String audioUrl;

    private String coverUrl;
    private String genre;
}