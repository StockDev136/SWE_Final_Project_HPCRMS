package com.hpcrms.backend.mapper;

import com.hpcrms.backend.dto.response.EmployeeResponse;
import com.hpcrms.backend.entity.Employee;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {

    @Mapping(source = "branch.name", target = "branchName")
    EmployeeResponse toResponse(Employee employee);

    List<EmployeeResponse> toResponseList(List<Employee> employees);
}
