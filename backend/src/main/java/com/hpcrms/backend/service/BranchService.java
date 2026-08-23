package com.hpcrms.backend.service;

import com.hpcrms.backend.dto.response.BranchResponse;
import com.hpcrms.backend.entity.Branch;

import java.util.List;

public interface BranchService {

    BranchResponse createBranch(Branch branch);

    List<BranchResponse> getAllBranches();

    BranchResponse getBranchById(Long id);
}
