package com.hpcrms.backend.mapper;

import com.hpcrms.backend.dto.response.VehicleResponse;
import com.hpcrms.backend.entity.Vehicle;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface VehicleMapper {

    @Mapping(source = "branch.name", target = "branchName")
    VehicleResponse toResponse(Vehicle vehicle);

    List<VehicleResponse> toResponseList(List<Vehicle> vehicles);
}
