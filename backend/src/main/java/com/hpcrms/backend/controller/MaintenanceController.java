package com.hpcrms.backend.controller;

import com.hpcrms.backend.dto.request.CompleteMaintenanceRequest;
import com.hpcrms.backend.dto.request.ScheduleMaintenanceRequest;
import com.hpcrms.backend.dto.response.MaintenanceRecordResponse;
import com.hpcrms.backend.entity.enums.MaintenanceStatus;
import com.hpcrms.backend.service.MaintenanceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/maintenance")
@RequiredArgsConstructor
@Tag(name = "Maintenance")
@PreAuthorize("hasAnyRole('FLEET_MANAGER', 'SYSTEM_ADMINISTRATOR')")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MaintenanceRecordResponse schedule(@Valid @RequestBody ScheduleMaintenanceRequest request) {
        return maintenanceService.scheduleMaintenance(
                request.getVehicleId(), request.getScheduledDate(), request.getDescription());
    }

    @PatchMapping("/{id}/start")
    public MaintenanceRecordResponse start(@PathVariable Long id) {
        return maintenanceService.startMaintenance(id);
    }

    @PatchMapping("/{id}/complete")
    public MaintenanceRecordResponse complete(
            @PathVariable Long id,
            @RequestBody(required = false) CompleteMaintenanceRequest request) {
        String notes = request != null ? request.getCompletionNotes() : null;
        return maintenanceService.completeMaintenance(id, notes);
    }

    @GetMapping
    public List<MaintenanceRecordResponse> getAll(
            @RequestParam(required = false) MaintenanceStatus status,
            @RequestParam(required = false) Long vehicleId) {
        return maintenanceService.getAllMaintenanceRecords(status, vehicleId);
    }
}
