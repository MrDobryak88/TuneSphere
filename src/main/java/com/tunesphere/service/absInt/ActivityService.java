package com.tunesphere.service.absInt;

import com.tunesphere.dto.ActivityResponse;
import java.util.List;

public interface ActivityService {
    List<ActivityResponse> getMyActivity(Long userId);
    List<ActivityResponse> getGlobalActivity();
}