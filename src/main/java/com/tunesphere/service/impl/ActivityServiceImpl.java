package com.tunesphere.service.impl;

import com.tunesphere.dto.ActivityResponse;
import com.tunesphere.entity.ActivityLog;
import com.tunesphere.entity.Song;
import com.tunesphere.entity.User;
import com.tunesphere.repository.ActivityLogRepository;
import com.tunesphere.repository.SongRepository;
import com.tunesphere.repository.UserRepository;
import com.tunesphere.service.absInt.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityServiceImpl implements ActivityService {

    private final ActivityLogRepository activityLogRepository;
    private final SongRepository songRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ActivityResponse> getMyActivity(Long userId) {
        return activityLogRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityResponse> getGlobalActivity() {
        return activityLogRepository.findAllRecent()
                .stream()
                .limit(50) // Последние 50 действий
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ActivityResponse mapToResponse(ActivityLog log) {
        String username = "Unknown";

        if (log.getUserId() != null) {
            username = userRepository.findById(log.getUserId())
                    .map(User::getUsername)
                    .orElse("Unknown");
        }

        // Выносим получение информации о песне в отдельный метод
        String[] songInfo = getSongInfo(log.getSongId());

        return ActivityResponse.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .username(username)
                .songId(log.getSongId())
                .songTitle(songInfo[0])
                .artistName(songInfo[1])
                .action(log.getAction())
                .createdAt(log.getCreatedAt())
                .build();
    }

    // Новый вспомогательный метод
    private String[] getSongInfo(Long songId) {
        if (songId == null) {
            return new String[]{"Unknown", "Unknown Artist"};
        }

        return songRepository.findById(songId)
                .map(song -> {
                    String title = song.getTitle();
                    String artistName = "Unknown Artist";

                    if (song.getArtists() != null && !song.getArtists().isEmpty()) {
                        artistName = song.getArtists().iterator().next().getName();
                    }

                    return new String[]{title, artistName};
                })
                .orElse(new String[]{"Unknown", "Unknown Artist"});
    }
}