package com.hpcrms.backend.controller;

import com.hpcrms.backend.dto.request.LoginRequest;
import com.hpcrms.backend.dto.request.RegisterRequest;
import com.hpcrms.backend.dto.response.AuthResponse;
import com.hpcrms.backend.entity.Customer;
import com.hpcrms.backend.repository.CustomerRepository;
import com.hpcrms.backend.security.JwtService;
import com.hpcrms.backend.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthController {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        Customer customer = Customer.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();
        customerRepository.save(customer);

        String token = jwtService.generateToken(customer.getEmail(), "CUSTOMER");
        return new AuthResponse(token, "Bearer", customer.getEmail(), "CUSTOMER");
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtService.generateToken(principal.getUsername(), principal.getRole());
        return new AuthResponse(token, "Bearer", principal.getUsername(), principal.getRole());
    }
}
