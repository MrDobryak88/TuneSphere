package com.tunesphere.service.impl;

import com.tunesphere.dto.UserProfileResponse;
import com.tunesphere.dto.UserUpdateRequest;
import com.tunesphere.entity.User;
import com.tunesphere.repository.PlaylistRepository;
import com.tunesphere.repository.SongRepository;
import com.tunesphere.repository.UserRepository;
import com.tunesphere.service.FileStorageService;
import com.tunesphere.service.absInt.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final SongRepository songRepository;
    private final PlaylistRepository playlistRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return buildProfile(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return buildProfile(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateMyProfile(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new RuntimeException("Username already taken");
            }
            user.setUsername(request.getUsername());
        }
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already taken");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        userRepository.save(user);
        return buildProfile(user);
    }

    private UserProfileResponse buildProfile(User user) {
        long songsCount = songRepository.countByUserId(user.getId());
        long playlistsCount = playlistRepository.countByUserId(user.getId());
        long followersCount = user.getFollowedArtists() != null ? 0 : 0; // у пользователей нет подписчиков в текущей схеме

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .avatarUrl(user.getAvatarUrl())
                .songsCount(songsCount)
                .playlistsCount(playlistsCount)
                .followersCount(followersCount)
                .build();
    }
    @Override
    @Transactional
    public UserProfileResponse uploadAvatar(Long userId, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Сохраняем файл
        String filename = fileStorageService.saveFile(file, "avatar");

        // Обновляем URL аватара в БД
        user.setAvatarUrl("/uploads/avatars/" + filename);
        userRepository.save(user);

        return buildProfile(user);
    }
}