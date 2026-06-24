package com.tunesphere.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ActivityResponse {
    private Long id;
    private Long userId;
    private String username;
    private Long songId;
    private String songTitle;
    private String artistName;
    private String action;
    private LocalDateTime createdAt;
}