package com.tunesphere.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    @Value("${app.upload.avatars-dir:./uploads/avatars}")
    private String avatarsDir;

    @Value("${app.upload.covers-dir:./uploads/covers}")
    private String coversDir;

    @Value("${app.upload.songs-dir:./uploads/songs}")
    private String songsDir;

    public String saveFile(MultipartFile file, String type) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");

        String uploadDir = getUploadDir(type);
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        String extension = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + extension;

        Path filePath = uploadPath.resolve(filename);
        file.transferTo(filePath);

        log.info("File saved: {}", filePath);
        return filename;
    }

    private String getUploadDir(String type) {
        return switch (type.toLowerCase()) {
            case "avatar" -> avatarsDir;
            case "cover" -> coversDir;
            case "song" -> songsDir;
            default -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }

    private String getExtension(String filename) {
        return filename != null && filename.contains(".")
                ? filename.substring(filename.lastIndexOf("."))
                : ".bin";
    }
}