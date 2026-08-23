package com.hpcrms.backend.controller;

import com.hpcrms.backend.dto.request.CreateEmployeeRequest;
import com.hpcrms.backend.dto.response.EmployeeResponse;
import com.hpcrms.backend.service.EmployeeService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
@Tag(name = "Employees")
@PreAuthorize("hasRole('SYSTEM_ADMINISTRATOR')")
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EmployeeResponse create(@Valid @RequestBody CreateEmployeeRequest request) {
        return employeeService.createEmployee(
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                request.getPassword(),
                request.getRole(),
                request.getBranchId());
    }

    @GetMapping
    public List<EmployeeResponse> getAll() {
        return employeeService.getAllEmployees();
    }

    @GetMapping("/{id}")
    public EmployeeResponse getById(@PathVariable Long id) {
        return employeeService.getEmployeeById(id);
    }

    @PatchMapping("/{id}/deactivate")
    public EmployeeResponse deactivate(@PathVariable Long id) {
        return employeeService.deactivateEmployee(id);
    }

    @PatchMapping("/{id}/reactivate")
    public EmployeeResponse reactivate(@PathVariable Long id) {
        return employeeService.reactivateEmployee(id);
    }
}