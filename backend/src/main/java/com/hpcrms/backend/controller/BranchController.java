package com.hpcrms.backend.controller;

import com.hpcrms.backend.dto.request.CreateBranchRequest;
import com.hpcrms.backend.dto.response.BranchResponse;
import com.hpcrms.backend.entity.Branch;
import com.hpcrms.backend.service.BranchService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor
@Tag(name = "Branches")
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    public List<BranchResponse> getAll() {
        return branchService.getAllBranches();
    }

    @GetMapping("/{id}")
    public BranchResponse getById(@PathVariable Long id) {
        return branchService.getBranchById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SYSTEM_ADMINISTRATOR')")
    public BranchResponse create(@Valid @RequestBody CreateBranchRequest request) {
        Branch branch = Branch.builder()
                .name(request.getName())
                .address(request.getAddress())
                .city(request.getCity())
                .phone(request.getPhone())
                .build();
        return branchService.createBranch(branch);
    }
}
