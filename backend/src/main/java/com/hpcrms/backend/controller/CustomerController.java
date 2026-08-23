package com.hpcrms.backend.controller;

import com.hpcrms.backend.dto.response.CustomerResponse;
import com.hpcrms.backend.service.CustomerService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
@Tag(name = "Customers")
@PreAuthorize("hasAnyRole('RENTAL_AGENT', 'BRANCH_MANAGER', 'FLEET_MANAGER', 'FINANCE_DEPARTMENT', 'SYSTEM_ADMINISTRATOR')")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping("/search")
    public List<CustomerResponse> search(@RequestParam String term) {
        return customerService.search(term);
    }
}
