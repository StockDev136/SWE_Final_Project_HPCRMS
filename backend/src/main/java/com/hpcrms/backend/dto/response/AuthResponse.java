package com.hpcrms.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String tokenType;
    private String email;
    private String role;
}
