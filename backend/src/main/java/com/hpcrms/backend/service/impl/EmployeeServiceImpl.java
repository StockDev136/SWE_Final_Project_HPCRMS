package com.hpcrms.backend.service.impl;

import com.hpcrms.backend.dto.response.EmployeeResponse;
import com.hpcrms.backend.entity.Branch;
import com.hpcrms.backend.entity.Employee;
import com.hpcrms.backend.entity.enums.EmployeeRole;
import com.hpcrms.backend.exception.ResourceNotFoundException;
import com.hpcrms.backend.mapper.EmployeeMapper;
import com.hpcrms.backend.repository.BranchRepository;
import com.hpcrms.backend.repository.EmployeeRepository;
import com.hpcrms.backend.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final EmployeeMapper employeeMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public EmployeeResponse createEmployee(String firstName, String lastName, String email,
                                           String password, EmployeeRole role, Long branchId) {
        if (employeeRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An employee account with this email already exists");
        }

        Branch branch = null;
        if (branchId != null) {
            branch = branchRepository.findById(branchId)
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + branchId));
        }

        Employee employee = Employee.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role(role)
                .branch(branch)
                .build();

        return employeeMapper.toResponse(employeeRepository.save(employee));
    }

    @Override
    public List<EmployeeResponse> getAllEmployees() {
        return employeeMapper.toResponseList(employeeRepository.findAll());
    }

    @Override
    public EmployeeResponse getEmployeeById(Long id) {
        return employeeMapper.toResponse(findEmployeeOrThrow(id));
    }

    @Override
    @Transactional
    public EmployeeResponse deactivateEmployee(Long id) {
        Employee employee = findEmployeeOrThrow(id);
        employee.setActive(false);
        return employeeMapper.toResponse(employeeRepository.save(employee));
    }

    @Override
    @Transactional
    public EmployeeResponse reactivateEmployee(Long id) {
        Employee employee = findEmployeeOrThrow(id);
        employee.setActive(true);
        return employeeMapper.toResponse(employeeRepository.save(employee));
    }

    private Employee findEmployeeOrThrow(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + id));
    }
}
