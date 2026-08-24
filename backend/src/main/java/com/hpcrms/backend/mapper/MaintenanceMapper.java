package com.hpcrms.backend.mapper;

import com.hpcrms.backend.dto.response.MaintenanceRecordResponse;
import com.hpcrms.backend.entity.MaintenanceRecord;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MaintenanceMapper {

    @Mapping(source = "vehicle.id", target = "vehicleId")
    @Mapping(target = "vehicleDescription",
            expression = "java(maintenanceRecord.getVehicle().getMake() + \" \" + maintenanceRecord.getVehicle().getModel() + \" (\" + maintenanceRecord.getVehicle().getLicensePlate() + \")\")")
    MaintenanceRecordResponse toResponse(MaintenanceRecord maintenanceRecord);

    List<MaintenanceRecordResponse> toResponseList(List<MaintenanceRecord> records);
}
