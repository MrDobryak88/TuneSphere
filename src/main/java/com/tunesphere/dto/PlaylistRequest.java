package com.tunesphere.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.Set;

@Data
public class PlaylistRequest {
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 150)
    private String title;

    @Size(max = 500)
    private String description;

    private Boolean isPublic = false;

    private Set<Long> songIds; // для добавления песен при создании
}