package com.tunesphere.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String SONG_PLAYED_TOPIC = "song-played";

    public void sendSongPlayedEvent(SongPlayedEvent event) {
        kafkaTemplate.send(SONG_PLAYED_TOPIC, event.getSongId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to send SongPlayedEvent", ex);
                    } else {
                        log.info("SongPlayedEvent sent successfully to topic {} for songId={}",
                                SONG_PLAYED_TOPIC, event.getSongId());
                    }
                });
    }
}