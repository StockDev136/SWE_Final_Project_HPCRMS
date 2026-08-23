package com.hpcrms.backend.repository;

import com.hpcrms.backend.entity.Employee;
import com.hpcrms.backend.entity.enums.EmployeeRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Employee> findByRole(EmployeeRole role);
    List<Employee> findByBranchIdAndActiveTrue(Long branchId);
}
