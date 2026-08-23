package com.hpcrms.backend.config;

import com.hpcrms.backend.entity.Employee;
import com.hpcrms.backend.entity.enums.EmployeeRole;
import com.hpcrms.backend.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates a single default SYSTEM_ADMINISTRATOR account on startup if one
 * does not already exist, so there is always a real, working admin login
 * to bootstrap staff account creation from. Runs every startup but is
 * idempotent — it does nothing once the seeded admin exists.
 *
 * Change this password immediately after first login, and remove or
 * disable this seeder before any real deployment.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminAccountSeeder implements CommandLineRunner {

    private static final String DEFAULT_ADMIN_EMAIL = "admin@hpcrms.com";
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@12345";

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (employeeRepository.existsByEmail(DEFAULT_ADMIN_EMAIL)) {
            return;
        }

        Employee admin = Employee.builder()
                .firstName("System")
                .lastName("Administrator")
                .email(DEFAULT_ADMIN_EMAIL)
                .passwordHash(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD))
                .role(EmployeeRole.SYSTEM_ADMINISTRATOR)
                .build();
        employeeRepository.save(admin);

        log.warn("=================================================================");
        log.warn("Seeded default admin account — CHANGE THIS PASSWORD IMMEDIATELY");
        log.warn("  email:    {}", DEFAULT_ADMIN_EMAIL);
        log.warn("  password: {}", DEFAULT_ADMIN_PASSWORD);
        log.warn("=================================================================");
    }
}
