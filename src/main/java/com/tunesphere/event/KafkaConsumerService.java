package com.tunesphere.event;

import com.tunesphere.entity.ActivityLog;
import com.tunesphere.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final ActivityLogRepository activityLogRepository;

    @KafkaListener(topics = "song-played", groupId = "tunesphere-group")
    public void handleSongPlayed(SongPlayedEvent event) {
        log.info(" Получено событие: songId={}, user={}", event.getSongId(), event.getUsername());

        try {
            // Сохраняем активность в БД (асинхронно, не блокируя плеер!)
            ActivityLog logUser = ActivityLog.builder()
                    .userId(event.getUserId())
                    .songId(event.getSongId())
                    .action("PLAYED")
                    .createdAt(LocalDateTime.now())
                    .build();

            activityLogRepository.save(logUser);
            log.info(" Активность сохранена: user {} послушал песню {}",
                    event.getUserId(), event.getSongId());
        } catch (Exception e) {
            log.error(" Ошибка сохранения активности: {}", e.getMessage());
        }
    }
}