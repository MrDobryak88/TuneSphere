package com.tunesphere.controller;

import com.tunesphere.dto.ActivityResponse;
import com.tunesphere.security.CustomUserDetails;
import com.tunesphere.service.absInt.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping("/me")
    public ResponseEntity<List<ActivityResponse>> getMyActivity(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(activityService.getMyActivity(userDetails.getId()));
    }

    @GetMapping("/global")
    public ResponseEntity<List<ActivityResponse>> getGlobalActivity() {
        return ResponseEntity.ok(activityService.getGlobalActivity());
    }
}