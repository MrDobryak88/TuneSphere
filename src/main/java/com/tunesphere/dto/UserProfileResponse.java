package com.tunesphere.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private String avatarUrl;
    private Long songsCount;
    private Long playlistsCount;
    private Long followersCount;
}