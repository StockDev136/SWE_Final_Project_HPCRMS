package com.hpcrms.backend.service;

import com.hpcrms.backend.dto.response.EmployeeResponse;
import com.hpcrms.backend.entity.enums.EmployeeRole;

import java.util.List;

public interface EmployeeService {

    EmployeeResponse createEmployee(String firstName, String lastName, String email,
                                    String password, EmployeeRole role, Long branchId);

    List<EmployeeResponse> getAllEmployees();

    EmployeeResponse getEmployeeById(Long id);

    EmployeeResponse deactivateEmployee(Long id);

    EmployeeResponse reactivateEmployee(Long id);
}
