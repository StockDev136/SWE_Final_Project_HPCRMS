package com.hpcrms.backend.controller;

import com.hpcrms.backend.dto.request.CreateVehicleRequest;
import com.hpcrms.backend.dto.request.UpdateVehicleStatusRequest;
import com.hpcrms.backend.dto.response.VehicleResponse;
import com.hpcrms.backend.entity.Branch;
import com.hpcrms.backend.entity.Vehicle;
import com.hpcrms.backend.entity.enums.VehicleCategory;
import com.hpcrms.backend.service.VehicleService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping("/search")
    public List<VehicleResponse> search(
            @RequestParam Long branchId,
            @RequestParam(required = false) VehicleCategory category,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return vehicleService.searchAvailableVehicles(branchId, category, startDate, endDate);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'BRANCH_MANAGER', 'RENTAL_AGENT', 'SYSTEM_ADMINISTRATOR')")
    public List<VehicleResponse> getAll(@RequestParam(required = false) Long branchId) {
        return vehicleService.getAllVehicles(branchId);
    }

    @GetMapping("/{id}")
    public VehicleResponse getById(@PathVariable Long id) {
        return vehicleService.getVehicleById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'BRANCH_MANAGER')")
    public VehicleResponse create(@Valid @RequestBody CreateVehicleRequest request) {
        Vehicle vehicle = Vehicle.builder()
                .licensePlate(request.getLicensePlate())
                .make(request.getMake())
                .model(request.getModel())
                .category(request.getCategory())
                .branch(Branch.builder().id(request.getBranchId()).build())
                .dailyRate(request.getDailyRate())
                .imageUrl(request.getImageUrl())
                .build();
        return vehicleService.createVehicle(vehicle);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'BRANCH_MANAGER')")
    public VehicleResponse update(@PathVariable Long id, @Valid @RequestBody CreateVehicleRequest request) {
        Vehicle updates = Vehicle.builder()
                .make(request.getMake())
                .model(request.getModel())
                .category(request.getCategory())
                .branch(Branch.builder().id(request.getBranchId()).build())
                .dailyRate(request.getDailyRate())
                .imageUrl(request.getImageUrl())
                .build();
        return vehicleService.updateVehicle(id, updates);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('FLEET_MANAGER', 'BRANCH_MANAGER', 'RENTAL_AGENT')")
    public VehicleResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateVehicleStatusRequest request) {
        return vehicleService.updateVehicleStatus(id, request.getStatus());
    }
}
