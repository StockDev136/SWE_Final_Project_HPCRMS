package com.hpcrms.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String firstName;

    @Column(nullable = false, length = 50)
    private String lastName;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 30)
    private String driverLicenseNumber;

    private LocalDate dateOfBirth;

    private LocalDate licenseExpirationDate;

    @Column(nullable = false)
    private String passwordHash;

    @Builder.Default
    private boolean identityVerified = false;

    @Builder.Default
    private int failedLoginAttempts = 0;

    @Builder.Default
    private boolean accountLocked = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
