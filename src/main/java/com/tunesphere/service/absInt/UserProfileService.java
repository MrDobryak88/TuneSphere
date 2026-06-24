package com.tunesphere.service.absInt;

import com.tunesphere.dto.UserProfileResponse;
import com.tunesphere.dto.UserUpdateRequest;

public interface UserProfileService {
    UserProfileResponse getMyProfile(Long userId);
    UserProfileResponse getUserById(Long userId);
    UserProfileResponse updateMyProfile(Long userId, UserUpdateRequest request);
}