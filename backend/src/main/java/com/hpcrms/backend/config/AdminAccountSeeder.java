package com.hpcrms.backend.config;

import com.hpcrms.backend.entity.Employee;
import com.hpcrms.backend.entity.enums.EmployeeRole;
import com.hpcrms.backend.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates a single default SYSTEM_ADMINISTRATOR account on startup if one
 * does not already exist, so there is always a real, working admin login
 * to bootstrap staff account creation from. Runs every startup but is
 * idempotent — it does nothing once the seeded admin exists.
 *
 * The password is intentionally NOT hardcoded here — it's read from
 * app.admin.default-password, which has no fallback default on purpose.
 * Set it via the ADMIN_DEFAULT_PASSWORD environment variable in production
 * (Railway), or in your gitignored application-local.properties for local
 * dev. If it's not set anywhere, startup fails loudly instead of silently
 * falling back to a known, committed password.
 *
 * Change this password immediately after first login, and consider
 * removing or disabling this seeder entirely once your first real admin
 * account exists.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminAccountSeeder implements CommandLineRunner {

    private static final String DEFAULT_ADMIN_EMAIL = "admin@hpcrms.com";

    @Value("${app.admin.default-password}")
    private String defaultAdminPassword;

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
                .passwordHash(passwordEncoder.encode(defaultAdminPassword))
                .role(EmployeeRole.SYSTEM_ADMINISTRATOR)
                .build();
        employeeRepository.save(admin);
    }
}
