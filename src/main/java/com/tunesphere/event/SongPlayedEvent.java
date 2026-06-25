package com.tunesphere.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SongPlayedEvent {

    private Long songId;
    private Long userId;
    private String username;
    private LocalDateTime playedAt;
    private Integer durationSeconds;
}