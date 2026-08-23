package com.hpcrms.backend.repository;

import com.hpcrms.backend.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    Optional<Branch> findByName(String name);
}
