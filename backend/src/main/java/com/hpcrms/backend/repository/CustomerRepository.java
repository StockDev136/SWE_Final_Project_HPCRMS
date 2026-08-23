package com.hpcrms.backend.repository;

import com.hpcrms.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("""
            SELECT c FROM Customer c
            WHERE LOWER(c.email) LIKE LOWER(CONCAT('%', :term, '%'))
            OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :term, '%'))
            OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :term, '%'))
            ORDER BY c.lastName, c.firstName
            """)
    List<Customer> search(@Param("term") String term);
}
