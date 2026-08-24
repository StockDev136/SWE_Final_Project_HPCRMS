package com.hpcrms.backend.dto.request;

import com.hpcrms.backend.entity.enums.EmployeeRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateEmployeeRequest {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).{8,}$",
        message = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character"
    )
    private String password;

    @NotNull
    private EmployeeRole role;

    /** Optional — some roles (e.g. SYSTEM_ADMINISTRATOR) span all branches. */
    private Long branchId;
}
