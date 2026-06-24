package com.tunesphere.service.absInt;

import com.tunesphere.dto.SongRequest;
import com.tunesphere.dto.SongResponse;
import com.tunesphere.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Service для управления музыкальными треками в TuneSphere.
 * Отвечает за загрузку, получение и обновление метаданных песен.
 */
public interface SongService {
    /**
     * Обновляет метаданные трека (только для владельца или админа).
     */
    SongResponse updateSong(Long id, SongRequest request, Long userId);

    /**
     * Удаляет трек (только для владельца или админа).
     */
    void deleteSong(Long id, Long userId);

    /**
     * Загружает новый трек с аудиофайлом и опциональной обложкой.
     *
     * @param request   данные о треке
     * @param audioFile аудиофайл (обязательно)
     * @param coverFile обложка (опционально)
     * @return SongResponse с данными созданного трека
     */
     SongResponse uploadSong(SongRequest request, MultipartFile audioFile, MultipartFile coverFile, Long userId) throws IOException ;

    List<SongResponse> getSongsByUser(Long userId);

    /**
     * Возвращает список всех доступных треков.
     */
    List<SongResponse> getAllSongs();

    /**
     * Возвращает информацию о треке по ID.
     */
    SongResponse getSongById(Long id);

    /**
     * Увеличивает счётчик прослушиваний трека (используется при воспроизведении).
     */
     void incrementPlayCount(Long songId, Long userId, String username);
}