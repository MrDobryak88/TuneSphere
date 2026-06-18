package com.tunesphere.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    public String generateToken(UserDetails userDetails) { return "x"; } // реализуй
    public String extractUsername(String token) { return "x";}
    public boolean isTokenValid(String token, UserDetails userDetails) { return false; }
}