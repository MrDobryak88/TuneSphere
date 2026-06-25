package com.tunesphere.service.absInt;

import com.tunesphere.dto.UserProfileResponse;
import com.tunesphere.dto.UserUpdateRequest;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface UserProfileService {
    UserProfileResponse getMyProfile(Long userId);
    UserProfileResponse getUserById(Long userId);
    UserProfileResponse updateMyProfile(Long userId, UserUpdateRequest request);
    UserProfileResponse uploadAvatar(Long userId, MultipartFile file) throws IOException;
}