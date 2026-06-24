package com.tunesphere.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserUpdateRequest {
    @Size(min = 3, max = 50)
    private String username;

    @Email
    private String email;

    @Size(min = 6)
    private String password;

    private String avatarUrl;
}