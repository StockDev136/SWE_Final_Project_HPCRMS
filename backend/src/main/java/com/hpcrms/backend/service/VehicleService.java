package com.hpcrms.backend.service;

import com.hpcrms.backend.dto.response.VehicleResponse;
import com.hpcrms.backend.entity.Vehicle;
import com.hpcrms.backend.entity.enums.VehicleCategory;
import com.hpcrms.backend.entity.enums.VehicleStatus;

import java.time.LocalDate;
import java.util.List;

public interface VehicleService {

    List<VehicleResponse> searchAvailableVehicles(Long branchId, VehicleCategory category,
                                                    LocalDate startDate, LocalDate endDate);

    List<VehicleResponse> getAllVehicles(Long branchId);

    VehicleResponse getVehicleById(Long id);

    VehicleResponse createVehicle(Vehicle vehicle);

    VehicleResponse updateVehicle(Long id, Vehicle updates);

    VehicleResponse updateVehicleStatus(Long id, VehicleStatus status);
}
