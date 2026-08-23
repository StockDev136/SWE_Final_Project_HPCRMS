package com.hpcrms.backend.service.impl;

import com.hpcrms.backend.dto.response.BranchResponse;
import com.hpcrms.backend.entity.Branch;
import com.hpcrms.backend.exception.ResourceNotFoundException;
import com.hpcrms.backend.mapper.BranchMapper;
import com.hpcrms.backend.repository.BranchRepository;
import com.hpcrms.backend.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BranchServiceImpl implements BranchService {

    private final BranchRepository branchRepository;
    private final BranchMapper branchMapper;

    @Override
    @Transactional
    public BranchResponse createBranch(Branch branch) {
        return branchMapper.toResponse(branchRepository.save(branch));
    }

    @Override
    public List<BranchResponse> getAllBranches() {
        return branchMapper.toResponseList(branchRepository.findAll());
    }

    @Override
    public BranchResponse getBranchById(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + id));
        return branchMapper.toResponse(branch);
    }
}
