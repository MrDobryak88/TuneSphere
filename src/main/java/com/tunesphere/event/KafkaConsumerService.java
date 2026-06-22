package com.tunesphere.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaConsumerService {

    // Можно добавить статистику, рекомендации и т.д. позже

    @KafkaListener(topics = "song-played", groupId = "tunesphere-group")
    public void handleSongPlayed(SongPlayedEvent event) {
        log.info("🎵 Song played event received: songId={}, user={}, time={}",
                event.getSongId(), event.getUsername(), event.getPlayedAt());

        // Здесь можно обновлять Redis-кэш, считать статистику, отправлять уведомления и т.д.
    }
}