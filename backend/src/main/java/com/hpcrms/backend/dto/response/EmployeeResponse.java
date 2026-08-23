package com.hpcrms.backend.dto.response;

import com.hpcrms.backend.entity.enums.EmployeeRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private EmployeeRole role;
    private String branchName;
    private boolean mfaEnabled;
    private boolean active;
}
