package com.hpcrms.backend.mapper;

import com.hpcrms.backend.dto.response.BranchResponse;
import com.hpcrms.backend.entity.Branch;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BranchMapper {
    BranchResponse toResponse(Branch branch);
    List<BranchResponse> toResponseList(List<Branch> branches);
}
